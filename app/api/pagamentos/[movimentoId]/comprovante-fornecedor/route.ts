import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(request: NextRequest, { params }: { params: Promise<{ movimentoId: string }> }) {
  try {
    const { movimentoId: movimentoIdParam } = await params
    const movimentoId = Number(movimentoIdParam)

    if (Number.isNaN(movimentoId)) {
      return NextResponse.json({ error: 'ID de movimento inválido' }, { status: 400 })
    }

    // O movimentoId pode ser um ID modificado (mf.id + 300000) da tabela movimentacoes_financeiras
    // Para pagamentos a fornecedores, precisamos encontrar o ID real na tabela pagamentos_fornecedor
    let pagamentoId = movimentoId

    // Se o ID for maior que 300000, provavelmente é um ID modificado da movimentacoes_financeiras
    if (movimentoId >= 300000) {
      const realId = movimentoId - 300000

      // Verificar se existe um pagamento_fornecedor com esse ID
      const checkQuery = `SELECT id FROM pagamentos_fornecedor WHERE id = ?`
      const checkResult = await executeQuery(checkQuery, [realId]) as any[]

      if (checkResult.length > 0) {
        pagamentoId = realId
      } else {
        // Se não encontrou, tentar buscar pela movimentacao_financeira correspondente
        const mfQuery = `
          SELECT entidade_id
          FROM movimentacoes_financeiras
          WHERE id = ? AND entidade_tipo = 'fornecedor' AND tipo = 'saida'
        `
        const mfResult = await executeQuery(mfQuery, [realId]) as any[]

        if (mfResult.length > 0) {
          // Buscar o pagamento_fornecedor mais recente para esse fornecedor
          const pfQuery = `
            SELECT id FROM pagamentos_fornecedor
            WHERE fornecedor_id = ?
            ORDER BY data_pagamento DESC LIMIT 1
          `
          const pfResult = await executeQuery(pfQuery, [mfResult[0].entidade_id]) as any[]

          if (pfResult.length > 0) {
            pagamentoId = pfResult[0].id
          }
        }
      }
    }

    // Buscar dados do pagamento ao fornecedor
    const query = `
      SELECT
        pf.id as pagamento_id,
        pf.fornecedor_id,
        pf.valor_pagamento as valor,
        pf.forma_pagamento,
        pf.afeta_caixa,
        pf.data_pagamento,
        pf.observacoes,
        f.nome as fornecedor_nome,
        f.cnpj as fornecedor_cpf_cnpj,
        f.telefone as fornecedor_telefone
      FROM pagamentos_fornecedor pf
      JOIN fornecedores f ON pf.fornecedor_id = f.id
      WHERE pf.id = ?
    `

    const result = await executeQuery(query, [pagamentoId]) as any[]

    if (result.length === 0) {
      return NextResponse.json({ error: 'Pagamento ao fornecedor não encontrado' }, { status: 404 })
    }

    const dados = result[0]

    // Formatar data
    const dataFormatada = new Date(dados.data_pagamento).toLocaleDateString('pt-BR')

    // Formatar valor
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(dados.valor)

    // Gerar HTML do comprovante
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprovante de Pagamento - Fornecedor</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
            max-width: 400px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 2px 0;
        }
        .label {
            font-weight: bold;
        }
        .value {
            text-align: right;
        }
        .divider {
            border-top: 1px dashed #000;
            margin: 15px 0;
        }
        .total {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
            padding: 10px;
            border: 1px solid #000;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #666;
        }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">COMPROVANTE DE PAGAMENTO</div>
        <div>Fornecedor</div>
    </div>

    <div class="info-row">
        <span class="label">Data:</span>
        <span class="value">${dataFormatada}</span>
    </div>

    <div class="info-row">
        <span class="label">Fornecedor:</span>
        <span class="value">${dados.fornecedor_nome}</span>
    </div>

    <div class="info-row">
        <span class="label">CNPJ/CPF:</span>
        <span class="value">${dados.fornecedor_cpf_cnpj || 'N/A'}</span>
    </div>

    <div class="info-row">
        <span class="label">Forma de Pagamento:</span>
        <span class="value">${dados.forma_pagamento}</span>
    </div>

    ${dados.observacoes ? `
    <div class="info-row">
        <span class="label">Observações:</span>
        <span class="value">${dados.observacoes}</span>
    </div>
    ` : ''}

    <div class="info-row">
        <span class="label">Afeta Caixa:</span>
        <span class="value">${dados.afeta_caixa ? 'Sim' : 'Não'}</span>
    </div>

    <div class="divider"></div>

    <div class="total">
        VALOR PAGO: ${valorFormatado}
    </div>

    <div class="footer">
        <div>Comprovante gerado em ${new Date().toLocaleString('pt-BR')}</div>
        <div>ID do Pagamento: ${dados.pagamento_id}</div>
    </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('Erro ao gerar comprovante do fornecedor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}