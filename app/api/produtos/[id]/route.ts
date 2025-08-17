import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const rows: any = await executeQuery(
      "SELECT id, codigo_barras, nome, preco, estoque, categoria, ativo FROM produtos WHERE id = ?",
      [id],
    )

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Erro ao buscar produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const payload = await request.json()
    const { nome, preco, categoria, estoque, codigo_barras, ativo } = payload

    await executeQuery(
      "UPDATE produtos SET nome = ?, preco = ?, categoria = ?, estoque = ?, codigo_barras = ?, ativo = ? WHERE id = ?",
      [nome, preco, categoria, estoque, codigo_barras, ativo ? 1 : 0, id],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    await executeQuery("DELETE FROM produtos WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
