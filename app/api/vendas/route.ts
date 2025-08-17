import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET() {
  try {
    const vendas = await executeQuery(`
      SELECT v.*, c.nome as cliente_nome 
      FROM vendas v 
      LEFT JOIN clientes c ON v.cliente_id = c.id 
      ORDER BY v.data_venda DESC 
      LIMIT 100
    `)
    return NextResponse.json(vendas)
  } catch (error) {
    console.error("Erro ao buscar vendas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cliente_id, itens, total, tipo_pagamento, valor_pago, troco } = await request.json()

    // Inserir venda
    const vendaResult = await executeQuery(
      // coluna no schema é 'forma_pagamento'
      "INSERT INTO vendas (cliente_id, total, forma_pagamento, valor_pago, troco) VALUES (?, ?, ?, ?, ?)",
      [cliente_id, total, tipo_pagamento, valor_pago, troco],
    )

    const vendaId = (vendaResult as any).insertId

    // Inserir itens da venda
    for (const item of itens) {
      await executeQuery(
        "INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
        [vendaId, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal],
      )

      // Atualizar estoque
      await executeQuery("UPDATE produtos SET estoque = estoque - ? WHERE id = ?", [item.quantidade, item.produto_id])
    }

    // Se for fiado, atualizar débito atual do cliente (coluna no schema: debito_atual)
    if (tipo_pagamento === "fiado") {
      try {
        await executeQuery("UPDATE clientes SET debito_atual = debito_atual + ? WHERE id = ?", [total, cliente_id])
      } catch (err) {
        // Log detalhado para debug, mas não falhar toda a operação do servidor
        console.error("Falha ao atualizar debito do cliente:", err)
      }
    }

    return NextResponse.json({ success: true, vendaId })
  } catch (error) {
    console.error("Erro ao processar venda:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
