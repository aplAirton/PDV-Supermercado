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
    const { nome, telefone, endereco, cpf } = payload
    const limite_credito = payload.limite_credito ?? payload.limite_fiado ?? 0

    // Validação mínima do CPF (apenas presença e 11 dígitos numéricos)
    if (!cpf) {
      return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 })
    }
    const cpfDigits = cpf.toString().replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }

    try {
      const result = await executeQuery(
        "INSERT INTO clientes (nome, cpf, telefone, endereco, limite_credito) VALUES (?, ?, ?, ?, ?)",
        [nome, cpfDigits, telefone, endereco, limite_credito],
      )
      return NextResponse.json({ success: true, id: (result as any).insertId })
    } catch (err: any) {
      console.error('Erro ao inserir cliente:', err)
      // Tratamento de chave única (CPF já cadastrado)
      if (err && err.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro ao criar cliente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
