// Utilitários para gerar HTML de recibos e extratos
export interface EmpresaInfo {
  nome: string
  endereco: string
  telefone: string
  cnpj: string
}

export interface ClienteInfo {
  nome: string
  cpf?: string
  telefone?: string
}

export const empresaDefault: EmpresaInfo = {
  nome: 'Supermercado PDV Airton',
  endereco: 'Rua Principal, 123 - Centro',
  telefone: '(11) 9999-9999',
  cnpj: '12.345.678/0001-90'
}

// Estilos base para impressão
export const getEstilosBase = () => `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.0;
    color: #000;
    background: #fff;
    padding: 15px;
    max-width: 300px;
    margin: 0 auto;
    min-height: 100vh;
  }
  
  @media print {
    body {
      padding: 10px;
      max-width: 300px;
      margin: 0 auto;
    }
    
    .movimentos-lista {
      page-break-inside: avoid;
    }
    
    .movimento-item {
      page-break-inside: avoid;
    }
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
  
  .documento-titulo {
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
  
  .movimentos-lista {
    margin-bottom: 15px;
  }
  
  .movimento-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    border-bottom: 1px dotted #ccc;
    font-size: 11px;
  }
  
  .movimento-item:last-child {
    border-bottom: none;
  }
  
  .movimento-data {
    width: 25%;
    font-size: 11px;
  }
  
  .movimento-desc {
    width: 30%;
    font-size: 11px;
  }
  
  .movimento-valor {
    width: 15%;
    text-align: right;
    font-weight: bold;
  }
  
  .movimento-saldo {
    width: 23%;
    text-align: right;
    font-size: 11px;
  }
  
  .movimento-debito {
    color: #d32f2f;
  }
  
  .movimento-credito {
    color: #2e7d32;
  }
  
  .resumo-final {
    border-top: 2px solid #000;
    padding-top: 10px;
    margin-top: 15px;
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
  
  .formas-pagamento-section {
    margin: 10px 0;
    padding: 8px;
    background-color: #f9f9f9;
    border: 1px solid #ddd;
  }
  
  .formas-titulo {
    font-weight: bold;
    margin-bottom: 8px;
    text-align: center;
    border-bottom: 1px dotted #ccc;
    padding-bottom: 4px;
  }
  
  .formas-lista {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .forma-pagamento-item {
    display: flex;
    justify-content: space-between;
    padding: 3px 5px;
    background-color: #fff;
    border: 1px solid #eee;
  }
  
  .forma-tipo {
    font-weight: bold;
  }
  
  .forma-valor {
    text-align: right;
    font-weight: bold;
  }
  
  @media print {
    body {
      padding: 10px;
    }
    .no-print {
      display: none;
    }
  }
`

// Cabeçalho padrão
export const getCabecalho = (empresa: EmpresaInfo) => `
  <div class="cabecalho">
    <div class="empresa-nome">${empresa.nome}</div>
    <div class="empresa-info">${empresa.endereco}</div>
    <div class="empresa-info">Tel: ${empresa.telefone}</div>
    <div class="empresa-info">CNPJ: ${empresa.cnpj}</div>
  </div>
`

// Info do cliente
export const getClienteInfo = (cliente: ClienteInfo) => `
  <div class="cliente-info">
    <div class="linha">
      <span><strong>Cliente:</strong></span>
      <span>${cliente.nome}</span>
    </div>
    ${cliente.cpf ? `
    <div class="linha">
      <span><strong>CPF:</strong></span>
      <span>${cliente.cpf}</span>
    </div>
    ` : ''}
    ${cliente.telefone ? `
    <div class="linha">
      <span><strong>Telefone:</strong></span>
      <span>${cliente.telefone}</span>
    </div>
    ` : ''}
  </div>
`

// Rodapé padrão
export const getRodape = (tipoDocumento: string) => `
  <div class="rodape">
    <div>Documento gerado em ${new Date().toLocaleString('pt-BR')}</div>
    <div>Sistema PDV - ${tipoDocumento}</div>
  </div>
`

// Script de auto-impressão
export const getScriptImpressao = () => `
  <script>
    window.onload = function() {
      window.print();
    }
  </script>
`

// Função para gerar HTML completo
export const gerarHtmlDocumento = (
  titulo: string,
  conteudo: string,
  empresa: EmpresaInfo = empresaDefault
) => `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${titulo}</title>
      <style>
        ${getEstilosBase()}
      </style>
  </head>
  <body>
      ${getCabecalho(empresa)}
      ${conteudo}
      ${getRodape(titulo.includes('Recibo') ? 'Controle de Pagamentos' : 'Controle de Fiados')}
      ${getScriptImpressao()}
  </body>
  </html>
`

// Formatadores de valor
export const formatarValor = (valor: number): string => {
  return Number(valor).toFixed(2).replace('.', ',')
}

export const formatarData = (data: string | Date): string => {
  return new Date(data).toLocaleString('pt-BR')
}

export const formatarDataCurta = (data: string | Date): string => {
  return new Date(data).toLocaleDateString('pt-BR')
}
