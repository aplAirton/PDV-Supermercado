import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio') || new Date().toISOString().split('T')[0]
    const dataFim = searchParams.get('dataFim') || new Date().toISOString().split('T')[0]
    const tipo = searchParams.get('tipo') || ''
    const categoria = searchParams.get('categoria') || ''

    // Buscar resumo financeiro
    const resumoQuery = `
      SELECT
        (
          -- Entradas provenientes de vendas
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
        + (SELECT COALESCE(SUM(fm.valor),0) FROM fiado_movimentos fm WHERE fm.tipo = 'ajuste' AND fm.direcao = 'credito' AND DATE(fm.data_movimento) >= ? AND DATE(fm.data_movimento) <= ?)
        AS totalEntradas,

        (SELECT COALESCE(SUM(fm.valor),0) FROM fiado_movimentos fm WHERE fm.tipo = 'ajuste' AND fm.direcao = 'debito' AND DATE(fm.data_movimento) >= ? AND DATE(fm.data_movimento) <= ?) AS totalSaidas,

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
      dataInicio, dataFim, // ajustes debito
      dataInicio, dataFim, // totalVendasDinheiro
      dataInicio, dataFim, // totalVendasCartaoDebito
      dataInicio, dataFim, // totalVendasCartaoCredito
      dataInicio, dataFim, // totalVendasPix
      dataInicio, dataFim, // totalPagamentosFiado - fiado_movimentos
      dataInicio, dataFim  // totalPagamentosFiado - vendas JSON
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

    // Formatação de valores
    const formatarValor = (valor: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor)
    }

    const formatarData = (data: string) => {
      return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    // Informações da empresa (usando dados padrão)
    const empresaInfo = {
      nome: "PDV Airton",
      endereco: "Rua Exemplo, 123 - Centro",
      cidade: "Cidade - UF",
      telefone: "(00) 0000-0000",
      cnpj: "00.000.000/0001-00"
    }

    // Gerar HTML do extrato
    const htmlExtrato = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extrato de Movimentos - ${formatarData(dataInicio)} a ${formatarData(dataFim)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: #fff;
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        .empresa-nome {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .empresa-info {
            font-size: 10px;
            margin-bottom: 2px;
        }
        
        .documento-titulo {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
            text-decoration: underline;
        }
        
        .periodo {
            text-align: center;
            font-size: 11px;
            margin-bottom: 20px;
            font-weight: bold;
        }
        
        .secao {
            margin-bottom: 20px;
        }
        
        .secao-titulo {
            font-weight: bold;
            border-bottom: 1px solid #000;
            margin-bottom: 8px;
            padding-bottom: 2px;
        }
        
        .linha {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }
        
        .linha-destaque {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 3px 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            font-weight: bold;
        }
        
        .total-section {
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 15px;
        }
        
        .valor-positivo {
            color: #000;
        }
        
        .valor-negativo {
            color: #000;
        }
        
        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #000;
            text-align: center;
            font-size: 10px;
        }
        
        .data-impressao {
            text-align: center;
            font-size: 10px;
            margin-top: 15px;
        }
        
        @media print {
            body {
                padding: 0;
                font-size: 11px;
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
    
    <div class="documento-titulo">EXTRATO DE MOVIMENTOS</div>
    
    <div class="periodo">
        Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}
    </div>
    
    <div class="secao">
        <div class="secao-titulo">RESUMO FINANCEIRO</div>
        <div class="linha">
            <span>Total de Entradas:</span>
            <span class="valor-positivo">${formatarValor(resumo.totalEntradas)}</span>
        </div>
        <div class="linha">
            <span>Total de Saídas:</span>
            <span class="valor-negativo">${formatarValor(resumo.totalSaidas)}</span>
        </div>
        <div class="linha-destaque">
            <span>SALDO DO PERÍODO:</span>
            <span class="${resumo.saldo >= 0 ? 'valor-positivo' : 'valor-negativo'}">${formatarValor(resumo.saldo)}</span>
        </div>
    </div>
    
    <div class="secao">
        <div class="secao-titulo">DETALHAMENTO POR FORMA DE PAGAMENTO</div>
        <div class="linha">
            <span>Dinheiro:</span>
            <span>${formatarValor(resumo.totalVendasDinheiro)}</span>
        </div>
        <div class="linha">
            <span>Cartão Débito:</span>
            <span>${formatarValor(resumo.totalVendasCartaoDebito)}</span>
        </div>
        <div class="linha">
            <span>Cartão Crédito:</span>
            <span>${formatarValor(resumo.totalVendasCartaoCredito)}</span>
        </div>
        <div class="linha">
            <span>PIX:</span>
            <span>${formatarValor(resumo.totalVendasPix)}</span>
        </div>
        <div class="linha">
            <span>Pagamentos Fiado:</span>
            <span>${formatarValor(resumo.totalPagamentosFiado)}</span>
        </div>
    </div>
    
    <div class="footer">
        <div>═══════════════════════════════</div>
        <div>Sistema PDV - Controle Financeiro</div>
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

    return new Response(htmlExtrato, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('Erro ao gerar extrato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
