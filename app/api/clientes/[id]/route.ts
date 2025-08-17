import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const payload = await request.json()
    // Não permitir alteração do CPF pela rota PUT (o front-end também já protege isso)
    const { nome, telefone, endereco } = payload
    const limite_credito = payload.limite_credito ?? 0

    await executeQuery(
      "UPDATE clientes SET nome = ?, telefone = ?, endereco = ?, limite_credito = ? WHERE id = ?",
      [nome, telefone, endereco, limite_credito, id],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Verificar debito_atual antes de excluir
    const rows: any = await executeQuery("SELECT debito_atual FROM clientes WHERE id = ?", [id])
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const debito_atual = Number(rows[0].debito_atual ?? 0)
    if (debito_atual > 0) {
      return NextResponse.json({ error: "Cliente possui débito atual e não pode ser excluído" }, { status: 400 })
    }

    await executeQuery("DELETE FROM clientes WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir cliente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
