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

    // Query principal para buscar movimentos (vendas, pagamentos de fiado e ajustes)
    const movimentosQuery = `
      SELECT
        id,
        tipo,
        categoria,
        valor,
        descricao,
        referencia,
        forma_pagamento,
        forma_pagamento_json,
        data_movimento,
        cliente_nome,
        valor_pago,
        troco
      FROM (
        -- Vendas
        SELECT
          v.id,
          'entrada' AS tipo,
          CASE
            WHEN v.forma_pagamento_json IS NOT NULL AND JSON_LENGTH(v.forma_pagamento_json) > 1 THEN 'venda_multiplas'
            WHEN v.forma_pagamento_json IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, '$[0].tipo')) = 'dinheiro' THEN 'venda_dinheiro'
            WHEN v.forma_pagamento_json IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, '$[0].tipo')) = 'cartao_debito' THEN 'venda_cartao_debito'
            WHEN v.forma_pagamento_json IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, '$[0].tipo')) = 'cartao_credito' THEN 'venda_cartao_credito'
            WHEN v.forma_pagamento_json IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, '$[0].tipo')) = 'pix' THEN 'venda_pix'
            ELSE 'venda_outros'
          END AS categoria,
          v.total AS valor,
          CONCAT('Venda #', v.id) AS descricao,
          CONCAT('Venda #', v.id) AS referencia,
          CASE
            WHEN v.forma_pagamento_json IS NOT NULL AND JSON_LENGTH(v.forma_pagamento_json) > 1 THEN 'Múltiplas'
            WHEN v.forma_pagamento_json IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, '$[0].tipo')) = 'dinheiro' THEN 'Dinheiro'
            WHEN v.forma_pagamento_json IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, '$[0].tipo')) = 'cartao_debito' THEN 'Cartão Débito'
            WHEN v.forma_pagamento_json IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, '$[0].tipo')) = 'cartao_credito' THEN 'Cartão Crédito'
            WHEN v.forma_pagamento_json IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, '$[0].tipo')) = 'pix' THEN 'PIX'
            ELSE COALESCE(v.forma_pagamento, 'N/A')
          END AS forma_pagamento,
          v.forma_pagamento_json AS forma_pagamento_json,
          v.data_venda AS data_movimento,
          c.nome AS cliente_nome,
          v.valor_pago,
          v.troco
        FROM vendas v
        LEFT JOIN clientes c ON v.cliente_id = c.id

        UNION ALL

        -- Pagamentos de fiado (entradas)
        SELECT
          fm.id,
          'entrada' AS tipo,
          'pagamento_fiado' AS categoria,
          fm.valor,
          COALESCE(fm.descricao, CONCAT('Pagamento Fiado #', fm.fiado_id)) AS descricao,
          fm.referencia,
          NULL AS forma_pagamento_json,
          CASE
            WHEN fm.referencia LIKE '%dinheiro%' THEN 'Dinheiro'
            WHEN fm.referencia LIKE '%cartao%' OR fm.referencia LIKE '%débito%' THEN 'Cartão Débito'
            WHEN fm.referencia LIKE '%crédito%' THEN 'Cartão Crédito'
            WHEN fm.referencia LIKE '%pix%' THEN 'PIX'
            ELSE 'Não especificado'
          END AS forma_pagamento,
          fm.data_movimento,
          c.nome AS cliente_nome,
          fm.valor AS valor_pago,
          NULL AS troco
        FROM fiado_movimentos fm
        JOIN clientes c ON fm.cliente_id = c.id
        WHERE fm.tipo = 'pagamento' AND fm.direcao = 'credito'

        UNION ALL

        -- Pagamentos de fornecedores (saídas) - da nova tabela
        SELECT
          mf.id + 300000 AS id,
          'saida' AS tipo,
          CASE
            WHEN mf.categoria = 'sangria' AND mf.referencia LIKE 'Pagamento fornecedor%' THEN 'sangria'
            ELSE 'pagamento_fornecedor'
          END AS categoria,
          mf.valor,
          COALESCE(mf.descricao, 'Pagamento a fornecedor') AS descricao,
          mf.referencia,
          NULL AS forma_pagamento_json,
          mf.forma_pagamento,
          mf.data_movimento,
          f.nome AS cliente_nome,
          NULL AS valor_pago,
          NULL AS troco
        FROM movimentacoes_financeiras mf
        LEFT JOIN fornecedores f ON mf.entidade_id = f.id AND mf.entidade_tipo = 'fornecedor'
        WHERE mf.tipo = 'saida' AND (mf.categoria = 'pagamento_fornecedor' OR (mf.categoria = 'sangria' AND mf.referencia LIKE 'Pagamento fornecedor%'))

        UNION ALL

        -- Ajustes (podem ser entrada ou saída)
        SELECT
          fm.id + 100000 AS id,
          CASE WHEN fm.direcao = 'credito' THEN 'entrada' ELSE 'saida' END AS tipo,
          'ajuste' AS categoria,
          fm.valor,
          COALESCE(fm.descricao, 'Ajuste de movimento') AS descricao,
          fm.referencia,
          NULL AS forma_pagamento_json,
          'Ajuste Manual' AS forma_pagamento,
          fm.data_movimento,
          c.nome AS cliente_nome,
          NULL AS valor_pago,
          NULL AS troco
        FROM fiado_movimentos fm
        JOIN clientes c ON fm.cliente_id = c.id
        WHERE fm.tipo = 'ajuste'
      ) AS todos_movimentos
      ${whereClause}
      ORDER BY data_movimento DESC, id DESC
    `

    const movimentos = await executeQuery(movimentosQuery, queryParams) as any[]

    // Calcular resumo financeiro usando forma_pagamento_json e colunas valor_pago/troco quando necessário
    const resumoQuery = `
      SELECT
        (
          -- Entradas provenientes de vendas: somar os valores dos itens do JSON quando existir, caso contrário usar valor_pago se definido, senão total
          SELECT COALESCE(SUM(
            CASE
              WHEN v.forma_pagamento_json IS NOT NULL THEN (
                SELECT COALESCE(SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, '].valor'))) AS DECIMAL(10,2))),0)
                FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) nums
                WHERE JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, ']')) IS NOT NULL
              )
              ELSE COALESCE(v.valor_pago, v.total)
            END
          ),0) FROM vendas v WHERE DATE(v.data_venda) >= ? AND DATE(v.data_venda) <= ?
  )
  /* Não somar pagamentos fiado em Entradas: fiado é anotação, não contabilizar como entrada */
  + (SELECT COALESCE(SUM(fm.valor),0) FROM fiado_movimentos fm WHERE fm.tipo = 'ajuste' AND fm.direcao = 'credito' AND DATE(fm.data_movimento) >= ? AND DATE(fm.data_movimento) <= ?)
        AS totalEntradas,

        -- Saídas (ajustes débito + pagamentos de fornecedores + sangrias)
        (SELECT COALESCE(SUM(fm.valor),0) FROM fiado_movimentos fm WHERE fm.tipo = 'ajuste' AND fm.direcao = 'debito' AND DATE(fm.data_movimento) >= ? AND DATE(fm.data_movimento) <= ?)
        + (SELECT COALESCE(SUM(mf.valor),0) FROM movimentacoes_financeiras mf WHERE mf.tipo = 'saida' AND mf.categoria IN ('pagamento_fornecedor', 'sangria') AND DATE(mf.data_movimento) >= ? AND DATE(mf.data_movimento) <= ?) AS totalSaidas,

        -- Totais por forma extraídos do JSON das vendas (itera até 10 itens)
        (SELECT COALESCE(SUM(
          CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, '].tipo'))) = 'dinheiro' THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, '].valor'))) AS DECIMAL(10,2)) ELSE 0 END
        ),0) FROM vendas v CROSS JOIN (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) nums WHERE DATE(v.data_venda) >= ? AND DATE(v.data_venda) <= ? AND v.forma_pagamento_json IS NOT NULL AND JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, ']')) IS NOT NULL) AS totalVendasDinheiro,

        (SELECT COALESCE(SUM(
          CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, '].tipo'))) = 'cartao_debito' THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, '].valor'))) AS DECIMAL(10,2)) ELSE 0 END
        ),0) FROM vendas v CROSS JOIN (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) nums WHERE DATE(v.data_venda) >= ? AND DATE(v.data_venda) <= ? AND v.forma_pagamento_json IS NOT NULL AND JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, ']')) IS NOT NULL) AS totalVendasCartaoDebito,

        (SELECT COALESCE(SUM(
          CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, '].tipo'))) = 'cartao_credito' THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, '].valor'))) AS DECIMAL(10,2)) ELSE 0 END
        ),0) FROM vendas v CROSS JOIN (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) nums WHERE DATE(v.data_venda) >= ? AND DATE(v.data_venda) <= ? AND v.forma_pagamento_json IS NOT NULL AND JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, ']')) IS NOT NULL) AS totalVendasCartaoCredito,

        (SELECT COALESCE(SUM(
          CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, '].tipo'))) = 'pix' THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, '].valor'))) AS DECIMAL(10,2)) ELSE 0 END
        ),0) FROM vendas v CROSS JOIN (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) nums WHERE DATE(v.data_venda) >= ? AND DATE(v.data_venda) <= ? AND v.forma_pagamento_json IS NOT NULL AND JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, ']')) IS NOT NULL) AS totalVendasPix,

        -- Pagamentos de fiado: somar lançamentos na tabela fiado_movimentos
        -- e também itens 'fiado' que podem estar dentro de vendas.forma_pagamento_json
        (SELECT 
          COALESCE(
            (SELECT COALESCE(SUM(fm.valor),0) FROM fiado_movimentos fm WHERE fm.tipo = 'pagamento' AND fm.direcao = 'credito' AND DATE(fm.data_movimento) >= ? AND DATE(fm.data_movimento) <= ?),
            0
          )
          + COALESCE(
            (SELECT COALESCE(SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, '].valor'))) AS DECIMAL(10,2))),0)
             FROM vendas v CROSS JOIN (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) nums
             WHERE DATE(v.data_venda) >= ? AND DATE(v.data_venda) <= ?
               AND v.forma_pagamento_json IS NOT NULL
               AND JSON_UNQUOTE(JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, '].tipo'))) = 'fiado'
               AND JSON_EXTRACT(v.forma_pagamento_json, CONCAT('$[', nums.n, ']')) IS NOT NULL
            ),
            0
          )
        ) AS totalPagamentosFiado
    `

    const resumoResult = await executeQuery(resumoQuery, [
      dataInicio, dataFim, // vendas - entradas
      dataInicio, dataFim, // ajustes credito
      dataInicio, dataFim, // ajustes debito (totalSaidas)
      dataInicio, dataFim, // pagamentos fornecedores (totalSaidas)
      dataInicio, dataFim, // totalVendasDinheiro
      dataInicio, dataFim, // totalVendasCartaoDebito
      dataInicio, dataFim, // totalVendasCartaoCredito
      dataInicio, dataFim, // totalVendasPix
      // parâmetros para totalPagamentosFiado: primeiro para fiado_movimentos, depois para pesquisa em vendas JSON
      dataInicio, dataFim,
      dataInicio, dataFim
    ]) as any[]
    const resumoData = resumoResult[0] || {}
    
    const resumo = {
      totalEntradas: Number(resumoData.totalEntradas) || 0,
      totalSaidas: Number(resumoData.totalSaidas) || 0,
      saldo: (Number(resumoData.totalEntradas) || 0) - (Number(resumoData.totalSaidas) || 0),
      totalVendasDinheiro: Number(resumoData.totalVendasDinheiro) || 0,
      totalVendasCartaoDebito: Number(resumoData.totalVendasCartaoDebito) || 0,
      totalVendasCartaoCredito: Number(resumoData.totalVendasCartaoCredito) || 0,
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
