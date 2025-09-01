import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caixaId = params.id
    
    // Buscar detalhes do caixa
    const caixaQuery = `
      SELECT 
        c.*,
        f.nome as funcionario_nome
      FROM caixas c
      JOIN funcionarios f ON c.funcionario_id = f.id
      WHERE c.id = ?
    `
    
    const caixa = await executeQuery(caixaQuery, [caixaId]) as any[]
    
    if (caixa.length === 0) {
      return NextResponse.json(
        { error: 'Caixa não encontrado' },
        { status: 404 }
      )
    }
    
    // Buscar movimentações do caixa
    const movimentacoesQuery = `
      SELECT * FROM caixa_movimentacoes 
      WHERE caixa_id = ? 
      ORDER BY data_movimentacao DESC
    `
    
    const movimentacoes = await executeQuery(movimentacoesQuery, [caixaId])
    
    return NextResponse.json({
      caixa: caixa[0],
      movimentacoes
    })
  } catch (error) {
    console.error('Erro ao buscar detalhes do caixa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caixaId = params.id
    const data = await request.json()
    const { acao, valor, observacoes } = data
    
    if (acao === 'fechar') {
      // Fechar caixa
      const updateQuery = `
        UPDATE caixas 
        SET 
          status = 'fechado',
          data_fechamento = NOW(),
          observacoes_fechamento = ?
        WHERE id = ? AND status = 'aberto'
      `
      
      const result = await executeQuery(updateQuery, [observacoes, caixaId]) as any
      
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Caixa não encontrado ou já fechado' },
          { status: 400 }
        )
      }
      
      return NextResponse.json({ success: true, message: 'Caixa fechado com sucesso' })
    } else if (acao === 'movimentacao') {
      // Adicionar movimentação (sangria, suprimento, etc.)
      const { tipo, descricao } = data
      
      const insertQuery = `
        INSERT INTO caixa_movimentacoes (
          caixa_id, 
          tipo, 
          valor, 
          descricao
        ) VALUES (?, ?, ?, ?)
      `
      
      await executeQuery(insertQuery, [caixaId, tipo, valor, descricao])
      
      return NextResponse.json({ 
        success: true, 
        message: 'Movimentação registrada com sucesso' 
      })
    } else {
      return NextResponse.json(
        { error: 'Ação não reconhecida' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro na operação do caixa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
