import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio') || new Date().toISOString().split('T')[0]
    const dataFim = searchParams.get('dataFim') || new Date().toISOString().split('T')[0]
    const tipo = searchParams.get('tipo') || ''
    const categoria = searchParams.get('categoria') || ''

    // Construir query base
    let whereConditions = [
      `DATE(data_movimento) >= ?`,
      `DATE(data_movimento) <= ?`
    ]
    let queryParams = [dataInicio, dataFim]

    if (tipo) {
      whereConditions.push(`tipo = ?`)
      queryParams.push(tipo)
    }

    if (categoria) {
      whereConditions.push(`categoria = ?`)
      queryParams.push(categoria)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Query principal para buscar movimentos
    const movimentosQuery = `
      SELECT 
        id,
        tipo,
        categoria,
        valor,
        descricao,
        referencia,
        forma_pagamento,
        data_movimento,
        cliente_nome
      FROM (
        -- Vendas em dinheiro, cartão e PIX (ENTRADAS)
        SELECT 
          v.id,
          'entrada' as tipo,
          CASE 
            WHEN v.forma_pagamento = 'dinheiro' THEN 'venda_dinheiro'
            WHEN v.forma_pagamento IN ('cartao_debito', 'cartao_credito') THEN 'venda_cartao'
            WHEN v.forma_pagamento = 'pix' THEN 'venda_pix'
            ELSE 'outros'
          END as categoria,
          v.total as valor,
          CONCAT('Venda #', v.id) as descricao,
          CONCAT('Venda #', v.id) as referencia,
          CASE 
            WHEN v.forma_pagamento = 'dinheiro' THEN 'Dinheiro'
            WHEN v.forma_pagamento = 'cartao_debito' THEN 'Cartão Débito'
            WHEN v.forma_pagamento = 'cartao_credito' THEN 'Cartão Crédito'
            WHEN v.forma_pagamento = 'pix' THEN 'PIX'
            ELSE v.forma_pagamento
          END as forma_pagamento,
          v.data_venda as data_movimento,
          c.nome as cliente_nome
        FROM vendas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        WHERE v.forma_pagamento IN ('dinheiro', 'cartao_debito', 'cartao_credito', 'pix')
        
        UNION ALL
        
        -- Pagamentos de fiado (ENTRADAS)
        SELECT 
          fm.id,
          'entrada' as tipo,
          'pagamento_fiado' as categoria,
          fm.valor,
          COALESCE(fm.descricao, CONCAT('Pagamento Fiado #', fm.fiado_id)) as descricao,
          fm.referencia,
          CASE 
            WHEN fm.referencia LIKE '%dinheiro%' THEN 'Dinheiro'
            WHEN fm.referencia LIKE '%cartao%' OR fm.referencia LIKE '%débito%' THEN 'Cartão Débito'  
            WHEN fm.referencia LIKE '%crédito%' THEN 'Cartão Crédito'
            WHEN fm.referencia LIKE '%pix%' THEN 'PIX'
            ELSE 'Não especificado'
          END as forma_pagamento,
          fm.data_movimento,
          c.nome as cliente_nome
        FROM fiado_movimentos fm
        JOIN clientes c ON fm.cliente_id = c.id
        WHERE fm.tipo = 'pagamento' AND fm.direcao = 'credito'
        
        UNION ALL
        
        -- Ajustes e outros movimentos
        SELECT 
          fm.id + 100000 as id, -- offset para evitar conflito de IDs
          CASE WHEN fm.direcao = 'credito' THEN 'entrada' ELSE 'saida' END as tipo,
          'ajuste' as categoria,
          fm.valor,
          COALESCE(fm.descricao, 'Ajuste de movimento') as descricao,
          fm.referencia,
          'Ajuste Manual' as forma_pagamento,
          fm.data_movimento,
          c.nome as cliente_nome
        FROM fiado_movimentos fm
        JOIN clientes c ON fm.cliente_id = c.id
        WHERE fm.tipo = 'ajuste'
      ) AS todos_movimentos
      ${whereClause}
      ORDER BY data_movimento DESC, id DESC
    `

    const movimentos = await executeQuery(movimentosQuery, queryParams) as any[]

    // Calcular resumo financeiro
    const resumoQuery = `
      SELECT 
        SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as totalEntradas,
        SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as totalSaidas,
        SUM(CASE WHEN categoria = 'venda_dinheiro' THEN valor ELSE 0 END) as totalVendasDinheiro,
        SUM(CASE WHEN categoria = 'venda_cartao' THEN valor ELSE 0 END) as totalVendasCartao,
        SUM(CASE WHEN categoria = 'venda_pix' THEN valor ELSE 0 END) as totalVendasPix,
        SUM(CASE WHEN categoria = 'pagamento_fiado' THEN valor ELSE 0 END) as totalPagamentosFiado
      FROM (
        ${movimentosQuery.replace('SELECT id, tipo, categoria, valor, descricao, referencia, forma_pagamento, data_movimento, cliente_nome', 'SELECT tipo, categoria, valor')}
      ) as movimentos_resumo
    `

    const resumoResult = await executeQuery(resumoQuery, queryParams) as any[]
    const resumoData = resumoResult[0] || {}
    
    const resumo = {
      totalEntradas: Number(resumoData.totalEntradas) || 0,
      totalSaidas: Number(resumoData.totalSaidas) || 0,
      saldo: (Number(resumoData.totalEntradas) || 0) - (Number(resumoData.totalSaidas) || 0),
      totalVendasDinheiro: Number(resumoData.totalVendasDinheiro) || 0,
      totalVendasCartao: Number(resumoData.totalVendasCartao) || 0,
      totalVendasPix: Number(resumoData.totalVendasPix) || 0,
      totalPagamentosFiado: Number(resumoData.totalPagamentosFiado) || 0
    }

    return NextResponse.json({
      movimentos,
      resumo,
      periodo: {
        dataInicio,
        dataFim,
        filtros: { tipo, categoria }
      }
    })

  } catch (error) {
    console.error('Erro ao buscar movimentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
