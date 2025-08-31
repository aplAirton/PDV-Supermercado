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
        -- Vendas (ENTRADAS) - usando forma_pagamento_json quando disponível
        SELECT 
          v.id,
          'entrada' as tipo,
          CASE 
            WHEN v.forma_pagamento_json IS NOT NULL THEN 'venda_multiplas'
            WHEN v.forma_pagamento = 'dinheiro' THEN 'venda_dinheiro'
            WHEN v.forma_pagamento IN ('cartao_debito', 'cartao_credito') THEN 'venda_cartao'
            WHEN v.forma_pagamento = 'pix' THEN 'venda_pix'
            ELSE 'outros'
          END as categoria,
          v.total as valor,
          CONCAT('Venda #', v.id) as descricao,
          CONCAT('Venda #', v.id) as referencia,
          CASE 
            WHEN v.forma_pagamento_json IS NOT NULL THEN 'Múltiplas'
            WHEN v.forma_pagamento = 'dinheiro' THEN 'Dinheiro'
            WHEN v.forma_pagamento = 'cartao_debito' THEN 'Débito'
            WHEN v.forma_pagamento = 'cartao_credito' THEN 'Crédito'
            WHEN v.forma_pagamento = 'pix' THEN 'PIX'
            ELSE v.forma_pagamento
          END as forma_pagamento,
          v.data_venda as data_movimento,
          c.nome as cliente_nome
        FROM vendas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        
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
            WHEN fm.referencia LIKE '%cartao%' OR fm.referencia LIKE '%débito%' THEN 'Débito'  
            WHEN fm.referencia LIKE '%crédito%' THEN 'Crédito'
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

    // Calcular resumo financeiro - processar JSON para contabilizar corretamente
    const resumoQuery = `
      WITH vendas_detalhadas AS (
        SELECT 
          v.id,
          'entrada' as tipo,
          CASE 
            WHEN v.forma_pagamento_json IS NOT NULL THEN 'venda_multiplas'
            WHEN v.forma_pagamento = 'dinheiro' THEN 'venda_dinheiro'
            WHEN v.forma_pagamento IN ('cartao_debito', 'cartao_credito') THEN 'venda_cartao'
            WHEN v.forma_pagamento = 'pix' THEN 'venda_pix'
            ELSE 'outros'
          END as categoria,
          v.total as valor,
          v.data_venda as data_movimento,
          v.forma_pagamento_json
        FROM vendas v
        WHERE DATE(v.data_venda) >= ? AND DATE(v.data_venda) <= ?
      ),
      pagamentos_fiado AS (
        SELECT 
          fm.id,
          'entrada' as tipo,
          'pagamento_fiado' as categoria,
          fm.valor,
          fm.data_movimento,
          NULL as forma_pagamento_json
        FROM fiado_movimentos fm
        WHERE fm.tipo = 'pagamento' AND fm.direcao = 'credito'
          AND DATE(fm.data_movimento) >= ? AND DATE(fm.data_movimento) <= ?
      ),
      ajustes AS (
        SELECT 
          fm.id + 100000 as id,
          CASE WHEN fm.direcao = 'credito' THEN 'entrada' ELSE 'saida' END as tipo,
          'ajuste' as categoria,
          fm.valor,
          fm.data_movimento,
          NULL as forma_pagamento_json
        FROM fiado_movimentos fm
        WHERE fm.tipo = 'ajuste'
          AND DATE(fm.data_movimento) >= ? AND DATE(fm.data_movimento) <= ?
      ),
      todos_movimentos AS (
        SELECT * FROM vendas_detalhadas
        UNION ALL
        SELECT * FROM pagamentos_fiado  
        UNION ALL
        SELECT * FROM ajustes
      )
      SELECT 
        SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as totalEntradas,
        SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as totalSaidas,
        -- Dinheiro: vendas simples + JSON processado
        SUM(CASE WHEN categoria = 'venda_dinheiro' THEN valor ELSE 0 END) + 
        SUM(CASE 
          WHEN categoria = 'venda_multiplas' AND forma_pagamento_json IS NOT NULL THEN
            COALESCE((
              SELECT SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(item, '$.valor')) AS DECIMAL(10,2)))
              FROM (
                SELECT JSON_EXTRACT(forma_pagamento_json, CONCAT('$[', n.n, ']')) as item
                FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) n
                WHERE JSON_EXTRACT(forma_pagamento_json, CONCAT('$[', n.n, ']')) IS NOT NULL
              ) items
              WHERE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(item, '$.tipo')), JSON_UNQUOTE(JSON_EXTRACT(item, '$.tipo_pagamento'))) = 'dinheiro'
            ), 0)
          ELSE 0
        END) as totalVendasDinheiro,
        -- Cartão: vendas simples + JSON processado  
        SUM(CASE WHEN categoria = 'venda_cartao' THEN valor ELSE 0 END) + 
        SUM(CASE 
          WHEN categoria = 'venda_multiplas' AND forma_pagamento_json IS NOT NULL THEN
            COALESCE((
              SELECT SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(item, '$.valor')) AS DECIMAL(10,2)))
              FROM (
                SELECT JSON_EXTRACT(forma_pagamento_json, CONCAT('$[', n.n, ']')) as item
                FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) n
                WHERE JSON_EXTRACT(forma_pagamento_json, CONCAT('$[', n.n, ']')) IS NOT NULL
              ) items
              WHERE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(item, '$.tipo')), JSON_UNQUOTE(JSON_EXTRACT(item, '$.tipo_pagamento'))) IN ('cartao_debito', 'cartao_credito')
            ), 0)
          ELSE 0
        END) as totalVendasCartao,
        -- PIX: vendas simples + JSON processado
        SUM(CASE WHEN categoria = 'venda_pix' THEN valor ELSE 0 END) + 
        SUM(CASE 
          WHEN categoria = 'venda_multiplas' AND forma_pagamento_json IS NOT NULL THEN
            COALESCE((
              SELECT SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(item, '$.valor')) AS DECIMAL(10,2)))
              FROM (
                SELECT JSON_EXTRACT(forma_pagamento_json, CONCAT('$[', n.n, ']')) as item
                FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) n
                WHERE JSON_EXTRACT(forma_pagamento_json, CONCAT('$[', n.n, ']')) IS NOT NULL
              ) items
              WHERE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(item, '$.tipo')), JSON_UNQUOTE(JSON_EXTRACT(item, '$.tipo_pagamento'))) = 'pix'
            ), 0)
          ELSE 0
        END) as totalVendasPix,
        -- Múltiplas (para referência, mas valores já desagregados acima)
        SUM(CASE WHEN categoria = 'venda_multiplas' THEN valor ELSE 0 END) as totalVendasMultiplas,
        -- Pagamentos fiado
        SUM(CASE WHEN categoria = 'pagamento_fiado' THEN valor ELSE 0 END) as totalPagamentosFiado
      FROM todos_movimentos
    `

    const resumoResult = await executeQuery(resumoQuery, [dataInicio, dataFim, dataInicio, dataFim, dataInicio, dataFim]) as any[]
    const resumoData = resumoResult[0] || {}
    
    const resumo = {
      totalEntradas: Number(resumoData.totalEntradas) || 0,
      totalSaidas: Number(resumoData.totalSaidas) || 0,
      saldo: (Number(resumoData.totalEntradas) || 0) - (Number(resumoData.totalSaidas) || 0),
      totalVendasDinheiro: Number(resumoData.totalVendasDinheiro) || 0,
      totalVendasCartao: Number(resumoData.totalVendasCartao) || 0,
      totalVendasPix: Number(resumoData.totalVendasPix) || 0,
      totalVendasMultiplas: Number(resumoData.totalVendasMultiplas) || 0,
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
