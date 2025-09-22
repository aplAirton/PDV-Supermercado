import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    // Lógica simplificada: verificar apenas o último registro da tabela caixa
    // Se o último registro tem status = 'fechado', então caixa está fechado
    // Caso contrário, está aberto
    const ultimoCaixaQuery = `
      SELECT
        c.id,
        c.status,
        c.funcionario_id,
        c.valor_inicial,
        c.data_abertura,
        f.nome as funcionario_nome,
        f.cargo as funcionario_cargo
      FROM caixas c
      JOIN funcionarios f ON c.funcionario_id = f.id
      ORDER BY c.id DESC
      LIMIT 1
    `

    const caixas = await executeQuery(ultimoCaixaQuery) as any[]

    if (caixas.length === 0) {
      // Nenhum caixa encontrado - caixa fechado
      return NextResponse.json({ caixaAberto: false })
    }

    const ultimoCaixa = caixas[0]

    // Se o último caixa tem status 'fechado', então caixa está fechado
    if (ultimoCaixa.status === 'fechado') {
      return NextResponse.json({ caixaAberto: false })
    }

    // Caso contrário, o caixa está aberto (último registro não é fechado)
    return NextResponse.json({
      caixaAberto: true,
      caixa: {
        id: ultimoCaixa.id,
        funcionario_nome: ultimoCaixa.funcionario_nome,
        funcionario_cargo: ultimoCaixa.funcionario_cargo,
        valor_inicial: ultimoCaixa.valor_inicial,
        data_abertura: ultimoCaixa.data_abertura
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
