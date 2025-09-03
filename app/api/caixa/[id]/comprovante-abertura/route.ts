import { NextRequest, NextResponse } from 'next/server'
import { gerarHtmlDocumento } from '../../../../../lib/recibo-utils'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const caixaId = id
    
    const { searchParams } = new URL(request.url)
    const funcionario = searchParams.get('funcionario') || ''
    const cargo = searchParams.get('cargo') || ''
    const cpf = searchParams.get('cpf') || ''
    const valorInicial = searchParams.get('valor_inicial') || '0'
    const observacoes = searchParams.get('observacoes') || ''
    const dataAbertura = searchParams.get('data_abertura') || ''

    const formatarValor = (valor: number) => {
      return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    const formatarCpf = (cpf: string) => {
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
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
      <div class="documento-titulo">COMPROVANTE DE ABERTURA</div>
      
      <div class="info-header">
        <div><strong>CAIXA Nº:</strong> ${caixaId}</div>
        <div><strong>DATA/HORA:</strong> ${formatarData(dataAbertura)}</div>
      </div>

      <div class="documento-titulo">DADOS DO OPERADOR</div>
      
      <div class="detalhes">
        <div class="linha">
          <span>Nome:</span>
          <span class="valor">${funcionario}</span>
        </div>
        <div class="linha">
          <span>Cargo:</span>
          <span class="valor">${cargo}</span>
        </div>
        <div class="linha">
          <span>CPF:</span>
          <span class="valor">${formatarCpf(cpf)}</span>
        </div>
      </div>

      <div class="documento-titulo">VALORES INICIAIS</div>
      
      <div class="detalhes">
        <div class="linha destaque">
          <span><strong>Valor Inicial em Caixa:</strong></span>
          <span class="valor"><strong>R$ ${formatarValor(parseFloat(valorInicial))}</strong></span>
        </div>
      </div>

      ${observacoes ? `
      <div class="documento-titulo">OBSERVAÇÕES</div>
      <div class="detalhes">
        <div style="padding: 8px; background: #f9f9f9; border: 1px dashed #ccc; margin: 5px 0; text-align: left;">
          ${observacoes}
        </div>
      </div>
      ` : ''}

      <div class="assinatura">
        <div class="linha-assinatura"></div>
        <div>Assinatura do Operador</div>
      </div>
    `

    const htmlCompleto = gerarHtmlDocumento('Comprovante de Abertura', conteudo, empresaDefault)

    return new NextResponse(htmlCompleto, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Erro ao gerar comprovante de abertura:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
