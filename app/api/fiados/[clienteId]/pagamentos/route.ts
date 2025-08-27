import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function POST(request: NextRequest, context: any) {
  try {
    const { params } = await context
    const clienteId = Number(params.clienteId)
    if (Number.isNaN(clienteId)) {
      return NextResponse.json({ error: 'ID de cliente inválido' }, { status: 400 })
    }

    const body = await request.json()
    const { fiado_id, valor_pagamento, forma_pagamento, observacoes } = body

    // Validações básicas
    if (!fiado_id || !valor_pagamento) {
      return NextResponse.json({ error: 'Fiado ID e valor são obrigatórios' }, { status: 400 })
    }

    const valorPgto = Number(valor_pagamento)
    if (valorPgto <= 0) {
      return NextResponse.json({ error: 'Valor deve ser maior que zero' }, { status: 400 })
    }

    const formaPgto = forma_pagamento || 'dinheiro'
    if (!['dinheiro', 'cartao_debito', 'cartao_credito', 'pix'].includes(formaPgto)) {
      return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 })
    }

    // Buscar o fiado para validação
    const fiado = await prisma.fiados.findUnique({
      where: { id: Number(fiado_id) },
      include: { cliente: true }
    })

    if (!fiado) {
      return NextResponse.json({ error: 'Fiado não encontrado' }, { status: 404 })
    }

    if (fiado.cliente_id !== clienteId) {
      return NextResponse.json({ error: 'Fiado não pertence ao cliente informado' }, { status: 400 })
    }

    if (fiado.status === 'quitado') {
      return NextResponse.json({ error: 'Fiado já foi quitado' }, { status: 400 })
    }

    const valorRestante = Number(fiado.valor_restante)
    if (valorPgto > valorRestante) {
      return NextResponse.json({ 
        error: `Valor do pagamento (R$ ${valorPgto.toFixed(2)}) é maior que o valor restante (R$ ${valorRestante.toFixed(2)})` 
      }, { status: 400 })
    }

    // Executar transação para registrar pagamento e movimento com retry/backoff
    let result: any = null
    const maxAttempts = 3
    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          // Registrar pagamento
          const pagamento = await tx.pagamentos_fiado.create({
            data: {
              fiado_id: Number(fiado_id),
              valor_pagamento: valorPgto,
              forma_pagamento: formaPgto,
              observacoes: observacoes || null,
            }
          })

          // Atualizar fiado
          const novoValorPago = Number(fiado.valor_pago) + valorPgto
          const novoValorRestante = Number(fiado.valor_original) - novoValorPago
          const novoStatus = novoValorRestante <= 0 ? 'quitado' : novoValorPago > 0 ? 'parcial' : 'aberto'

          const fiadoAtualizado = await tx.fiados.update({
            where: { id: Number(fiado_id) },
            data: {
              valor_pago: novoValorPago,
              valor_restante: Math.max(0, novoValorRestante),
              status: novoStatus
            }
          })

          // Atualizar débito do cliente
          const clienteAtualizado = await tx.clientes.update({
            where: { id: clienteId },
            data: {
              debito_atual: { decrement: valorPgto }
            }
          })

          // Registrar movimento no extrato (raw SQL dentro da transação)
          const descricaoMov = `Pagamento fiado #${fiado_id} - ${formaPgto}${observacoes ? ` - ${observacoes}` : ''}`
          const referenciaMov = `pagamento:${pagamento.id}`
          await tx.$executeRaw`
            INSERT INTO fiado_movimentos (cliente_id, fiado_id, tipo, direcao, valor, descricao, referencia, criado_por, data_movimento)
            VALUES (${clienteId}, ${Number(fiado_id)}, ${'pagamento'}, ${'credito'}, ${valorPgto}, ${descricaoMov}, ${referenciaMov}, ${'PDV'}, NOW())
          `
          const [movimento]: any = await tx.$queryRaw`
            SELECT * FROM fiado_movimentos WHERE id = LAST_INSERT_ID()
          `

          return {
            pagamento,
            fiado: fiadoAtualizado,
            cliente: clienteAtualizado,
            movimento
          }
        })

        // sucesso
        break
      } catch (txErr: any) {
        if (txErr?.code === 'P2028') {
          console.warn(`Transação inválida detectada (P2028) na tentativa ${attempt}, tentando novamente...`)
          if (attempt < maxAttempts) {
            await sleep(150 * attempt)
            continue
          }
          console.error('Exauridas tentativas para transação (P2028).')
          throw txErr
        }

        if (txErr?.code === 'P1001') {
          console.error('Erro de conexão com o banco detectado (P1001):', txErr.message)
          throw txErr
        }

        console.error('Erro na transação de pagamento (não relacionado a P2028/P1001):', txErr)
        throw txErr
      }
    }

    console.log('Pagamento de fiado registrado:', {
      pagamento_id: result.pagamento.id,
      fiado_id: fiado_id,
      valor: valorPgto,
      movimento_id: result.movimento.id
    })

    return NextResponse.json({
      success: true,
      pagamento_id: result.pagamento.id,
      movimento_id: result.movimento.id,
      novo_status: result.fiado.status,
      valor_restante: Number(result.fiado.valor_restante),
      debito_cliente: Number(result.cliente.debito_atual)
    })

  } catch (error: any) {
    console.error('Erro ao registrar pagamento de fiado:', error)
    const message = error?.message || String(error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: message 
    }, { status: 500 })
  }
}

// Buscar pagamentos de um cliente
export async function GET(request: NextRequest, context: any) {
  try {
    const { params } = await context
    const clienteId = Number(params.clienteId)
    if (Number.isNaN(clienteId)) {
      return NextResponse.json({ error: 'ID de cliente inválido' }, { status: 400 })
    }

  const pagamentos: any[] = await prisma.$queryRaw`
    SELECT p.*, f.valor_original, f.venda_id
    FROM pagamentos_fiado p
    JOIN fiados f ON f.id = p.fiado_id
    WHERE f.cliente_id = ${clienteId}
    ORDER BY p.data_pagamento DESC
  `

    const pagamentosFormatados = pagamentos.map((p: any) => ({
      id: p.id,
      fiado_id: p.fiado_id,
      venda_id: p.fiados.venda_id,
      valor_pagamento: Number(p.valor_pagamento),
      forma_pagamento: p.forma_pagamento,
      observacoes: p.observacoes,
      data_pagamento: p.data_pagamento,
      valor_original_fiado: Number(p.fiados.valor_original)
    }))

    return NextResponse.json(pagamentosFormatados)

  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
