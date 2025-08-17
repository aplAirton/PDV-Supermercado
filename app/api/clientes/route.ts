import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET() {
  try {
    const clientes = await executeQuery("SELECT * FROM clientes WHERE ativo = 1 ORDER BY nome")
    return NextResponse.json(clientes)
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    // aceitar tanto limite_credito (frontend atual) quanto limite_fiado (compatibilidade)
    const { nome, telefone, endereco } = payload
    const limite_credito = payload.limite_credito ?? payload.limite_fiado ?? 0

    const result = await executeQuery(
      "INSERT INTO clientes (nome, telefone, endereco, limite_credito) VALUES (?, ?, ?, ?)",
      [nome, telefone, endereco, limite_credito],
    )

    return NextResponse.json({ success: true, id: (result as any).insertId })
  } catch (error) {
    console.error("Erro ao criar cliente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
