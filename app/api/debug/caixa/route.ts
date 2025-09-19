import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    console.log('[DEBUG] Buscando informações do caixa...')
    
    // Buscar todos os caixas
    const todosCaixas = await executeQuery(`
      SELECT id, valor_inicial, total_dinheiro, total_suprimentos, total_sangrias, status, data_abertura
      FROM caixas
      ORDER BY data_abertura DESC
      LIMIT 5
    `) as any[]
    
    console.log('[DEBUG] Todos os caixas:', todosCaixas)

    // Buscar movimentações financeiras de dinheiro
    const movimentacoesDinheiro = await executeQuery(`
      SELECT categoria, tipo, valor, data_movimento, forma_pagamento
      FROM movimentacoes_financeiras 
      WHERE forma_pagamento = 'dinheiro' 
      AND DATE(data_movimento) = CURDATE()
      ORDER BY data_movimento DESC
      LIMIT 10
    `) as any[]

    console.log('[DEBUG] Movimentações de dinheiro hoje:', movimentacoesDinheiro)

    // Verificar se há um caixa aberto
    const caixaAberto = await executeQuery(`
      SELECT id, valor_inicial, total_dinheiro, total_suprimentos, total_sangrias, status
      FROM caixas
      WHERE status = 'aberto'
      ORDER BY data_abertura DESC
      LIMIT 1
    `) as any[]

    console.log('[DEBUG] Caixa aberto:', caixaAberto)

    return NextResponse.json({
      todosCaixas,
      movimentacoesDinheiro,
      caixaAberto,
      debug: 'Informações coletadas com sucesso'
    })

  } catch (error) {
    console.error('[DEBUG] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error },
      { status: 500 }
    )
  }
}