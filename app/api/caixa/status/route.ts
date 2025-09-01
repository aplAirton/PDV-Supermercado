import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    const caixaAbertoQuery = `
      SELECT 
        c.id,
        c.funcionario_id,
        c.valor_inicial,
        c.data_abertura,
        f.nome as funcionario_nome,
        f.cargo as funcionario_cargo
      FROM caixas c
      JOIN funcionarios f ON c.funcionario_id = f.id
      WHERE c.status = 'aberto'
      ORDER BY c.data_abertura DESC
      LIMIT 1
    `
    
    const caixas = await executeQuery(caixaAbertoQuery) as any[]
    
    if (caixas.length === 0) {
      return NextResponse.json({ caixaAberto: false })
    }
    
    const caixa = caixas[0]
    
    return NextResponse.json({
      caixaAberto: true,
      caixa: {
        id: caixa.id,
        funcionario_nome: caixa.funcionario_nome,
        funcionario_cargo: caixa.funcionario_cargo,
        valor_inicial: caixa.valor_inicial,
        data_abertura: caixa.data_abertura
      }
    })
  } catch (error) {
    console.error('Erro ao verificar status do caixa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
