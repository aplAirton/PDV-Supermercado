import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET() {
  try {
    const fornecedores = await executeQuery(`
      SELECT
        f.*,
        COALESCE(SUM(pf.valor_pagamento), 0) as total_pago,
        COALESCE(SUM(c.valor_total), 0) as total_compras,
        COALESCE(SUM(c.valor_restante), 0) as total_debito
      FROM fornecedores f
      LEFT JOIN pagamentos_fornecedor pf ON f.id = pf.fornecedor_id AND pf.status = 'pago'
      LEFT JOIN compras c ON f.id = c.fornecedor_id
      GROUP BY f.id
      ORDER BY f.nome
    `)
    return NextResponse.json(fornecedores)
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { nome, cnpj, telefone, email, endereco, contato } = payload

    // Validações básicas
    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (!cnpj || !cnpj.trim()) {
      return NextResponse.json({ error: 'CNPJ é obrigatório' }, { status: 400 })
    }

    if (!telefone || !telefone.trim()) {
      return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 })
    }

    // Validação básica do CNPJ (apenas presença e formato)
    const cnpjDigits = cnpj.toString().replace(/\D/g, '')
    if (cnpjDigits.length !== 14) {
      return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
    }

    try {
      const result = await executeQuery(
        `INSERT INTO fornecedores
         (nome, cnpj, telefone, email, endereco, contato_nome)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nome.trim(), cnpjDigits, telefone.trim(), email?.trim() || null, endereco?.trim() || null, contato?.trim() || null]
      )
      return NextResponse.json({ success: true, id: (result as any).insertId })
    } catch (err: any) {
      console.error('Erro ao inserir fornecedor:', err)
      // Tratamento de chave única (CNPJ já cadastrado)
      if (err && err.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'CNPJ já cadastrado' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}