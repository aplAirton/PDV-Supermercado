import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio') || new Date().toISOString().split('T')[0]
    const dataFim = searchParams.get('dataFim') || new Date().toISOString().split('T')[0]
    const tipo = searchParams.get('tipo') || ''
    const categoria = searchParams.get('categoria') || ''
    const formato = searchParams.get('formato') || 'csv'

    // Construir query base (mesma lógica da API de movimentos)
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

    const movimentosQuery = `
      SELECT 
        DATE_FORMAT(data_movimento, '%d/%m/%Y %H:%i') as data_hora,
        CASE 
          WHEN tipo = 'entrada' THEN 'Entrada'
          WHEN tipo = 'saida' THEN 'Saída'
        END as tipo_movimento,
        CASE 
          WHEN categoria = 'venda_dinheiro' THEN 'Venda - Dinheiro'
          WHEN categoria = 'venda_cartao' THEN 'Venda - Cartão'
          WHEN categoria = 'venda_pix' THEN 'Venda - PIX'
          WHEN categoria = 'pagamento_fiado' THEN 'Pagamento de Fiado'
          WHEN categoria = 'ajuste' THEN 'Ajuste'
          ELSE categoria
        END as categoria_movimento,
        descricao,
        referencia,
        forma_pagamento,
        COALESCE(cliente_nome, 'N/A') as cliente,
        FORMAT(valor, 2, 'pt_BR') as valor_formatado,
        valor
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
          fm.id + 100000 as id,
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

    if (formato === 'csv') {
      // Gerar CSV
      const headers = [
        'Data/Hora',
        'Tipo',
        'Categoria', 
        'Descrição',
        'Referência',
        'Forma Pagamento',
        'Cliente',
        'Valor'
      ]

      let csvContent = headers.join(';') + '\n'
      
      movimentos.forEach((movimento: any) => {
        const linha = [
          movimento.data_hora,
          movimento.tipo_movimento,
          movimento.categoria_movimento,
          `"${movimento.descricao}"`,
          movimento.referencia || '',
          movimento.forma_pagamento || '',
          movimento.cliente,
          `R$ ${movimento.valor_formatado}`
        ]
        csvContent += linha.join(';') + '\n'
      })

      // Adicionar resumo no final
      const totalEntradas = movimentos
        .filter(m => m.tipo_movimento === 'Entrada')
        .reduce((sum, m) => sum + m.valor, 0)
      const totalSaidas = movimentos
        .filter(m => m.tipo_movimento === 'Saída')
        .reduce((sum, m) => sum + m.valor, 0)
      const saldo = totalEntradas - totalSaidas

      csvContent += '\n'
      csvContent += 'RESUMO;;;;;;;;' + '\n'
      csvContent += `Total de Entradas;;;;;;;;R$ ${totalEntradas.toFixed(2).replace('.', ',')}` + '\n'
      csvContent += `Total de Saídas;;;;;;;;R$ ${totalSaidas.toFixed(2).replace('.', ',')}` + '\n'
      csvContent += `Saldo;;;;;;;;R$ ${saldo.toFixed(2).replace('.', ',')}` + '\n'

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio-financeiro-${dataInicio}-${dataFim}.csv"`
        }
      })
    }

    // Se não for CSV, retornar JSON
    return NextResponse.json({ movimentos })

  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
