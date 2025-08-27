import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// API para registrar pagamentos múltiplos de fiados para um cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cliente_id, pagamentos } = body

    if (!cliente_id) {
      return NextResponse.json({ error: 'Cliente ID é obrigatório' }, { status: 400 })
    }

    if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
      return NextResponse.json({ error: 'Lista de pagamentos é obrigatória' }, { status: 400 })
    }

    // Validar e normalizar pagamentos
    const pagamentosNorm = pagamentos.map((p: any) => ({
      tipo: p?.tipo_pagamento || p?.tipo || 'dinheiro',
      valor: Math.round(((Number.parseFloat(p?.valor) || 0) + Number.EPSILON) * 100) / 100
    }))

    // Calcular total (excluir pagamentos 'fiado')
    const totalPagamento = pagamentosNorm.reduce((s: number, p: any) => {
      if (p.tipo === 'fiado') return s
      return s + (Number(p.valor) || 0)
    }, 0)

    if (totalPagamento <= 0) {
      return NextResponse.json({ error: 'Valor total deve ser maior que zero' }, { status: 400 })
    }

    // Buscar fiados em aberto do cliente
    const fiadosAbertos = await prisma.fiados.findMany({
      where: { 
        cliente_id: Number(cliente_id),
        status: { in: ['aberto', 'parcial'] }
      },
      orderBy: { data_fiado: 'asc' } // pagar os mais antigos primeiro
    })

    if (fiadosAbertos.length === 0) {
      return NextResponse.json({ error: 'Cliente não possui fiados em aberto' }, { status: 400 })
    }

    const cliente = await prisma.clientes.findUnique({
      where: { id: Number(cliente_id) }
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    const debitoAtual = Number(cliente.debito_atual || 0)
    if (totalPagamento > debitoAtual) {
      return NextResponse.json({
        error: `Valor total (R$ ${totalPagamento.toFixed(2)}) excede o débito atual (R$ ${debitoAtual.toFixed(2)})`
      }, { status: 400 })
    }

    // Executar transação para distribuir pagamentos pelos fiados
    let result: any = null

    // retry loop para tratar P2028 (transaction invalid) com backoff
    const maxAttempts = 3
    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const pagamentosRegistrados: any[] = []
          const movimentosRegistrados: any[] = []
          let valorRestante = totalPagamento

          // Pegar o primeiro tipo de pagamento válido para usar nos registros
          const tipoPrimario = pagamentosNorm.find(p => p.tipo !== 'fiado')?.tipo || 'dinheiro'

          // Distribuir pagamento pelos fiados em aberto
          for (const fiado of fiadosAbertos) {
            if (valorRestante <= 0) break

            const valorDevido = Number(fiado.valor_restante)
            if (valorDevido <= 0) continue

            const valorAplicado = Math.min(valorRestante, valorDevido)

            // Registrar pagamento
            const pagamentoRegistrado = await tx.pagamentos_fiado.create({
              data: {
                fiado_id: fiado.id,
                valor_pagamento: valorAplicado,
                forma_pagamento: tipoPrimario as any,
                observacoes: pagamentos.length > 1 ? 'Pagamento múltiplo - valor distribuído' : 'Pagamento via módulo'
              }
            })
            pagamentosRegistrados.push(pagamentoRegistrado)

            // Atualizar fiado
            const novoValorPago = Number(fiado.valor_pago) + valorAplicado
            const novoValorRestante = Number(fiado.valor_original) - novoValorPago
            const novoStatus = novoValorRestante <= 0 ? 'quitado' : novoValorPago > 0 ? 'parcial' : 'aberto'

            await tx.fiados.update({
              where: { id: fiado.id },
              data: {
                valor_pago: novoValorPago,
                valor_restante: Math.max(0, novoValorRestante),
                status: novoStatus
              }
            })

            // Registrar movimento (raw SQL dentro da transação)
            const descricaoMov = `Pagamento ${tipoPrimario} - fiado #${fiado.id}`
            const referenciaMov = `pagamento:${pagamentoRegistrado.id}`
            await tx.$executeRaw`
              INSERT INTO fiado_movimentos (cliente_id, fiado_id, tipo, direcao, valor, descricao, referencia, criado_por, data_movimento)
              VALUES (${Number(cliente_id)}, ${fiado.id}, ${'pagamento'}, ${'credito'}, ${valorAplicado}, ${descricaoMov}, ${referenciaMov}, ${'PDV'}, NOW())
            `
            const [movimento]: any = await tx.$queryRaw`
              SELECT * FROM fiado_movimentos WHERE id = LAST_INSERT_ID()
            `
            movimentosRegistrados.push(movimento)

            valorRestante -= valorAplicado
          }

          // Atualizar débito do cliente
          const clienteAtualizado = await tx.clientes.update({
            where: { id: Number(cliente_id) },
            data: {
              debito_atual: { decrement: totalPagamento }
            }
          })

          return {
            pagamentos: pagamentosRegistrados,
            movimentos: movimentosRegistrados,
            cliente: clienteAtualizado,
            total_pago: totalPagamento,
            valor_nao_aplicado: valorRestante
          }
        })

        // sucesso, sair do loop
        break
      } catch (txErr: any) {
        // Se for erro de transação inválida (P2028), tentar novamente com backoff
        if (txErr?.code === 'P2028') {
          console.warn(`Transação inválida detectada (P2028) na tentativa ${attempt}, tentando novamente...`)
          if (attempt < maxAttempts) {
            // backoff exponencial leve
            await sleep(200 * attempt)
            continue
          }
          // exauriu tentativas
          console.error('Exauridas tentativas para transação (P2028).')
          throw txErr
        }

        // Se o banco não está acessível, P1001, retornar erro com instruções claras
        if (txErr?.code === 'P1001') {
          console.error('Erro de conexão com o banco detectado (P1001):', txErr.message)
          throw txErr
        }

        console.error('Erro na transação de pagamentos:', txErr)
        throw txErr
      }
    }

    console.log('Pagamentos de fiado registrados:', {
      cliente_id,
      total_pagamentos: result.pagamentos.length,
      total_valor: totalPagamento,
      total_movimentos: result.movimentos.length
    })

    return NextResponse.json({
      success: true,
      total_pagamentos: result.pagamentos.length,
      total_movimentos: result.movimentos.length,
      debito_anterior: debitoAtual,
      debito_atual: Number(result.cliente.debito_atual),
      aplicado: totalPagamento - result.valor_nao_aplicado,
      restante_nao_aplicado: result.valor_nao_aplicado,
      detalhes: result.pagamentos.map((p: any) => ({
        fiado_id: p.fiado_id,
        valor: Number(p.valor_pagamento)
      }))
    })

  } catch (error: any) {
    console.error('Erro ao registrar pagamentos de fiado:', error)
    const message = error?.message || String(error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: message
    }, { status: 500 })
  }
}
