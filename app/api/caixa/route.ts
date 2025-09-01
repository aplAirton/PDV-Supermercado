import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    const query = `
      SELECT 
        c.*,
        f.nome as funcionario_nome
      FROM caixas c
      JOIN funcionarios f ON c.funcionario_id = f.id
      ORDER BY c.data_abertura DESC
      LIMIT 50
    `
    
    const caixas = await executeQuery(query)
    return NextResponse.json(caixas)
  } catch (error) {
    console.error('Erro ao buscar caixas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { funcionario_id, valor_inicial, observacoes_abertura } = data
    
    // Verificar se já existe caixa aberto para este funcionário
    const caixaAbertoQuery = `
      SELECT id FROM caixas 
      WHERE funcionario_id = ? AND status = 'aberto'
    `
    const caixasAbertos = await executeQuery(caixaAbertoQuery, [funcionario_id]) as any[]
    
    if (caixasAbertos.length > 0) {
      return NextResponse.json(
        { error: 'Este funcionário já possui um caixa aberto' },
        { status: 400 }
      )
    }
    
    const insertQuery = `
      INSERT INTO caixas (
        funcionario_id, 
        valor_inicial, 
        observacoes_abertura, 
        status
      ) VALUES (?, ?, ?, 'aberto')
    `
    
    const result = await executeQuery(insertQuery, [
      funcionario_id, 
      valor_inicial || 0, 
      observacoes_abertura
    ]) as any
    
    return NextResponse.json({ 
      success: true, 
      caixa_id: result.insertId 
    })
  } catch (error) {
    console.error('Erro ao abrir caixa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
