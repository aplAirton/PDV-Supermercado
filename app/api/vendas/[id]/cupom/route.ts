import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '../../../../../lib/database'
import { gerarHtmlDocumento, formatarValor, formatarData, empresaDefault } from '../../../../../lib/recibo-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const vendaId = parseInt(id)
    
    if (isNaN(vendaId)) {
      return NextResponse.json({ error: 'ID de venda inválido' }, { status: 400 })
    }

    // Buscar dados da venda com detalhes do cliente e funcionário
    const vendaResults = await executeQuery(`
      SELECT 
        v.*,
        c.nome as cliente_nome,
        c.cpf as cliente_cpf,
        caixa.funcionario_abertura_id,
        f.nome as funcionario_nome,
        f.cargo as funcionario_cargo
      FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN caixas caixa ON v.caixa_id = caixa.id
      LEFT JOIN funcionarios f ON caixa.funcionario_abertura_id = f.id
      WHERE v.id = ?
    `, [vendaId]) as any[]

    if (vendaResults.length === 0) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }

    const venda = vendaResults[0]

    console.log('[CUPOM] Dados de desconto da venda:', {
      id: venda.id,
      desconto_tipo: venda.desconto_tipo,
      desconto_valor: venda.desconto_valor,
      desconto_percentual: venda.desconto_percentual,
      total: venda.total
    })

    // Buscar itens da venda
    const itens = await executeQuery(`
      SELECT 
        iv.*,
        p.nome as produto_nome,
        p.codigo_barras
      FROM itens_venda iv
      JOIN produtos p ON iv.produto_id = p.id
      WHERE iv.venda_id = ?
      ORDER BY iv.id
    `, [vendaId]) as any[]

    // Processar formas de pagamento
    let formasPagamento: Array<{nome: string, valor: number}> = []
    
    // Usar as colunas específicas primeiro
    if (venda.valor_dinheiro > 0) formasPagamento.push({ nome: 'Dinheiro', valor: Number(venda.valor_dinheiro) })
    if (venda.valor_cartao_debito > 0) formasPagamento.push({ nome: 'Cartão Débito', valor: Number(venda.valor_cartao_debito) })
    if (venda.valor_cartao_credito > 0) formasPagamento.push({ nome: 'Cartão Crédito', valor: Number(venda.valor_cartao_credito) })
    if (venda.valor_pix > 0) formasPagamento.push({ nome: 'PIX', valor: Number(venda.valor_pix) })
    if (venda.valor_fiado > 0) formasPagamento.push({ nome: 'Fiado', valor: Number(venda.valor_fiado) })

    // Fallback para JSON se não houver valores nas colunas específicas
    if (formasPagamento.length === 0 && venda.forma_pagamento_json) {
      try {
        const pagamentosJson = JSON.parse(venda.forma_pagamento_json)
        formasPagamento = pagamentosJson.map((p: any) => ({
          nome: p.tipo === 'dinheiro' ? 'Dinheiro' :
                p.tipo === 'cartao_debito' ? 'Cartão Débito' :
                p.tipo === 'cartao_credito' ? 'Cartão Crédito' :
                p.tipo === 'pix' ? 'PIX' :
                p.tipo === 'fiado' ? 'Fiado' : p.tipo,
          valor: Number(p.valor)
        }))
      } catch (e) {
        // Se não conseguir parsear o JSON, assume dinheiro
        formasPagamento = [{ nome: 'Não especificado', valor: Number(venda.total) }]
      }
    }

    // Gerar conteúdo HTML do cupom fiscal
    const conteudo = `
      <div class="documento-titulo">CUPOM FISCAL</div>
      
      <div class="detalhes">
        <div class="linha">
          <span><strong>Venda:</strong></span>
          <span>#${venda.id}</span>
        </div>
        ${venda.cliente_nome ? `
        <div class="linha">
          <span><strong>Cliente:</strong></span>
          <span>${venda.cliente_nome}</span>
        </div>
        ${venda.cliente_cpf ? `
        <div class="linha">
          <span><strong>CPF:</strong></span>
          <span>${venda.cliente_cpf}</span>
        </div>
        ` : ''}
        ` : ''}
        <div class="linha">
          <span><strong>Data:</strong></span>
          <span>${formatarData(venda.data_venda)}</span>
        </div>
        ${venda.funcionario_nome ? `
        <div class="linha">
          <span><strong>Atendente:</strong></span>
          <span>${venda.funcionario_nome}</span>
        </div>
        ` : ''}
        ${venda.caixa_id ? `
        <div class="linha">
          <span><strong>Caixa:</strong></span>
          <span>#${venda.caixa_id}</span>
        </div>
        ` : ''}
      </div>

      <div class="secao">
        <div class="secao-titulo">ITENS DA VENDA</div>
        <div class="tabela-container">
          <table class="tabela-itens">
            <thead>
              <tr>
                <th class="col-produto">Produto</th>
                <th class="col-qtd">Qtd</th>
                <th class="col-valor">Valor Un.</th>
                <th class="col-subtotal">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itens.map((item, index) => `
                <tr class="item-row">
                  <td class="col-produto">
                    <div class="produto-info">
                      <div class="produto-nome">${item.produto_nome}</div>
                      ${item.codigo_barras ? `<div class="produto-codigo">Cód: ${item.codigo_barras}</div>` : ''}
                    </div>
                  </td>
                  <td class="col-qtd">${Number(item.quantidade).toFixed(0)}</td>
                  <td class="col-valor">R$ ${formatarValor(item.preco_unitario)}</td>
                  <td class="col-subtotal">R$ ${formatarValor(item.subtotal)}</td>
                </tr>
                ${index < itens.length - 1 ? '<tr class="separator-row"><td colspan="4"></td></tr>' : ''}
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="itens-total">
          <strong>Total de ${itens.length} item${itens.length !== 1 ? 'ns' : ''}</strong>
        </div>
      </div>

      <div class="secao">
        <div class="secao-titulo">FORMAS DE PAGAMENTO</div>
        <div class="tabela-container">
          <table class="tabela-valores">
            <tbody>
              ${formasPagamento.map(forma => `
                <tr class="forma-pagamento-row">
                  <td class="forma-nome">${forma.nome}:</td>
                  <td class="forma-valor-col">R$ ${formatarValor(forma.valor)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      ${(venda.desconto_tipo && (Number(venda.desconto_valor) > 0 || Number(venda.desconto_percentual) > 0)) ? `
      <div class="secao">
        <div class="secao-titulo">DESCONTO</div>
        <div class="tabela-container">
          <table class="tabela-valores">
            <tbody>
              <tr class="desconto-row">
                <td class="desconto-label">
                  Desconto ${venda.desconto_tipo === 'percent' ? `${Number(venda.desconto_percentual)}%` : 'em R$'}:
                </td>
                <td class="desconto-valor">- R$ ${formatarValor(venda.desconto_valor || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <div class="secao">
        <div class="secao-titulo">TOTAIS</div>
        <div class="tabela-container">
          <table class="tabela-valores">
            <tbody>
              <tr class="total-row">
                <td class="total-label">Valor Pago:</td>
                <td class="total-valor">R$ ${formatarValor(venda.valor_pago || venda.total)}</td>
              </tr>
              ${venda.troco > 0 ? `
              <tr class="total-row">
                <td class="total-label">Troco:</td>
                <td class="total-valor">R$ ${formatarValor(venda.troco)}</td>
              </tr>
              ` : ''}
              <tr class="total-final-row">
                <td class="total-final-label">TOTAL DA VENDA:</td>
                <td class="total-final-valor">R$ ${formatarValor(venda.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="rodape">
        <div class="linha-centralizada">Obrigado pela preferência!</div>
        <div class="linha-centralizada">Volte sempre!</div>
      </div>
    `

    const htmlCompleto = gerarHtmlDocumento(
      'Cupom Fiscal',
      conteudo,
      empresaDefault
    )

    return new NextResponse(htmlCompleto, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Erro ao gerar cupom da venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
