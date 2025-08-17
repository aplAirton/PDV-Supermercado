import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET() {
  try {
    const vendas: any = await executeQuery(`
      SELECT v.*, c.nome as cliente_nome
      FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.data_venda DESC
      LIMIT 100
    `)

    // Se não houver vendas, retorna vazio
    if (!Array.isArray(vendas) || vendas.length === 0) {
      return NextResponse.json([])
    }

    // Buscar itens de venda para as vendas retornadas
    const vendaIds = vendas.map((v: any) => v.id)
    const placeholders = vendaIds.map(() => '?').join(',')
    const itensQuery = `
      SELECT iv.venda_id, p.nome AS produto_nome, iv.quantidade, iv.preco_unitario, iv.subtotal
      FROM itens_venda iv
      LEFT JOIN produtos p ON iv.produto_id = p.id
      WHERE iv.venda_id IN (${placeholders})
    `
    const itens: any = await executeQuery(itensQuery, vendaIds)

    // Agrupar itens por venda_id
    const itensPorVenda: Record<number, any[]> = {}
    if (Array.isArray(itens)) {
      for (const it of itens) {
        const vid = Number(it.venda_id)
        if (!itensPorVenda[vid]) itensPorVenda[vid] = []
        itensPorVenda[vid].push({
          produto_nome: it.produto_nome,
          quantidade: Number(it.quantidade || 0),
          preco_unitario: Number(it.preco_unitario || 0),
          subtotal: Number(it.subtotal || 0),
        })
      }
    }

    // Anexar itens a cada venda
    const vendasComItens = vendas.map((v: any) => ({
      ...v,
      itens: itensPorVenda[v.id] || [],
    }))

    return NextResponse.json(vendasComItens)
  } catch (error) {
    console.error("Erro ao buscar vendas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cliente_id, itens, total, pagamentos, troco } = body

    // Normalizar pagamentos (suporta { tipo } ou { tipo_pagamento }) e garantir números
    if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
      return NextResponse.json({ error: "Pelo menos uma forma de pagamento é necessária" }, { status: 400 })
    }

    const pagamentosNorm = pagamentos.map((p: any) => ({
      tipo: (p.tipo || p.tipo_pagamento || '').toString(),
      valor: Number.parseFloat(p.valor) ? Number.parseFloat(p.valor) : 0,
    }))

    const somaPagamentos = pagamentosNorm.reduce((s: number, p: any) => s + (Number(p.valor) || 0), 0)
    if (Number((somaPagamentos).toFixed(2)) < Number((total).toFixed(2))) {
      return NextResponse.json({ error: "Valor total dos pagamentos menor que o total da venda" }, { status: 400 })
    }

    // Se houver parcela fiado, validar limite do cliente
    const totalFiado = pagamentosNorm.filter((p: any) => p.tipo === 'fiado').reduce((s: number, p: any) => s + (Number(p.valor) || 0), 0)

    if (totalFiado > 0) {
      if (!cliente_id) {
        return NextResponse.json({ error: "Cliente é obrigatório para pagamento fiado" }, { status: 400 })
      }

      const rows: any = await executeQuery("SELECT limite_credito, debito_atual FROM clientes WHERE id = ?", [cliente_id])
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
      }

      const cliente = rows[0]
      const available = Math.max(0, Number(cliente.limite_credito || 0) - Number(cliente.debito_atual || 0))
      if (Number((totalFiado).toFixed(2)) > Number((available).toFixed(2))) {
        return NextResponse.json({ error: `Limite de fiado insuficiente. Disponível: ${available.toFixed(2)}` }, { status: 400 })
      }
    }

    // Preparar valores para gravação
    const formaPagamentoJson = JSON.stringify(pagamentosNorm)
    const valorPagoTotal = somaPagamentos
    // resumo textual: se houver fiado, 'fiado', senão a primeira forma
    const resumoForma = pagamentosNorm.some((p: any) => p.tipo === 'fiado') ? 'fiado' : (pagamentosNorm[0]?.tipo || '')

    const vendaResult = await executeQuery(
      "INSERT INTO vendas (cliente_id, total, forma_pagamento, forma_pagamento_json, valor_pago, troco) VALUES (?, ?, ?, ?, ?, ?)",
      [cliente_id, total, resumoForma, formaPagamentoJson, valorPagoTotal, troco],
    )

    const vendaId = (vendaResult as any).insertId

    // Inserir itens e atualizar estoque
    for (const item of itens) {
      await executeQuery(
        "INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
        [vendaId, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal],
      )

      await executeQuery("UPDATE produtos SET estoque = estoque - ? WHERE id = ?", [item.quantidade, item.produto_id])
    }

    // Atualizar débito do cliente com a soma dos pagamentos fiado e criar registro de fiado vinculado à venda
    if (totalFiado > 0) {
      try {
        const fiadoResult: any = await executeQuery(
          "INSERT INTO fiados (cliente_id, venda_id, valor_original, valor_pago, valor_restante, status, data_fiado, data_vencimento) VALUES (?, ?, ?, ?, ?, ?, NOW(), NULL)",
          [cliente_id, vendaId, totalFiado, 0, totalFiado, 'aberto'],
        )

        // Atualizar o debito atual do cliente
        await executeQuery("UPDATE clientes SET debito_atual = debito_atual + ? WHERE id = ?", [totalFiado, cliente_id])
      } catch (err) {
        console.error("Falha ao registrar fiado/atualizar debito do cliente:", err)
      }
    }

    // Gerar conteúdo do cupom fiscal em texto monoespaçado (Courier) e persistir na tabela cupons
    try {
      // Buscar dados para montar o cupom
      const vendaRow: any = await executeQuery("SELECT v.*, c.nome AS cliente_nome FROM vendas v LEFT JOIN clientes c ON v.cliente_id = c.id WHERE v.id = ?", [vendaId])
      const itensRows: any = await executeQuery(
        "SELECT iv.*, p.nome AS produto_nome FROM itens_venda iv LEFT JOIN produtos p ON iv.produto_id = p.id WHERE iv.venda_id = ?",
        [vendaId],
      )

      const venda = Array.isArray(vendaRow) && vendaRow[0] ? vendaRow[0] : null
      const itensCupom = Array.isArray(itensRows) ? itensRows : []

      // Montar texto do cupom
      const pad = (s: string, width = 32) => s.padEnd(width, ' ')
      let texto = ''
      texto += 'Budega Airton\n'
      texto += 'CNPJ: 00.000.000/0000-00\n'
      texto += 'ENDERECO: Povoado Jurema, 123\n'
      texto += 'TEL: (00) 00000-0000\n'
      texto += '\n'
      texto += `VENDA: #${vendaId}  DATA: ${new Date().toLocaleString('pt-BR')}\n`
      texto += `CLIENTE: ${venda?.cliente_nome ?? 'AVULSO'}\n`
      texto += '----------------------------------------\n'
      texto += pad('PRODUTO') + pad('QTD', 2) + pad('VL.UN', 10) + 'SUB\n'
      texto += '----------------------------------------\n'

      for (const it of itensCupom) {
        const nome = (it.produto_nome || '').substring(0, 20)
        const qtd = Number(it.quantidade || 0).toFixed(2)
        const vu = Number(it.preco_unitario || 0).toFixed(2)
        const sub = Number(it.subtotal || 0).toFixed(2)
        texto += pad(nome, 20) + pad(qtd, 6) + pad(vu, 10) + sub + '\n'
      }

      texto += '----------------------------------------\n'
      texto += `TOTAL: R$ ${Number(venda?.total || 0).toFixed(2)}\n`
      texto += '\n'
      texto += 'FORMAS DE PAGAMENTO:\n'
      try {
        const formas = JSON.parse(venda?.forma_pagamento_json || '[]')
        for (const f of formas) {
          texto += ` - ${f.tipo || f.tipo_pagamento}: R$ ${Number(f.valor || 0).toFixed(2)}\n`
        }
      } catch (e) {
        texto += ` - ${venda?.forma_pagamento || 'desconhecida'}\n`
      }

      texto += '\n'
      texto += 'Obrigado pela preferência!\n'
      texto += '\n\n'

      // Persistir cupom
      await executeQuery('INSERT INTO cupons (venda_id, conteudo_texto) VALUES (?, ?)', [vendaId, texto])
    } catch (err) {
      console.error('Falha ao gerar/gravarcupom:', err)
    }

    return NextResponse.json({ success: true, vendaId })
  } catch (error) {
    console.error("Erro ao processar venda:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
