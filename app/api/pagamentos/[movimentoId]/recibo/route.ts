import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(request: NextRequest, context: any) {
  try {
    const { params } = await context
    const resolvedParams = await params
    const movimentoId = Number(resolvedParams?.movimentoId)
    
    if (Number.isNaN(movimentoId)) {
      return NextResponse.json({ error: 'ID de movimento inválido' }, { status: 400 })
    }

    // Buscar detalhes do movimento específico
    const movimentoQuery = `
      SELECT 
        id,
        tipo,
        categoria,
        valor,
        descricao,
        referencia,
        forma_pagamento,
        data_movimento,
        cliente_nome,
        cliente_id
      FROM (
        -- Vendas em dinheiro, cartão e PIX
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
          c.nome as cliente_nome,
          v.cliente_id
        FROM vendas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        WHERE v.forma_pagamento IN ('dinheiro', 'cartao_debito', 'cartao_credito', 'pix')
        
        UNION ALL
        
        -- Pagamentos de fiado
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
          c.nome as cliente_nome,
          fm.cliente_id
        FROM fiado_movimentos fm
        JOIN clientes c ON fm.cliente_id = c.id
        WHERE fm.tipo = 'pagamento' AND fm.direcao = 'credito'
      ) AS todos_movimentos
      WHERE id = ?
    `

    const movimentos = await executeQuery(movimentoQuery, [movimentoId]) as any[]
    
    if (movimentos.length === 0) {
      return NextResponse.json({ error: 'Movimento não encontrado' }, { status: 404 })
    }

    const movimento = movimentos[0]
    
    // Buscar dados da empresa (pode vir de configuração ou banco)
    const empresaInfo = {
      nome: 'Supermercado PDV Airton',
      endereco: 'Rua Principal, 123 - Centro',
      telefone: '(11) 9999-9999',
      cnpj: '12.345.678/0001-90'
    }

    // Gerar HTML do recibo para impressão
    const htmlRecibo = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo - ${movimento.referencia}</title>
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
                max-width: 300px;
                margin: 0 auto;
            }
            
            .cabecalho {
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
            
            .recibo-titulo {
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                margin: 15px 0;
                padding: 5px;
                border: 1px solid #000;
            }
            
            .detalhes {
                margin-bottom: 15px;
            }
            
            .linha {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                padding: 2px 0;
            }
            
            .linha.destaque {
                font-weight: bold;
                font-size: 13px;
                border-top: 1px dashed #000;
                border-bottom: 1px dashed #000;
                padding: 5px 0;
                margin: 10px 0;
            }
            
            .valor {
                text-align: right;
                font-weight: bold;
            }
            
            .rodape {
                margin-top: 20px;
                text-align: center;
                font-size: 10px;
                border-top: 1px dashed #000;
                padding-top: 10px;
            }
            
            .assinatura {
                margin-top: 30px;
                text-align: center;
            }
            
            .linha-assinatura {
                border-top: 1px solid #000;
                width: 200px;
                margin: 30px auto 10px;
            }
            
            @media print {
                body {
                    padding: 10px;
                }
                .no-print {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="cabecalho">
            <div class="empresa-nome">${empresaInfo.nome}</div>
            <div class="empresa-info">${empresaInfo.endereco}</div>
            <div class="empresa-info">Tel: ${empresaInfo.telefone}</div>
            <div class="empresa-info">CNPJ: ${empresaInfo.cnpj}</div>
        </div>

        <div class="recibo-titulo">RECIBO DE PAGAMENTO</div>

        <div class="detalhes">
            <div class="linha">
                <span>Data:</span>
                <span>${new Date(movimento.data_movimento).toLocaleString('pt-BR')}</span>
            </div>
            
            <div class="linha">
                <span>Referência:</span>
                <span>${movimento.referencia || movimento.descricao}</span>
            </div>
            
            ${movimento.cliente_nome ? `
            <div class="linha">
                <span>Cliente:</span>
                <span>${movimento.cliente_nome}</span>
            </div>
            ` : ''}
            
            <div class="linha">
                <span>Forma Pagamento:</span>
                <span>${movimento.forma_pagamento}</span>
            </div>
            
            <div class="linha">
                <span>Descrição:</span>
                <span>${movimento.descricao}</span>
            </div>
            
            <div class="linha destaque">
                <span>VALOR RECEBIDO:</span>
                <span class="valor">R$ ${Number(movimento.valor).toFixed(2).replace('.', ',')}</span>
            </div>
        </div>

        <div class="assinatura">
            <div class="linha-assinatura"></div>
            <div>Assinatura do Responsável</div>
        </div>

        <div class="rodape">
            <div>Documento gerado em ${new Date().toLocaleString('pt-BR')}</div>
            <div>Sistema PDV - Controle de Pagamentos</div>
        </div>

        <script>
            window.onload = function() {
                window.print();
            }
        </script>
    </body>
    </html>
    `

    return new Response(htmlRecibo, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('Erro ao gerar recibo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
