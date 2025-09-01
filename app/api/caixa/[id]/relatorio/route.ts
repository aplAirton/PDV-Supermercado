import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caixaId = params.id
    
    // Buscar dados do caixa
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
    
    // Buscar vendas do caixa
    const vendasQuery = `
      SELECT 
        v.id,
        v.total,
        v.forma_pagamento_json,
        v.data_venda,
        c.nome as cliente_nome
      FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.caixa_id = ?
      ORDER BY v.data_venda ASC
    `
    
    const vendas = await executeQuery(vendasQuery, [caixaId]) as any[]
    
    // Buscar movimentações do caixa
    const movimentacoesQuery = `
      SELECT * FROM caixa_movimentacoes 
      WHERE caixa_id = ? 
      ORDER BY data_movimentacao ASC
    `
    
    const movimentacoes = await executeQuery(movimentacoesQuery, [caixaId]) as any[]
    
    // Calcular resumo financeiro
    let totalVendas = 0
    let totalDinheiro = 0
    let totalCartao = 0
    let totalPix = 0
    let totalFiado = 0
    
    const formasPagamentoCount: Record<string, { quantidade: number; valor: number }> = {}
    
    vendas.forEach((venda: any) => {
      totalVendas += Number(venda.total) || 0
      
      let formasPagamento = []
      try {
        formasPagamento = JSON.parse(venda.forma_pagamento_json || '[]')
      } catch (e) {
        console.warn('Erro ao parsear forma_pagamento_json:', e)
      }
      
      formasPagamento.forEach((forma: any) => {
        const tipo = forma.tipo || 'unknown'
        const valor = Number(forma.valor) || 0
        
        if (!formasPagamentoCount[tipo]) {
          formasPagamentoCount[tipo] = { quantidade: 0, valor: 0 }
        }
        formasPagamentoCount[tipo].quantidade += 1
        formasPagamentoCount[tipo].valor += valor
        
        switch (tipo) {
          case 'dinheiro':
            totalDinheiro += valor
            break
          case 'cartao_debito':
          case 'cartao_credito':
            totalCartao += valor
            break
          case 'pix':
            totalPix += valor
            break
          case 'fiado':
            totalFiado += valor
            break
        }
      })
    })
    
    // Calcular movimentações
    let totalSuprimentos = 0
    let totalSangrias = 0
    
    movimentacoes.forEach((mov: any) => {
      const valor = Number(mov.valor) || 0
      if (mov.tipo === 'suprimento') {
        totalSuprimentos += valor
      } else if (mov.tipo === 'sangria') {
        totalSangrias += valor
      }
    })
    
    // Calcular saldo final esperado
    const saldoFinal = Number(caixa[0].valor_inicial) + totalDinheiro + totalSuprimentos - totalSangrias
    
    const relatorio = {
      caixa: caixa[0],
      periodo: {
        inicio: caixa[0].data_abertura,
        fim: caixa[0].data_fechamento || new Date()
      },
      resumo: {
        valor_inicial: Number(caixa[0].valor_inicial) || 0,
        total_vendas: totalVendas,
        quantidade_vendas: vendas.length,
        saldo_final_esperado: saldoFinal,
        total_suprimentos: totalSuprimentos,
        total_sangrias: totalSangrias
      },
      formas_pagamento: {
        dinheiro: totalDinheiro,
        cartao: totalCartao,
        pix: totalPix,
        fiado: totalFiado,
        detalhado: formasPagamentoCount
      },
      vendas,
      movimentacoes
    }
    
    return NextResponse.json(relatorio)
  } catch (error) {
    console.error('Erro ao gerar relatório de fechamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
