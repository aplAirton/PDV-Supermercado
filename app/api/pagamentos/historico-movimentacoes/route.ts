import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio') || new Date().toISOString().split('T')[0]
    const dataFim = searchParams.get('dataFim') || new Date().toISOString().split('T')[0]
    const tipo = searchParams.get('tipo') || ''
    const categoria = searchParams.get('categoria') || ''

    // Construir filtros
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

    // Buscar todas as movimentações
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

    // Formatação de valores e datas
    const formatarValor = (valor: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor)
    }

    const formatarData = (data: string) => {
      return new Date(data).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatarDataCurta = (data: string) => {
      return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    // Helper para processar formas de pagamento detalhadas
    const getFormasPagamentoDetalhadas = (movimento: any) => {
      if (!movimento.forma_pagamento_json) {
        return movimento.forma_pagamento || 'N/A'
      }
      
      try {
        const pagamentosJson = JSON.parse(movimento.forma_pagamento_json)
        if (Array.isArray(pagamentosJson)) {
          return pagamentosJson.map((p: any) => {
            const tipo = (p.tipo || p.tipo_pagamento || '').toLowerCase()
            const valor = Number(p.valor || 0)
            
            let tipoFormatado = ''
            switch (tipo) {
              case 'dinheiro': tipoFormatado = 'Dinheiro'; break
              case 'cartao_debito': tipoFormatado = 'Cartão Débito'; break
              case 'cartao_credito': tipoFormatado = 'Cartão Crédito'; break
              case 'pix': tipoFormatado = 'PIX'; break
              case 'fiado': tipoFormatado = 'Fiado'; break
              default: tipoFormatado = tipo.charAt(0).toUpperCase() + tipo.slice(1); break
            }
            
            return `${tipoFormatado}: ${formatarValor(valor)}`
          }).join(', ')
        }
      } catch (error) {
        console.error('Erro ao processar forma_pagamento_json:', error)
      }
      
      return movimento.forma_pagamento || 'N/A'
    }

    // Informações da empresa
    const empresaInfo = {
      nome: "PDV Supermercado",
      endereco: "Rua Exemplo, 123 - Centro",
      cidade: "Cidade - UF",
      telefone: "(00) 0000-0000",
      cnpj: "00.000.000/0001-00"
    }

    // Gerar linhas do histórico
    const linhasHistorico = movimentos.map((movimento, index) => {
      const tipoIcon = movimento.tipo === 'entrada' ? '(+)' : '(-)'
      const valorFormatado = movimento.tipo === 'entrada' 
        ? `+${formatarValor(Math.abs(movimento.valor))}`
        : `-${formatarValor(Math.abs(movimento.valor))}`
      
      let linhaExtra = ''
      if (movimento.cliente_nome) {
        linhaExtra += `    Cliente: ${movimento.cliente_nome}\n`
      }
      if (movimento.valor_pago && movimento.valor_pago !== movimento.valor) {
        linhaExtra += `    Pago: ${formatarValor(movimento.valor_pago)}`
        if (movimento.troco && Number(movimento.troco) > 0) {
          linhaExtra += ` | Troco: ${formatarValor(movimento.troco)}`
        }
        linhaExtra += '\n'
      }
      
      return `${String(index + 1).padStart(3, '0')} - ${formatarData(movimento.data_movimento)}
${movimento.descricao}
Forma: ${getFormasPagamentoDetalhadas(movimento)}
${linhaExtra}Valor: ${tipoIcon} ${valorFormatado}
${'='.repeat(40)}`
    }).join('\n\n')

    // Calcular totais
    const totalEntradas = movimentos
      .filter(m => m.tipo === 'entrada')
      .reduce((sum, m) => sum + Number(m.valor), 0)
    
    const totalSaidas = movimentos
      .filter(m => m.tipo === 'saida')
      .reduce((sum, m) => sum + Number(m.valor), 0)

    // Gerar HTML do histórico
    const htmlHistorico = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Histórico de Movimentações - ${formatarDataCurta(dataInicio)} a ${formatarDataCurta(dataFim)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        
        .empresa-nome {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 4px;
        }
        
        .empresa-info {
            font-size: 9px;
            margin-bottom: 1px;
        }
        
        .documento-titulo {
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            margin: 12px 0;
            text-decoration: underline;
        }
        
        .periodo {
            text-align: center;
            font-size: 10px;
            margin-bottom: 15px;
            font-weight: bold;
        }
        
        .resumo {
            border: 1px solid #000;
            padding: 8px;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .resumo-linha {
            margin: 2px 0;
        }
        
        .movimentacoes {
            margin-bottom: 15px;
        }
        
        .movimento {
            font-size: 10px;
            margin-bottom: 8px;
            padding-bottom: 5px;
            white-space: pre-line;
        }
        
        .footer {
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px solid #000;
            text-align: center;
            font-size: 9px;
        }
        
        .data-impressao {
            text-align: center;
            font-size: 9px;
            margin-top: 12px;
        }
        
        @media print {
            body {
                padding: 0;
                font-size: 10px;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="empresa-nome">${empresaInfo.nome}</div>
        <div class="empresa-info">${empresaInfo.endereco}</div>
        <div class="empresa-info">${empresaInfo.cidade}</div>
        <div class="empresa-info">Tel: ${empresaInfo.telefone}</div>
        <div class="empresa-info">CNPJ: ${empresaInfo.cnpj}</div>
    </div>
    
    <div class="documento-titulo">HISTÓRICO DE MOVIMENTAÇÕES</div>
    
    <div class="periodo">
        Período: ${formatarDataCurta(dataInicio)} a ${formatarDataCurta(dataFim)}
    </div>
    
    <div class="resumo">
        <div class="resumo-linha"><strong>RESUMO DO PERÍODO</strong></div>
        <div class="resumo-linha">Total de Movimentos: ${movimentos.length}</div>
        <div class="resumo-linha">Entradas: ${formatarValor(totalEntradas)}</div>
        <div class="resumo-linha">Saídas: ${formatarValor(totalSaidas)}</div>
        <div class="resumo-linha"><strong>Saldo: ${formatarValor(totalEntradas - totalSaidas)}</strong></div>
    </div>
    
    <div class="movimentacoes">
        <div style="font-weight: bold; text-align: center; margin-bottom: 10px;">DETALHAMENTO DAS MOVIMENTAÇÕES</div>
        <div class="movimento">${linhasHistorico}</div>
    </div>
    
    <div class="footer">
        <div>════════════════════════════</div>
        <div>Sistema PDV - Relatório de Movimentos</div>
        <div>Total de ${movimentos.length} movimento(s) listado(s)</div>
    </div>
    
    <div class="data-impressao">
        Gerado em: ${new Date().toLocaleString('pt-BR')}
    </div>
    
    <script>
        // Auto-abrir diálogo de impressão
        window.addEventListener('load', function() {
            setTimeout(() => {
                window.print();
            }, 500);
        });
    </script>
</body>
</html>
    `

    return new Response(htmlHistorico, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('Erro ao gerar histórico:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
