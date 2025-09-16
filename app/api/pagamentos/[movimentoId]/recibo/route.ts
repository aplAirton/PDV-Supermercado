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

    console.log('[API Recibo] Buscando movimento ID:', movimentoId)

    // Primeiro, tentar buscar como venda (caso mais comum para recibos de vendas)
    const vendaQuery = `
      SELECT
        v.id,
        v.total as valor,
        v.forma_pagamento_json,
        v.data_venda,
        v.troco,
        v.valor_pago,
        c.nome as cliente_nome,
        c.cpf as cliente_cpf,
        c.telefone as cliente_telefone
      FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.id = ?
    `

    const vendaResult = await executeQuery(vendaQuery, [movimentoId]) as any[]

    if (vendaResult.length > 0) {
      const venda = vendaResult[0]
      console.log('[API Recibo] Venda encontrada:', venda)

      const clienteInfo: ClienteInfo = {
        nome: venda.cliente_nome || 'Cliente não identificado',
        cpf: venda.cliente_cpf || '',
        telefone: venda.cliente_telefone || ''
      }

      // Determinar forma de pagamento para exibição
      let formaPagamentoDisplay = 'Não especificado'
      if (venda.forma_pagamento_json) {
        try {
          const pagamentos = JSON.parse(venda.forma_pagamento_json)
          if (Array.isArray(pagamentos) && pagamentos.length > 0) {
            if (pagamentos.length === 1) {
              const tipo = pagamentos[0].tipo
              const tipoMap: Record<string, string> = {
                dinheiro: 'Dinheiro',
                cartao_debito: 'Cartão Débito',
                cartao_credito: 'Cartão Crédito',
                pix: 'PIX',
                fiado: 'Fiado'
              }
              formaPagamentoDisplay = tipoMap[tipo] || tipo
            } else {
              formaPagamentoDisplay = 'Múltiplas Formas'
            }
          }
        } catch (e) {
          formaPagamentoDisplay = 'Erro na forma de pagamento'
        }
      }

      const conteudoRecibo = `
        <div class="documento-titulo">RECIBO DE VENDA</div>

        ${getClienteInfo(clienteInfo)}

        <div class="detalhes">
          <div class="linha">
            <span>Data:</span>
            <span>${formatarData(venda.data_venda)}</span>
          </div>

          <div class="linha">
            <span>Referência:</span>
            <span>Venda #${venda.id}</span>
          </div>

          <div class="linha">
            <span>Forma de Pagamento:</span>
            <span>${formaPagamentoDisplay}</span>
          </div>

          <div class="linha destaque">
            <span>VALOR TOTAL:</span>
            <span class="valor">R$ ${formatarValor(Number(venda.valor))}</span>
          </div>

          <div class="linha">
            <span>Valor Pago:</span>
            <span>R$ ${formatarValor(Number(venda.valor_pago || venda.valor))}</span>
          </div>

          ${venda.troco && Number(venda.troco) > 0 ? `
          <div class="linha">
            <span>Troco:</span>
            <span>R$ ${formatarValor(Number(venda.troco))}</span>
          </div>
          ` : ''}

          <div class="linha">
            <span>Tipo:</span>
            <span>ENTRADA</span>
          </div>

          <div class="linha">
            <span>Categoria:</span>
            <span>Venda</span>
          </div>
        </div>

        <div class="assinatura">
          <div class="linha-assinatura"></div>
          <div>Assinatura do Cliente</div>
        </div>
      `

      const htmlRecibo = gerarHtmlDocumento(
        `Recibo Venda - ${venda.cliente_nome || 'Cliente'}`,
        conteudoRecibo,
        empresaDefault
      )

      return new Response(htmlRecibo, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      })
    }

    // Primeiro, tentar buscar como pagamento fornecedor direto (caso mais comum)
    const fornecedorQuery = `
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

    const fornecedorResult = await executeQuery(fornecedorQuery, [movimentoId]) as any[]

    if (fornecedorResult.length > 0) {
      const pagamento = fornecedorResult[0]
      console.log('[API Recibo] Pagamento fornecedor encontrado:', pagamento)

      const clienteInfo: ClienteInfo = {
        nome: pagamento.fornecedor_nome,
        cpf: pagamento.fornecedor_cpf_cnpj || '',
        telefone: pagamento.fornecedor_telefone || ''
      }

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
    }

    // Se não encontrou como pagamento fornecedor, tentar como movimento financeiro
    const mfQuery = `
      SELECT
        mf.id,
        mf.tipo,
        mf.categoria,
        mf.valor,
        mf.descricao,
        mf.referencia,
        mf.entidade_tipo,
        mf.entidade_id,
        mf.forma_pagamento,
        mf.data_movimento,
        mf.saldo_anterior,
        mf.saldo_posterior
      FROM movimentacoes_financeiras mf
      WHERE mf.id = ?
    `

    const movimentoResult = await executeQuery(mfQuery, [movimentoId]) as any[]

    if (movimentoResult.length > 0) {
      const mov = movimentoResult[0]
      console.log('[API Recibo] Movimento financeiro encontrado:', mov)

      // Para movimentos de caixa (sangria/suprimento)
      if (mov.categoria === 'sangria' || mov.categoria === 'suprimento') {
        const clienteInfo: ClienteInfo = {
          nome: 'Sistema de Caixa',
          cpf: '',
          telefone: ''
        }

        const tipoMovimento = mov.categoria === 'sangria' ? 'SANGRIA' : 'SUPRIMENTO'
        const tipoOperacao = mov.tipo === 'saida' ? 'SAÍDA' : 'ENTRADA'

        const conteudoRecibo = `
          <div class="documento-titulo">RECIBO DE ${tipoMovimento}</div>

          ${getClienteInfo(clienteInfo)}

          <div class="detalhes">
            <div class="linha">
              <span>Data:</span>
              <span>${formatarData(mov.data_movimento)}</span>
            </div>

            <div class="linha">
              <span>Referência:</span>
              <span>Movimento #${mov.id}</span>
            </div>

            <div class="linha">
              <span>Motivação:</span>
              <span>${mov.descricao || `${tipoMovimento} do caixa`}</span>
            </div>

            <div class="linha">
              <span>Forma de Pagamento:</span>
              <span>${mov.forma_pagamento || 'Dinheiro'}</span>
            </div>

            <div class="linha destaque">
              <span>VALOR ${tipoMovimento}:</span>
              <span class="valor">R$ ${formatarValor(Number(mov.valor))}</span>
            </div>

            <div class="linha">
              <span>Tipo:</span>
              <span>${tipoOperacao}</span>
            </div>

            <div class="linha">
              <span>Categoria:</span>
              <span>${tipoMovimento}</span>
            </div>
          </div>

          <div class="assinatura">
            <div class="linha-assinatura"></div>
            <div>Assinatura do Responsável</div>
          </div>
        `

        const htmlRecibo = gerarHtmlDocumento(
          `Recibo ${tipoMovimento} - Sistema de Caixa`,
          conteudoRecibo,
          empresaDefault
        )

        return new Response(htmlRecibo, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8'
          }
        })
      }

      // Movimento genérico
      const clienteInfo: ClienteInfo = {
        nome: 'Sistema',
        cpf: '',
        telefone: ''
      }

      const conteudoRecibo = `
        <div class="documento-titulo">RECIBO</div>

        ${getClienteInfo(clienteInfo)}

        <div class="detalhes">
          <div class="linha">
            <span>Data:</span>
            <span>${formatarData(mov.data_movimento)}</span>
          </div>

          <div class="linha">
            <span>Referência:</span>
            <span>Movimento #${mov.id}</span>
          </div>

          <div class="linha">
            <span>Motivação:</span>
            <span>${mov.descricao || 'Movimento financeiro'}</span>
          </div>

          <div class="linha">
            <span>Forma de Pagamento:</span>
            <span>${mov.forma_pagamento || 'Não especificado'}</span>
          </div>

          <div class="linha destaque">
            <span>VALOR:</span>
            <span class="valor">R$ ${formatarValor(Number(mov.valor))}</span>
          </div>

          <div class="linha">
            <span>Tipo:</span>
            <span>${mov.tipo === 'saida' ? 'SAÍDA' : 'ENTRADA'}</span>
          </div>

          <div class="linha">
            <span>Categoria:</span>
            <span>${mov.categoria || 'Geral'}</span>
          </div>
        </div>

        <div class="assinatura">
          <div class="linha-assinatura"></div>
          <div>Assinatura do Responsável</div>
        </div>
      `

      const htmlRecibo = gerarHtmlDocumento(
        `Recibo Movimento - ${mov.categoria || 'Geral'}`,
        conteudoRecibo,
        empresaDefault
      )

      return new Response(htmlRecibo, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      })
    }

    console.log('[API Recibo] Nenhum movimento encontrado para ID:', movimentoId)
    return NextResponse.json({ error: 'Movimento não encontrado' }, { status: 404 })

  } catch (error) {
    console.error('Erro ao gerar recibo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
