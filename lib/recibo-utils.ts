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
  nome: 'PDV Airton',
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
  
  .movimentacoes-section {
    margin-bottom: 15px;
  }
  
  .movimentacoes-titulo {
    font-weight: bold;
    text-align: center;
    margin-bottom: 8px;
    padding: 5px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    font-size: 11px;
  }
  
  .movimentacao-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    border-bottom: 1px dotted #ccc;
    font-size: 10px;
  }
  
  .movimentacao-item:last-child {
    border-bottom: none;
  }
  
  .movimentacao-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .movimentacao-horario {
    font-size: 9px;
    color: #666;
  }
  
  .movimentacao-desc {
    font-size: 10px;
  }
  
  .movimentacao-valor {
    font-weight: bold;
    font-size: 10px;
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
  
  /* Estilos para tabelas de itens */
  .tabela-itens {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 10px;
  }
  
  .tabela-itens th {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    padding: 6px;
    font-weight: bold;
    font-size: 10px;
    text-align: left;
  }
  
  .tabela-itens td {
    border: 1px solid #eee;
    padding: 6px;
    font-size: 10px;
    vertical-align: top;
  }
  
  .col-produto {
    width: 45%;
    text-align: left;
  }
  
  .col-qtd {
    width: 12%;
    text-align: center;
  }
  
  .col-valor {
    width: 20%;
    text-align: right;
  }
  
  .col-subtotal {
    width: 23%;
    text-align: right;
    font-weight: bold;
  }
  
  .produto-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .produto-nome {
    font-weight: bold;
    font-size: 10px;
    line-height: 1.2;
  }
  
  .produto-codigo {
    font-size: 8px;
    color: #666;
    font-style: italic;
  }
  
  .item-row {
    border-bottom: 1px solid #ddd;
  }
  
  .separator-row {
    height: 5px;
  }
  
  .separator-row td {
    border: none;
    border-bottom: 1px dotted #ccc;
  }
  
  .itens-total {
    text-align: right;
    margin-top: 8px;
    padding: 5px;
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    font-size: 10px;
  }
  
  /* Estilos para tabelas de valores e formas de pagamento */
  .tabela-valores {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 11px;
  }
  
  .tabela-valores td {
    padding: 6px;
    border-bottom: 1px dotted #ccc;
  }
  
  .forma-pagamento-row td {
    font-weight: bold;
  }
  
  .forma-nome {
    text-align: left;
    width: 60%;
  }
  
  .forma-valor-col {
    text-align: right;
    width: 40%;
  }
  
  .total-row td {
    font-weight: bold;
    padding: 4px 6px;
  }
  
  .total-label {
    text-align: left;
    width: 60%;
  }
  
  .total-valor {
    text-align: right;
    width: 40%;
  }
  
  .total-final-row {
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
  }
  
  .desconto-row {
    background-color: #fff8dc;
    border: 1px solid #ddd;
  }
  
  .desconto-row td {
    padding: 6px;
    font-weight: bold;
    color: #d9534f;
  }
  
  .desconto-label {
    text-align: left;
    width: 60%;
  }
  
  .desconto-valor {
    text-align: right;
    width: 40%;
  }
  
  .total-final-row td {
    font-weight: bold;
    font-size: 12px;
    padding: 8px 6px;
    background-color: #f5f5f5;
  }
  
  .total-final-label {
    text-align: left;
    width: 60%;
  }
  
  .total-final-valor {
    text-align: right;
    width: 40%;
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
