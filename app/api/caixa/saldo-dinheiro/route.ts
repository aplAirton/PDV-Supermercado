import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    // Buscar caixa aberto atual - incluindo sangrias, suprimentos e pagamentos a fornecedores
    const caixaAbertoQuery = `
      SELECT 
        id, 
        valor_inicial, 
        total_dinheiro,
        COALESCE(total_sangrias, 0) as total_sangrias,
        COALESCE(total_suprimentos, 0) as total_suprimentos
      FROM caixas
      WHERE status = 'aberto'
      ORDER BY data_abertura DESC
      LIMIT 1
    `

    const caixasAbertos = await executeQuery(caixaAbertoQuery) as any[]

    if (caixasAbertos.length === 0) {
      return NextResponse.json({
        saldoCaixa: 0,
        valorInicial: 0,
        totalDinheiro: 0,
        totalSangrias: 0,
        totalSuprimentos: 0,
        totalPagamentosFornecedores: 0,
        message: 'Nenhum caixa aberto encontrado'
      })
    }

    const caixa = caixasAbertos[0]

    // Buscar total de pagamentos a fornecedores que afetaram o caixa
    const pagamentosFornecedoresQuery = `
      SELECT COALESCE(SUM(valor_pagamento), 0) as total_pagamentos_fornecedores
      FROM pagamentos_fornecedor
      WHERE caixa_id = ? 
      AND afeta_caixa = 1 
      AND forma_pagamento = 'dinheiro'
    `
    
    const pagamentosFornecedoresResult = await executeQuery(pagamentosFornecedoresQuery, [caixa.id]) as any[]
    const totalPagamentosFornecedores = parseFloat(pagamentosFornecedoresResult[0]?.total_pagamentos_fornecedores || 0)

    // Converter todos os valores para números para evitar NaN
    const totalDinheiro = parseFloat(caixa.total_dinheiro || 0)
    const totalSuprimentos = parseFloat(caixa.total_suprimentos || 0)  
    const valorInicial = parseFloat(caixa.valor_inicial || 0)
    const totalSangrias = parseFloat(caixa.total_sangrias || 0)

    // Cálculo correto: (dinheiro + suprimentos) - (valor_inicial + sangrias + pagamentos_fornecedores)
    // Os pagamentos aos fornecedores devem reduzir o saldo disponível
    const entradas = totalDinheiro + totalSuprimentos
    const saidas = valorInicial + totalSangrias + totalPagamentosFornecedores
    const saldoCaixa = Math.max(0, entradas - saidas)

    console.log('[SALDO API] Cálculo detalhado:', {
      caixa_id: caixa.id,
      total_dinheiro: totalDinheiro,
      total_suprimentos: totalSuprimentos,
      valor_inicial: valorInicial,
      total_sangrias: totalSangrias,
      total_pagamentos_fornecedores: totalPagamentosFornecedores,
      calculo_detalhado: {
        entradas: entradas,
        saidas: saidas,
        diferenca: entradas - saidas
      },
      saldo_calculado: saldoCaixa,
      observacao: 'Pagamentos a fornecedores agora decrementam o saldo final'
    })

    return NextResponse.json({
      saldoCaixa: saldoCaixa,
      valorInicial: valorInicial,
      totalDinheiro: totalDinheiro,
      totalSangrias: totalSangrias,
      totalSuprimentos: totalSuprimentos,
      totalPagamentosFornecedores: totalPagamentosFornecedores,
      caixaId: caixa.id,
      detalhes: {
        entrada_total: entradas,
        saida_total: saidas,
        saldo_final: saldoCaixa
      }
    })

  } catch (error) {
    console.error('Erro ao buscar saldo em dinheiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}