import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, getConnection } from "@/lib/database"

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

    // Usar transação para evitar problemas de concorrência e dupla execução
    const conn = await getConnection()
    let vendaId: number | null = null
    
    try {
      await conn.beginTransaction()

      // Inserir venda
      const [vendaResult] = await conn.execute(
        "INSERT INTO vendas (cliente_id, total, forma_pagamento, forma_pagamento_json, valor_pago, troco) VALUES (?, ?, ?, ?, ?, ?)",
        [cliente_id, total, resumoForma, formaPagamentoJson, valorPagoTotal, troco],
      ) as any

      vendaId = (vendaResult as any).insertId

      // Agregar itens por produto antes de inserir e atualizar estoque.
      // Isso evita que entradas duplicadas no payload causem múltiplas linhas e subtrações.
      if (!Array.isArray(itens) || itens.length === 0) {
        throw new Error('Itens da venda inválidos')
      }

      const aggByProduct: Record<number, { quantidade: number; preco_unitario: number; subtotal: number }> = {}

      for (const item of itens) {
        const pid = Number(item.produto_id)
        const q = Number(item.quantidade || 0)
        const preco = Number(item.preco_unitario || item.preco || 0)
        const sub = Number(item.subtotal || (preco * q) || 0)

        if (!aggByProduct[pid]) {
          aggByProduct[pid] = { quantidade: 0, preco_unitario: preco, subtotal: 0 }
        }

        // Somar quantidades e recalcular subtotal
        aggByProduct[pid].quantidade += q
        aggByProduct[pid].subtotal += sub
      }

      // Inserir uma linha de item_venda por produto agregado
      for (const pidStr of Object.keys(aggByProduct)) {
        const pid = Number(pidStr)
        const info = aggByProduct[pid]
        const quantidade = Number(info.quantidade)
        const preco_unitario = Number(info.preco_unitario)
        const subtotal = Number(Math.round((info.subtotal + Number.EPSILON) * 100) / 100)

        await conn.execute(
          "INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
          [vendaId, pid, quantidade, preco_unitario, subtotal],
        )
      }

      // Atualizar estoque uma vez por produto (evita dupla subtração)
      for (const pidStr of Object.keys(aggByProduct)) {
        const pid = Number(pidStr)
        const totalQty = aggByProduct[pid].quantidade
        await conn.execute("UPDATE produtos SET estoque = estoque - ? WHERE id = ?", [totalQty, pid])
      }

      // Atualizar débito do cliente e criar registro de fiado (se aplicável)
      if (totalFiado > 0) {
        await conn.execute(
          "INSERT INTO fiados (cliente_id, venda_id, valor_original, valor_pago, valor_restante, status, data_fiado, data_vencimento) VALUES (?, ?, ?, ?, ?, ?, NOW(), NULL)",
          [cliente_id, vendaId, totalFiado, 0, totalFiado, 'aberto'],
        )

        await conn.execute("UPDATE clientes SET debito_atual = debito_atual + ? WHERE id = ?", [totalFiado, cliente_id])
      }

      // Gerar cupom fiscal dentro da transação
      try {
        const [vendaRow] = await conn.execute("SELECT v.*, c.nome AS cliente_nome FROM vendas v LEFT JOIN clientes c ON v.cliente_id = c.id WHERE v.id = ?", [vendaId]) as any
        const [itensRows] = await conn.execute(
          "SELECT iv.*, p.nome AS produto_nome FROM itens_venda iv LEFT JOIN produtos p ON iv.produto_id = p.id WHERE iv.venda_id = ?",
          [vendaId],
        ) as any

        const venda = Array.isArray(vendaRow) && vendaRow[0] ? vendaRow[0] : null
        const itensCupom = Array.isArray(itensRows) ? itensRows : []

        // Montar texto do cupom
        const pad = (s: string, width: number, align: 'left' | 'right' | 'center' = 'left') => {
          if (align === 'right') return s.padStart(width, ' ')
          if (align === 'center') {
            const spaces = width - s.length
            const left = Math.floor(spaces / 2)
            const right = spaces - left
            return ' '.repeat(left) + s + ' '.repeat(right)
          }
          return s.padEnd(width, ' ')
        }

        let texto = ''
        const linha = '========================================\n'
        const linhaThin = '----------------------------------------\n'
        
        // Cabeçalho da empresa
        texto += linha
        texto += pad('BUDEGA AIRTON', 40, 'center') + '\n'
        texto += pad('CNPJ: 00.000.000/0000-00', 40, 'center') + '\n'
        texto += pad('Povoado Jurema, 123', 40, 'center') + '\n'
        texto += pad('Tel: (00) 00000-0000', 40, 'center') + '\n'
        texto += linha
        texto += '\n'
        
        // Informações da venda
        texto += `VENDA: #${vendaId}\n`
        texto += `DATA:  ${new Date().toLocaleString('pt-BR')}\n`
        texto += `CLIENTE: ${venda?.cliente_nome ?? 'AVULSO'}\n`
        texto += '\n'
        texto += linhaThin
        
        // Cabeçalho dos itens - ajustado para melhor visual
        texto += pad('PRODUTO', 18) + pad('QTD', 5, 'right') + pad('V.UNIT', 8, 'right') + pad('SOMA', 9, 'right') + '\n'
        texto += linhaThin

        // Itens da venda
        for (const it of itensCupom) {
          const nome = (it.produto_nome || '').substring(0, 17)
          const qtd = Number(it.quantidade || 0).toFixed(0)
          const vu = `${Number(it.preco_unitario || 0).toFixed(2)}`
          const sub = `${Number(it.subtotal || 0).toFixed(2)}`
          
          texto += pad(nome, 18) + 
                   pad(qtd, 5, 'right') + 
                   pad(vu, 8, 'right') + 
                   pad(sub, 9, 'right') + '\n'
        }

        texto += linhaThin
        
        // Total destacado
        const totalFormatado = `R$ ${Number(venda?.total || 0).toFixed(2)}`
        texto += pad('TOTAL GERAL:', 31, 'right') + pad(totalFormatado, 9, 'right') + '\n'
        texto += linha
        
        // Formas de pagamento
        texto += 'FORMAS DE PAGAMENTO:\n'
        texto += linhaThin
        
        try {
          const formas = JSON.parse(venda?.forma_pagamento_json || '[]')
          const labelMap: Record<string, string> = {
            dinheiro: 'Dinheiro',
            cartao_debito: 'Cartão Débito',
            cartao_credito: 'Cartão Crédito',
            pix: 'PIX',
            fiado: 'Fiado',
          }

          for (const f of formas) {
            const tipoRaw = (f.tipo || f.tipo_pagamento || '').toString()
            const label = labelMap[tipoRaw] || (tipoRaw ? tipoRaw.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : (venda?.forma_pagamento || 'Desconhecida'))
            const valor = `R$ ${Number(f.valor || 0).toFixed(2)}`
            texto += pad(`${label}:`, 25) + pad(valor, 15, 'right') + '\n'
          }
        } catch (e) {
          const valor = `R$ ${Number(venda?.total || 0).toFixed(2)}`
          texto += pad(`${venda?.forma_pagamento || 'Desconhecida'}:`, 25) + pad(valor, 15, 'right') + '\n'
        }
        
        texto += linha
        texto += '\n'
        texto += pad('Obrigado pela preferência!', 40, 'center') + '\n'
        texto += pad('Volte sempre!', 40, 'center') + '\n'
        texto += '\n'
        texto += linha

        await conn.execute('INSERT INTO cupons (venda_id, conteudo_texto) VALUES (?, ?)', [vendaId, texto])
      } catch (cupomErr) {
        console.error('Erro ao gerar cupom (não crítico):', cupomErr)
      }

      await conn.commit()
    } catch (err) {
      try {
        await conn.rollback()
      } catch (rollbackErr) {
        console.error("Erro no rollback:", rollbackErr)
      }
      throw err
    } finally {
      try {
        await conn.end()
      } catch (closeErr) {
        console.error("Erro ao fechar conexão:", closeErr)
      }
    }

    return NextResponse.json({ success: true, vendaId })
  } catch (error) {
    console.error("Erro ao processar venda:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
