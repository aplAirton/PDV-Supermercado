import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
import { gerarComprovantePagamento, type ComprovantePagamentoData } from '@/lib/comprovante-pagamento-utils'

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

    // Buscar informações do operador responsável quando afeta o caixa
    let operadorInfo = null
    if (dados.afeta_caixa) {
      try {
        const operadorQuery = `
          SELECT 
            f.nome,
            f.cpf,
            c.id as caixa_id
          FROM caixas c
          JOIN funcionarios f ON c.funcionario_abertura_id = f.id
          WHERE c.status = 'aberto'
          ORDER BY c.data_abertura DESC
          LIMIT 1
        `
        const operadorResult = await executeQuery(operadorQuery) as any[]
        
        if (operadorResult.length > 0) {
          operadorInfo = {
            nome: operadorResult[0].nome,
            cpf: operadorResult[0].cpf,
            caixaId: operadorResult[0].caixa_id
          }
          console.log('[COMPROVANTE MOVIMENTO] Operador encontrado:', operadorInfo.nome)
        }
      } catch (error) {
        console.error('[COMPROVANTE MOVIMENTO] Erro ao buscar operador:', error)
      }
    }

    // Gerar comprovante usando template padronizado
    const comprovanteData: ComprovantePagamentoData = {
      pagamentoId: dados.pagamento_id,
      fornecedorNome: dados.fornecedor_nome,
      fornecedorCnpj: dados.fornecedor_cpf_cnpj || '',
      valor: dados.valor.toString(),
      formaPagamento: dados.forma_pagamento,
      dataPagamento: dados.data_pagamento,
      descricao: dados.observacoes,
      afetaCaixa: dados.afeta_caixa,
      operadorInfo: operadorInfo || undefined
    }

    const htmlCompleto = gerarComprovantePagamento(comprovanteData)

    return new NextResponse(htmlCompleto, {
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