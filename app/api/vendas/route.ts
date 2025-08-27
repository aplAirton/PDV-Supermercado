import { type NextRequest, NextResponse } from "next/server"
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function GET() {
  try {
    const vendas = await prisma.vendas.findMany({
      include: {
        cliente: true,
        itens: { include: { produto: true } },
      },
      orderBy: { data_venda: 'desc' },
      take: 100,
    })

    const vendasComItens = vendas.map((v: any) => ({
      ...v,
      cliente_nome: v.cliente?.nome ?? null,
      itens: Array.isArray(v.itens)
        ? v.itens.map((it: any) => ({
            produto_nome: it.produto?.nome ?? '',
            quantidade: Number(it.quantidade || 0),
            preco_unitario: Number(it.preco_unitario || 0),
            subtotal: Number(it.subtotal || 0),
          }))
        : [],
    }))

    return NextResponse.json(vendasComItens)
  } catch (error) {
    console.error("Erro ao buscar vendas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let requestId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
  try {
    const body = await request.json()
    console.log(`[vendas][${requestId}] Incoming request body:`, JSON.stringify(body))
    const { cliente_id, itens, total, pagamentos, troco } = body

    // Validações básicas
    if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
      return NextResponse.json({ error: 'Pelo menos uma forma de pagamento é necessária' }, { status: 400 })
    }

    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: 'Itens da venda inválidos' }, { status: 400 })
    }

    const pagamentosNorm = pagamentos.map((p: any) => ({
      tipo: (p.tipo || p.tipo_pagamento || '').toString(),
      valor: Number(p.valor) || 0,
    }))

    const somaPagamentos = pagamentosNorm.reduce((s: number, p: any) => s + (Number(p.valor) || 0), 0)
  console.log('[vendas] pagamentosNorm:', pagamentosNorm, 'somaPagamentos:', somaPagamentos)
    if (Number(somaPagamentos.toFixed(2)) < Number(Number(total).toFixed(2))) {
      return NextResponse.json({ error: 'Valor total dos pagamentos menor que o total da venda' }, { status: 400 })
    }

    // Agregar itens por produto para atualizar estoque apenas uma vez por produto
    const aggByProduct: Record<string, { quantidade: number; preco_unitario: number; subtotal: number }> = {}
    for (const item of itens) {
      const pid = String(Number(item.produto_id))
      const q = Number(item.quantidade || 0)
      const preco = Number(item.preco_unitario || item.preco || 0)
      const sub = Number(item.subtotal ?? preco * q)

      if (!aggByProduct[pid]) aggByProduct[pid] = { quantidade: 0, preco_unitario: preco, subtotal: 0 }
      aggByProduct[pid].quantidade += q
      aggByProduct[pid].subtotal += sub
    }

  console.log('[vendas] aggByProduct (quantidades por produto):', aggByProduct)

    // Resumo da forma de pagamento para salvar em campo simples (label) e enum (campo obrigatório)
    const labelMap: Record<string, string> = {
      dinheiro: 'Dinheiro',
      cartao_debito: 'Cartão Débito',
      cartao_credito: 'Cartão Crédito',
      pix: 'PIX',
      fiado: 'Fiado',
    }

    const resumoLabel = pagamentosNorm
      .map((p: any) => labelMap[p.tipo] || (p.tipo || '').toString())
      .filter(Boolean)
      .join(', ')

    // Forma de pagamento (enum) - usar o primeiro método como valor primário (campo obrigatório no schema)
    const formaEnumValue = (pagamentosNorm[0]?.tipo && ['dinheiro','cartao_debito','cartao_credito','pix','fiado'].includes(pagamentosNorm[0].tipo)) ? pagamentosNorm[0].tipo : 'dinheiro'

    // Calcular total fiado (se houver)
    const totalFiado = pagamentosNorm.filter((p: any) => (p.tipo || '').toString() === 'fiado').reduce((s: number, p: any) => s + (Number(p.valor) || 0), 0)

  // Executar transação com Prisma (timeout aumentado para 15s)
  console.log(`[vendas][${requestId}] Iniciando transação - cliente_id: ${cliente_id} total: ${total} troco: ${troco} totalFiado: ${totalFiado}`)
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const venda = await tx.vendas.create({
        data: {
          cliente_id: cliente_id || null,
          total: Number(total) || 0,
          forma_pagamento: formaEnumValue,
          forma_pagamento_json: JSON.stringify(pagamentosNorm || []),
          valor_pago: Number(somaPagamentos) || 0,
          troco: Number(troco) || 0,
        },
      })

      console.log('[vendas] Venda criada id=', venda.id)

      // Criar itens e atualizar estoque por produto agregado
      for (const pidStr of Object.keys(aggByProduct)) {
        const pid = Number(pidStr)
        const info = aggByProduct[pidStr]
        const quantidade = Number(info.quantidade)
        const preco_unitario = Number(info.preco_unitario) || 0
        const subtotal = Math.round((Number(info.subtotal) + Number.EPSILON) * 100) / 100

        // Log estoque ANTES
        const produtoAntes = await tx.produtos.findUnique({ where: { id: pid } })
        console.log(`[vendas] Produto ${pid} - estoque antes:`, produtoAntes ? produtoAntes.estoque : null, 'quantidade a decrementar:', quantidade)

        const itemCriado = await tx.itens_venda.create({
          data: {
            venda_id: venda.id,
            produto_id: pid,
            quantidade,
            preco_unitario,
            subtotal,
          },
        })
        console.log('[vendas] Item criado:', { id: itemCriado.id, produto_id: pid, quantidade })

        // Não decrementar manualmente: o trigger `atualizar_estoque_venda` em itens_venda
        // já atualiza o estoque automaticamente após o INSERT. Ler estoque para logar o efeito do trigger.
        const produtoDepois = await tx.produtos.findUnique({ where: { id: pid } })
        console.log(`[vendas] Produto ${pid} - estoque depois (após trigger):`, produtoDepois ? produtoDepois.estoque : null)
      }

      // Se houve fiado, criar registro e atualizar débito do cliente
      if (totalFiado > 0 && cliente_id) {
        try {
          console.log('[vendas] Criando fiado para cliente', cliente_id, 'valor:', totalFiado)
          const fiadoCriado = await tx.fiados.create({
            data: {
              cliente_id,
              venda_id: venda.id,
              valor_original: totalFiado,
              valor_pago: 0,
              valor_restante: totalFiado,
              status: 'aberto',
            },
          })
          console.log('[vendas] Fiado criado id=', fiadoCriado.id)

          const clienteAtualizado = await tx.clientes.update({ where: { id: cliente_id }, data: { debito_atual: { increment: totalFiado } as any } })
          console.log('[vendas] Cliente debito_atual depois:', clienteAtualizado.debito_atual)

          // Registrar movimento no extrato de fiado (raw SQL dentro da transação)
          const descricaoMov = `Venda a fiado #${venda.id}`
          const referenciaMov = `venda:${venda.id}`

          await tx.$executeRaw`
            INSERT INTO fiado_movimentos (cliente_id, fiado_id, venda_id, tipo, direcao, valor, descricao, referencia, criado_por, data_movimento)
            VALUES (${cliente_id}, ${fiadoCriado.id}, ${venda.id}, ${'lancamento'}, ${'debito'}, ${totalFiado}, ${descricaoMov}, ${referenciaMov}, ${'PDV'}, NOW())
          `

          const [movimento]: any = await tx.$queryRaw`
            SELECT * FROM fiado_movimentos WHERE id = LAST_INSERT_ID()
          `
          console.log('[vendas] Movimento de fiado criado id=', movimento?.id)
        } catch (fiadoErr) {
          console.error(`[vendas][${requestId}] Erro ao criar fiado/movimento:`, fiadoErr)
          throw fiadoErr
        }
      }

      console.log(`[vendas][${requestId}] Transação finalizada para venda id= ${venda.id}`)
      return { vendaId: venda.id }
    }, {
      timeout: 15000 // 15 segundos timeout
    })

    // Gerar cupom FORA da transação (não crítico para consistência)
    try {
      const itensCriados = await prisma.itens_venda.findMany({ 
        where: { venda_id: result.vendaId }, 
        include: { produto: true } 
      })

      const pad = (s: string, width: number, align: 'left' | 'right' | 'center' = 'left') => {
        if (align === 'right') return s.padStart(width, ' ')
        if (align === 'center') {
          const spaces = width - s.length
          const left = Math.floor(spaces / 2)
          const right = spaces - left
          return ' '.repeat(Math.max(0, left)) + s + ' '.repeat(Math.max(0, right))
        }
        return s.padEnd(width, ' ')
      }

      let texto = ''
      const linha = '========================================\n'
      const linhaThin = '----------------------------------------\n'

      texto += linha
      texto += pad('BUDEGA AIRTON', 40, 'center') + '\n'
      texto += pad('CNPJ: 00.000.000/0000-00', 40, 'center') + '\n'
      texto += pad('Povoado Jurema, 123', 40, 'center') + '\n'
      texto += pad('Tel: (00) 00000-0000', 40, 'center') + '\n'
      texto += linha + '\n'

      texto += `VENDA: #${result.vendaId}\n`
      texto += `DATA:  ${new Date().toLocaleString('pt-BR')}\n`
      texto += `CLIENTE: ${cliente_id ? cliente_id : 'AVULSO'}\n`
      texto += '\n' + linhaThin

      texto += pad('PRODUTO', 18) + pad('QTD', 5, 'right') + pad('V.UNIT', 8, 'right') + pad('SOMA', 9, 'right') + '\n'
      texto += linhaThin

      for (const it of itensCriados) {
        const nome = (it.produto?.nome || '').substring(0, 17)
        const qtd = Number(it.quantidade || 0).toFixed(0)
        const vu = Number(it.preco_unitario || 0).toFixed(2)
        const sub = Number(it.subtotal || 0).toFixed(2)

        texto += pad(nome, 18) + pad(qtd, 5, 'right') + pad(vu, 8, 'right') + pad(sub, 9, 'right') + '\n'
      }

      texto += linhaThin
      texto += pad('TOTAL GERAL:', 31, 'right') + pad(`R$ ${Number(total || 0).toFixed(2)}`, 9, 'right') + '\n'
      texto += linha + '\n'

      texto += 'FORMAS DE PAGAMENTO:\n' + linhaThin
      try {
        const formasJson = pagamentosNorm || []
        for (const f of formasJson) {
          const tipoRaw = (f.tipo || '').toString()
          const label = labelMap[tipoRaw] || tipoRaw.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
          const valor = `R$ ${Number(f.valor || 0).toFixed(2)}`
          texto += pad(`${label}:`, 25) + pad(valor, 15, 'right') + '\n'
        }
      } catch (e) {
        const valor = `R$ ${Number(total || 0).toFixed(2)}`
        texto += pad('Dinheiro:', 25) + pad(valor, 15, 'right') + '\n'
      }

      texto += linha + '\n' + pad('Obrigado pela preferência!', 40, 'center') + '\n' + pad('Volte sempre!', 40, 'center') + '\n' + linha

      const cupomCriado = await prisma.cupons.create({ data: { venda_id: result.vendaId, conteudo_texto: texto } })
      console.log(`[vendas][${requestId}] Cupom criado id=`, cupomCriado.id, 'venda_id=', cupomCriado.venda_id)
    } catch (cupomErr) {
      console.error(`[vendas][${requestId}] Erro ao criar cupom (não crítico):`, cupomErr)
    }

    // Checar estoque final fora da transação para detectar alterações concorrentes
    for (const pidStr of Object.keys(aggByProduct)) {
      const pid = Number(pidStr)
      const produtoFinal = await prisma.produtos.findUnique({ where: { id: pid } })
      console.log(`[vendas][${requestId}] Produto ${pid} - estoque final no DB:`, produtoFinal ? produtoFinal.estoque : null)
    }

    return NextResponse.json({ success: true, vendaId: result.vendaId })
  } catch (error: any) {
    console.error(`[vendas][${requestId}] Erro ao processar venda:`, error)
    const message = error?.message || String(error)
    return NextResponse.json({ error: 'Erro interno do servidor', requestId, details: message }, { status: 500 })
  }
}
