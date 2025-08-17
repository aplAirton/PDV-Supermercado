import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const rows: any = await executeQuery("SELECT * FROM vendas WHERE id = ?", [id])
    if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Erro ao buscar venda:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const payload = await request.json()
    // Permitimos atualizar forma_pagamento para marcar como pago ou alterar
    const { forma_pagamento, pagamentos } = payload

    if (pagamentos) {
      // atualizar forma_pagamento JSON e recalcular valor_pago
      const formaJson = JSON.stringify(pagamentos)
      const valorPago = (Array.isArray(pagamentos) ? pagamentos.reduce((s: number, p: any) => s + (Number.parseFloat(p.valor) || 0), 0) : 0)

      await executeQuery("UPDATE vendas SET forma_pagamento = ?, valor_pago = ? WHERE id = ?", [formaJson, valorPago, id])

      // Se pagamentos não contiverem fiado, e antes era fiado, atualizar debito do cliente (simplificado: não desfaz debito)
      return NextResponse.json({ success: true })
    }

    if (forma_pagamento) {
      // forma_pagamento pode ser string antiga 'fiado' ou 'dinheiro' para marcar pago
      await executeQuery("UPDATE vendas SET forma_pagamento = ? WHERE id = ?", [forma_pagamento, id])
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Nenhum campo válido informado" }, { status: 400 })
  } catch (error) {
    console.error("Erro ao atualizar venda:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    await executeQuery("DELETE FROM vendas WHERE id = ?", [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir venda:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
