import { NextRequest, NextResponse } from 'next/server'
import { gerarComprovantePagamento, type ComprovantePagamentoData } from '../../../../../../lib/comprovante-pagamento-utils'
import { executeQuery } from '@/lib/database'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const pagamentoId = id

    const { searchParams } = new URL(request.url)
    const fornecedorNome = searchParams.get('fornecedor_nome') || 'Fornecedor'
    const fornecedorCnpj = searchParams.get('fornecedor_cnpj') || ''
    const valor = searchParams.get('valor') || '0'
    const formaPagamento = searchParams.get('forma_pagamento') || 'dinheiro'
    const descricao = searchParams.get('descricao') || ''
    const afetaCaixa = searchParams.get('afeta_caixa') === 'true'
    const dataPagamento = searchParams.get('data_pagamento') || new Date().toISOString()

    // Buscar informações do operador responsável quando afeta o caixa
    let operadorInfo = null
    if (afetaCaixa) {
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
          console.log('[COMPROVANTE] Operador encontrado:', operadorInfo.nome)
        }
      } catch (error) {
        console.error('[COMPROVANTE] Erro ao buscar operador:', error)
      }
    }

    // Gerar comprovante usando template padronizado
    const comprovanteData: ComprovantePagamentoData = {
      pagamentoId,
      fornecedorNome,
      fornecedorCnpj,
      valor,
      formaPagamento,
      dataPagamento,
      descricao,
      afetaCaixa,
      operadorInfo: operadorInfo || undefined
    }

    const htmlCompleto = gerarComprovantePagamento(comprovanteData)

    return new NextResponse(htmlCompleto, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

    return new NextResponse(htmlCompleto, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Erro ao gerar comprovante de pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}