import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    // Buscar caixa aberto atual
    const caixaAbertoQuery = `
      SELECT id, valor_inicial, total_dinheiro, total_suprimentos, total_sangrias
      FROM caixas
      WHERE status = 'aberto'
      ORDER BY data_abertura DESC
      LIMIT 1
    `

    const caixasAbertos = await executeQuery(caixaAbertoQuery) as any[]

    if (caixasAbertos.length === 0) {
      return NextResponse.json({
        saldoDinheiro: 0,
        valorInicial: 0,
        message: 'Nenhum caixa aberto encontrado'
      })
    }

    const caixa = caixasAbertos[0]

    // Calcular saldo disponível em dinheiro
    // Saldo = (valor inicial + dinheiro das vendas + suprimentos) - sangrias
    const saldoDinheiro = (caixa.valor_inicial || 0) +
                          (caixa.total_dinheiro || 0) +
                          (caixa.total_suprimentos || 0) -
                          (caixa.total_sangrias || 0)

    return NextResponse.json({
      saldoDinheiro: Math.max(0, saldoDinheiro),
      valorInicial: caixa.valor_inicial || 0,
      caixaId: caixa.id
    })

  } catch (error) {
    console.error('Erro ao buscar saldo em dinheiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}