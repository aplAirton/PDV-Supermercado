import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const fornecedores = await executeQuery(`
      SELECT
        f.*,
        COALESCE(SUM(pf.valor_pagamento), 0) as total_pago,
        COALESCE(SUM(c.valor_total), 0) as total_compras,
        COALESCE(SUM(c.valor_restante), 0) as total_debito
      FROM fornecedores f
      LEFT JOIN pagamentos_fornecedor pf ON f.id = pf.fornecedor_id AND pf.status = 'pago'
      LEFT JOIN compras c ON f.id = c.fornecedor_id
      WHERE f.id = ?
      GROUP BY f.id
    `, [id]) as any

    if (fornecedores.length === 0) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 })
    }

    return NextResponse.json(fornecedores[0])
  } catch (error) {
    console.error("Erro ao buscar fornecedor:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const payload = await request.json()
    const { nome, cnpj, telefone, email, endereco, contato, ativo } = payload

    // Verificar se fornecedor existe
    const fornecedorExistente = await executeQuery("SELECT id FROM fornecedores WHERE id = ?", [id]) as any
    if (fornecedorExistente.length === 0) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 })
    }

    // Validações básicas
    if (nome !== undefined && (!nome || !nome.trim())) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (cnpj !== undefined && (!cnpj || !cnpj.trim())) {
      return NextResponse.json({ error: 'CNPJ é obrigatório' }, { status: 400 })
    }

    if (telefone !== undefined && (!telefone || !telefone.trim())) {
      return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 })
    }

    // Preparar campos para atualização
    const campos: string[] = []
    const valores: any[] = []

    if (nome !== undefined) {
      campos.push("nome = ?")
      valores.push(nome.trim())
    }

    if (cnpj !== undefined) {
      const cnpjDigits = cnpj.toString().replace(/\D/g, '')
      if (cnpjDigits.length !== 14) {
        return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
      }
      campos.push("cnpj = ?")
      valores.push(cnpjDigits)
    }

    if (telefone !== undefined) {
      campos.push("telefone = ?")
      valores.push(telefone.trim())
    }

    if (email !== undefined) {
      campos.push("email = ?")
      valores.push(email?.trim() || null)
    }

    if (endereco !== undefined) {
      campos.push("endereco = ?")
      valores.push(endereco?.trim() || null)
    }

    if (contato !== undefined) {
      campos.push("contato_nome = ?")
      valores.push(contato?.trim() || null)
    }

    if (ativo !== undefined) {
      campos.push("ativo = ?")
      valores.push(ativo ? 1 : 0)
    }

    if (campos.length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    // Adicionar ID ao final dos valores
    valores.push(id)

    const query = `UPDATE fornecedores SET ${campos.join(", ")} WHERE id = ?`

    try {
      await executeQuery(query, valores)
      return NextResponse.json({ success: true })
    } catch (err: any) {
      console.error('Erro ao atualizar fornecedor:', err)
      // Tratamento de chave única (CNPJ já cadastrado)
      if (err && err.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'CNPJ já cadastrado' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro ao atualizar fornecedor:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // Verificar se fornecedor existe
    const fornecedorExistente = await executeQuery("SELECT id FROM fornecedores WHERE id = ?", [id]) as any
    if (fornecedorExistente.length === 0) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 })
    }

    // Verificar se há compras ou pagamentos associados
    const comprasAssociadas = await executeQuery("SELECT COUNT(*) as count FROM compras WHERE fornecedor_id = ?", [id]) as any
    const pagamentosAssociados = await executeQuery("SELECT COUNT(*) as count FROM pagamentos_fornecedor WHERE fornecedor_id = ?", [id]) as any

    if (comprasAssociadas[0].count > 0 || pagamentosAssociados[0].count > 0) {
      return NextResponse.json({
        error: "Não é possível excluir fornecedor com compras ou pagamentos associados"
      }, { status: 400 })
    }

    // Excluir fornecedor
    await executeQuery("DELETE FROM fornecedores WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir fornecedor:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}