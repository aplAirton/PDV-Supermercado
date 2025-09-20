import { NextRequest, NextResponse } from 'next/server'
import { gerarHtmlDocumento } from '../../../../../../lib/recibo-utils'
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

    const formatarValor = (valor: number) => {
      return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    const formatarCnpj = (cnpj: string) => {
      return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }

    const formatarData = (dataISO: string) => {
      if (!dataISO) return ''
      const data = new Date(dataISO)
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    // Configurações padrão da empresa (pode vir de configuração)
    const empresaDefault = {
      nome: 'PDV AIRTON',
      endereco: 'Rua das Flores, 123 - Centro',
      cidade: 'Sua Cidade - UF',
      telefone: '(11) 1234-5678',
      cnpj: '12.345.678/0001-90'
    }

    const conteudo = `
      <div class="documento-titulo">COMPROVANTE DE PAGAMENTO</div>

      <div class="info-header">
        <div><strong>PAGAMENTO Nº:</strong> ${pagamentoId}</div>
        <div><strong>DATA/HORA:</strong> ${formatarData(dataPagamento)}</div>
        ${operadorInfo ? `<div><strong>OPERADOR:</strong> ${operadorInfo.nome}</div>` : ''}
      </div>

      <div class="documento-titulo">DADOS DO FORNECEDOR</div>

      <div class="detalhes">
        <div class="linha">
          <span>Nome:</span>
          <span class="valor">${fornecedorNome}</span>
        </div>
        <div class="linha">
          <span>CNPJ:</span>
          <span class="valor">${formatarCnpj(fornecedorCnpj)}</span>
        </div>
      </div>

      <div class="documento-titulo">DETALHES DO PAGAMENTO</div>

      <div class="detalhes">
        <div class="linha">
          <span>Forma de Pagamento:</span>
          <span class="valor">${formaPagamento.toUpperCase()}</span>
        </div>
        ${afetaCaixa ? `
        <div class="linha">
          <span style="color: #dc2626;">Ação no Caixa:</span>
          <span class="valor" style="color: #dc2626;">RETIRADA DE DINHEIRO</span>
        </div>
        ` : ''}
        <div class="linha destaque">
          <span><strong>Valor Pago:</strong></span>
          <span class="valor"><strong>R$ ${formatarValor(parseFloat(valor))}</strong></span>
        </div>
      </div>

      ${descricao ? `
      <div class="documento-titulo">DESCRIÇÃO/MOTIVO</div>
      <div class="detalhes">
        <div style="padding: 8px; background: #f9f9f9; border: 1px dashed #ccc; margin: 5px 0; text-align: left;">
          ${descricao}
        </div>
      </div>
      ` : ''}

    `

    const htmlCompleto = gerarHtmlDocumento('Comprovante de Pagamento', conteudo, empresaDefault)

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