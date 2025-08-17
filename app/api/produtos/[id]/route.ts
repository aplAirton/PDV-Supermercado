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

    // aceitar estoque_minimo no payload e preservar 'ativo' quando não for enviado
    const { nome, preco, categoria, estoque, codigo_barras, estoque_minimo, ativo } = payload

    // buscar valor atual de 'ativo' para preservá-lo se o cliente não enviar esse campo
    const existing: any = await executeQuery("SELECT ativo, estoque_minimo FROM produtos WHERE id = ?", [id])
    const currentAtivo = Array.isArray(existing) && existing.length ? (existing[0].ativo ? 1 : 0) : 1
    const currentEstoqueMinimo = Array.isArray(existing) && existing.length ? existing[0].estoque_minimo : null

    const ativoToSet = typeof ativo !== "undefined" ? (ativo ? 1 : 0) : currentAtivo
    const estoqueMinimoToSet = typeof estoque_minimo !== 'undefined' ? estoque_minimo : currentEstoqueMinimo

    await executeQuery(
      "UPDATE produtos SET nome = ?, preco = ?, categoria = ?, estoque = ?, codigo_barras = ?, estoque_minimo = ?, ativo = ? WHERE id = ?",
      [nome, preco, categoria, estoque, codigo_barras, estoqueMinimoToSet, ativoToSet, id],
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
