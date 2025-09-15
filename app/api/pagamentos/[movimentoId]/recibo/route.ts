import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
import {
  gerarHtmlDocumento,
  empresaDefault,
  getClienteInfo,
  formatarValor,
  formatarData,
  type ClienteInfo
} from '@/lib/recibo-utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ movimentoId: string }> }) {
  try {
    const { movimentoId: movimentoIdParam } = await params
    const movimentoId = Number(movimentoIdParam)

    if (Number.isNaN(movimentoId)) {
      return NextResponse.json({ error: 'ID de movimento inválido' }, { status: 400 })
    }

    console.log('[API Recibo] Buscando pagamento fornecedor ID:', movimentoId)

    // Buscar dados do pagamento ao fornecedor
    const query = `
      SELECT
        pf.id,
        pf.fornecedor_id,
        pf.valor_pagamento as valor,
        pf.forma_pagamento,
        pf.data_pagamento,
        pf.observacoes,
        f.nome as fornecedor_nome,
        f.cnpj as fornecedor_cpf_cnpj,
        f.telefone as fornecedor_telefone
      FROM pagamentos_fornecedor pf
      JOIN fornecedores f ON pf.fornecedor_id = f.id
      WHERE pf.id = ?
    `

    const result = await executeQuery(query, [movimentoId]) as any[]

    if (result.length === 0) {
      console.log('[API Recibo] Pagamento fornecedor não encontrado para ID:', movimentoId)
      return NextResponse.json({ error: 'Pagamento ao fornecedor não encontrado' }, { status: 404 })
    }

    const pagamento = result[0]
    console.log('[API Recibo] Pagamento encontrado:', pagamento)

    // Preparar dados do fornecedor
    const clienteInfo: ClienteInfo = {
      nome: pagamento.fornecedor_nome,
      cpf: pagamento.fornecedor_cpf_cnpj || '',
      telefone: pagamento.fornecedor_telefone || ''
    }

    // Gerar conteúdo do recibo
    const conteudoRecibo = `
      <div class="documento-titulo">RECIBO DE PAGAMENTO</div>

      ${getClienteInfo(clienteInfo)}

      <div class="detalhes">
        <div class="linha">
          <span>Data:</span>
          <span>${formatarData(pagamento.data_pagamento)}</span>
        </div>

        <div class="linha">
          <span>Referência:</span>
          <span>Pagamento Fornecedor #${pagamento.id}</span>
        </div>

        <div class="linha">
          <span>Motivação:</span>
          <span>${pagamento.observacoes || 'Pagamento ao fornecedor'}</span>
        </div>

        <div class="linha">
          <span>Forma de Pagamento:</span>
          <span>${pagamento.forma_pagamento || 'Não especificado'}</span>
        </div>

        <div class="linha destaque">
          <span>VALOR PAGO:</span>
          <span class="valor">R$ ${formatarValor(Number(pagamento.valor))}</span>
        </div>

        <div class="linha">
          <span>Tipo:</span>
          <span>SAÍDA</span>
        </div>

        <div class="linha">
          <span>Categoria:</span>
          <span>Pagamento Fornecedor</span>
        </div>
      </div>

      <div class="assinatura">
        <div class="linha-assinatura"></div>
        <div>Assinatura do Responsável</div>
      </div>
    `

    const htmlRecibo = gerarHtmlDocumento(
      `Recibo Pagamento Fornecedor - ${pagamento.fornecedor_nome}`,
      conteudoRecibo,
      empresaDefault
    )

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
