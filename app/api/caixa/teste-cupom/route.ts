import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Dados simulados para teste
    const caixaData = {
      id: 1,
      funcionario_nome: 'João Silva',
      funcionario_cargo: 'Operador',
      valor_inicial: 100.00,
      valor_final: 850.75,
      data_abertura: new Date().toISOString(),
      data_fechamento: new Date().toISOString(),
      observacoes_abertura: 'Caixa aberto normalmente',
      observacoes_fechamento: 'Fechamento sem intercorrências'
    }

    const vendas = [
      { id: 1, total: 45.50, valor_dinheiro: 45.50, valor_cartao_debito: 0, valor_cartao_credito: 0, valor_pix: 0, valor_fiado: 0 },
      { id: 2, total: 120.00, valor_dinheiro: 0, valor_cartao_debito: 120.00, valor_cartao_credito: 0, valor_pix: 0, valor_fiado: 0 },
      { id: 3, total: 89.25, valor_dinheiro: 0, valor_cartao_debito: 0, valor_cartao_credito: 89.25, valor_pix: 0, valor_fiado: 0 },
    ]

    const movimentacoes = [
      { id: 1, tipo: 'suprimento', valor: 200.00, descricao: 'Suprimento de troco', data_criacao: new Date().toISOString() },
      { id: 2, tipo: 'sangria', valor: 150.00, descricao: 'Sangria para cofre', data_criacao: new Date().toISOString() }
    ]

    const totalVendas = vendas.reduce((sum, v) => sum + v.total, 0)
    const totalSuprimentos = movimentacoes.filter(m => m.tipo === 'suprimento').reduce((sum, m) => sum + m.valor, 0)
    const totalSangrias = movimentacoes.filter(m => m.tipo === 'sangria').reduce((sum, m) => sum + m.valor, 0)

    const totaisPorForma = vendas.reduce((acc, v) => {
      acc.dinheiro += v.valor_dinheiro || 0
      acc.cartao_debito += v.valor_cartao_debito || 0
      acc.cartao_credito += v.valor_cartao_credito || 0
      acc.pix += v.valor_pix || 0
      acc.fiado += v.valor_fiado || 0
      return acc
    }, { dinheiro: 0, cartao_debito: 0, cartao_credito: 0, pix: 0, fiado: 0 })

    const valorEsperado = caixaData.valor_inicial + totalVendas + totalSuprimentos - totalSangrias
    const valorContado = caixaData.valor_final
    const diferenca = valorContado - valorEsperado
    const statusReconciliacao = diferenca === 0 ? 'PERFEITO' : diferenca > 0 ? 'SOBRA' : 'FALTA'

    const formatarValor = (valor: number): string => {
      return Number(valor).toFixed(2).replace('.', ',')
    }

    const formatarData = (data: string): string => {
      return new Date(data).toLocaleString('pt-BR')
    }

    // HTML do cupom
    const htmlCupom = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Resumo de Caixa - Teste</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              background: #fff;
              padding: 15px;
              max-width: 300px;
              margin: 0 auto;
            }
            .cabecalho {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .empresa-nome { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .empresa-info { font-size: 10px; margin-bottom: 2px; }
            .documento-titulo {
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              margin: 15px 0;
              padding: 5px;
              border: 1px solid #000;
              background: #f0f0f0;
            }
            .detalhes { margin-bottom: 15px; }
            .linha {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              padding: 2px 0;
            }
            .linha.destaque {
              font-weight: bold;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 5px 0;
              margin: 10px 0;
            }
            .valor { text-align: right; font-weight: bold; }
            .formas-pagamento {
              background: #f9f9f9;
              padding: 8px;
              border: 1px solid #ddd;
              margin: 10px 0;
            }
            .formas-titulo {
              font-weight: bold;
              margin-bottom: 8px;
              text-align: center;
              border-bottom: 1px dotted #ccc;
              padding-bottom: 4px;
            }
            .forma-item {
              display: flex;
              justify-content: space-between;
              padding: 3px 5px;
              background: #fff;
              border: 1px solid #eee;
              margin-bottom: 3px;
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
              body { padding: 10px; }
              .documento-titulo { background: transparent !important; }
              .formas-pagamento { background: transparent !important; }
            }
          </style>
      </head>
      <body>
        <div class="cabecalho">
          <div class="empresa-nome">Supermercado PDV Airton</div>
          <div class="empresa-info">Rua Principal, 123 - Centro</div>
          <div class="empresa-info">Tel: (11) 9999-9999</div>
          <div class="empresa-info">CNPJ: 12.345.678/0001-90</div>
        </div>

        <div class="documento-titulo">RESUMO DE FECHAMENTO DE CAIXA</div>
        
        <div class="detalhes">
          <div class="linha">
            <span><strong>Caixa ID:</strong></span>
            <span>#${caixaData.id}</span>
          </div>
          <div class="linha">
            <span><strong>Operador:</strong></span>
            <span>${caixaData.funcionario_nome}</span>
          </div>
          <div class="linha">
            <span><strong>Cargo:</strong></span>
            <span>${caixaData.funcionario_cargo}</span>
          </div>
          <div class="linha">
            <span><strong>Abertura:</strong></span>
            <span>${formatarData(caixaData.data_abertura)}</span>
          </div>
          <div class="linha">
            <span><strong>Fechamento:</strong></span>
            <span>${formatarData(caixaData.data_fechamento)}</span>
          </div>
        </div>

        <div class="documento-titulo">MOVIMENTAÇÃO FINANCEIRA</div>
        
        <div class="detalhes">
          <div class="linha">
            <span>Valor Inicial:</span>
            <span class="valor">R$ ${formatarValor(caixaData.valor_inicial)}</span>
          </div>
          <div class="linha">
            <span>Total de Vendas:</span>
            <span class="valor">R$ ${formatarValor(totalVendas)}</span>
          </div>
          <div class="linha">
            <span>Suprimentos:</span>
            <span class="valor">+ R$ ${formatarValor(totalSuprimentos)}</span>
          </div>
          <div class="linha">
            <span>Sangrias:</span>
            <span class="valor">- R$ ${formatarValor(totalSangrias)}</span>
          </div>
          <div class="linha destaque">
            <span>Valor Esperado:</span>
            <span class="valor">R$ ${formatarValor(valorEsperado)}</span>
          </div>
          <div class="linha">
            <span>Valor Contado:</span>
            <span class="valor">R$ ${formatarValor(valorContado)}</span>
          </div>
          <div class="linha destaque" style="color: ${diferenca === 0 ? '#2e7d32' : diferenca > 0 ? '#1976d2' : '#d32f2f'}">
            <span>${statusReconciliacao}:</span>
            <span class="valor">R$ ${formatarValor(Math.abs(diferenca))}</span>
          </div>
        </div>

        <div class="formas-pagamento">
          <div class="formas-titulo">FORMAS DE PAGAMENTO</div>
          <div class="forma-item">
            <span><strong>Dinheiro:</strong></span>
            <span>R$ ${formatarValor(totaisPorForma.dinheiro)}</span>
          </div>
          <div class="forma-item">
            <span><strong>Cartão Débito:</strong></span>
            <span>R$ ${formatarValor(totaisPorForma.cartao_debito)}</span>
          </div>
          <div class="forma-item">
            <span><strong>Cartão Crédito:</strong></span>
            <span>R$ ${formatarValor(totaisPorForma.cartao_credito)}</span>
          </div>
          <div class="forma-item">
            <span><strong>PIX:</strong></span>
            <span>R$ ${formatarValor(totaisPorForma.pix)}</span>
          </div>
          <div class="forma-item">
            <span><strong>Fiado:</strong></span>
            <span>R$ ${formatarValor(totaisPorForma.fiado)}</span>
          </div>
        </div>

        <div class="documento-titulo">RESUMO DE VENDAS</div>
        
        <div class="detalhes">
          <div class="linha">
            <span>Total de Transações:</span>
            <span class="valor">${vendas.length}</span>
          </div>
          <div class="linha">
            <span>Valor Total Vendido:</span>
            <span class="valor">R$ ${formatarValor(totalVendas)}</span>
          </div>
          <div class="linha">
            <span>Ticket Médio:</span>
            <span class="valor">R$ ${formatarValor(vendas.length > 0 ? totalVendas / vendas.length : 0)}</span>
          </div>
        </div>

        <div class="detalhes">
          <div class="linha destaque">
            <span><strong>Obs. Abertura:</strong></span>
          </div>
          <div style="padding: 8px; background: #f9f9f9; border: 1px dashed #ccc; margin: 5px 0;">
            ${caixaData.observacoes_abertura}
          </div>
        </div>

        <div class="detalhes">
          <div class="linha destaque">
            <span><strong>Obs. Fechamento:</strong></span>
          </div>
          <div style="padding: 8px; background: #f9f9f9; border: 1px dashed #ccc; margin: 5px 0;">
            ${caixaData.observacoes_fechamento}
          </div>
        </div>

        <div class="assinatura">
          <div class="linha-assinatura"></div>
          <div>Assinatura do Responsável</div>
        </div>

        <div class="rodape">
          <div>Documento gerado em ${new Date().toLocaleString('pt-BR')}</div>
          <div>Sistema PDV - Resumo de Caixa</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `

    return new NextResponse(htmlCupom, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('Erro ao gerar cupom de teste:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
