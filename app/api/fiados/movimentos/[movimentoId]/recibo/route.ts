import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, context: any) {
  try {
    const { params } = await context
    const resolvedParams = await params
    const movimentoId = Number(resolvedParams?.movimentoId)
    
    if (Number.isNaN(movimentoId)) {
      return NextResponse.json({ error: 'ID de movimento inválido' }, { status: 400 })
    }

    // Buscar movimento específico do fiado (apenas pagamentos)
    const movimento: any = await prisma.$queryRaw`
      SELECT 
        fm.*,
        c.nome as cliente_nome,
        c.cpf as cliente_cpf,
        c.telefone as cliente_telefone
      FROM fiado_movimentos fm
      JOIN clientes c ON fm.cliente_id = c.id
      WHERE fm.id = ${movimentoId} 
        AND fm.tipo = 'pagamento' 
        AND fm.direcao = 'credito'
    `
    
    if (!movimento || movimento.length === 0) {
      return NextResponse.json({ error: 'Movimento de pagamento não encontrado' }, { status: 404 })
    }

    const movimentoData = movimento[0]
    
    // Buscar dados da empresa
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
        <title>Recibo - Pagamento Fiado</title>
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
                background-color: #f0f0f0;
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
            
            .cliente-info {
                background-color: #f9f9f9;
                padding: 8px;
                border: 1px solid #ddd;
                margin-bottom: 15px;
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

        <div class="recibo-titulo">RECIBO DE PAGAMENTO - FIADO</div>

        <div class="cliente-info">
            <div class="linha">
                <span><strong>Cliente:</strong></span>
                <span>${movimentoData.cliente_nome}</span>
            </div>
            ${movimentoData.cliente_cpf ? `
            <div class="linha">
                <span><strong>CPF:</strong></span>
                <span>${movimentoData.cliente_cpf}</span>
            </div>
            ` : ''}
            ${movimentoData.cliente_telefone ? `
            <div class="linha">
                <span><strong>Telefone:</strong></span>
                <span>${movimentoData.cliente_telefone}</span>
            </div>
            ` : ''}
        </div>

        <div class="detalhes">
            <div class="linha">
                <span>Data Pagamento:</span>
                <span>${new Date(movimentoData.data_movimento).toLocaleString('pt-BR')}</span>
            </div>
            
            ${movimentoData.referencia ? `
            <div class="linha">
                <span>Referência:</span>
                <span>${movimentoData.referencia}</span>
            </div>
            ` : ''}
            
            ${movimentoData.fiado_id ? `
            <div class="linha">
                <span>Fiado #:</span>
                <span>${movimentoData.fiado_id}</span>
            </div>
            ` : ''}
            
            <div class="linha">
                <span>Descrição:</span>
                <span>${movimentoData.descricao || 'Pagamento de fiado'}</span>
            </div>
            
            <div class="linha destaque">
                <span>VALOR PAGO:</span>
                <span class="valor">R$ ${Number(movimentoData.valor).toFixed(2).replace('.', ',')}</span>
            </div>
        </div>

        <div class="assinatura">
            <div class="linha-assinatura"></div>
            <div>Assinatura do Cliente</div>
        </div>

        <div class="rodape">
            <div>Documento gerado em ${new Date().toLocaleString('pt-BR')}</div>
            <div>Sistema PDV - Controle de Fiados</div>
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
    console.error('Erro ao gerar recibo de fiado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
