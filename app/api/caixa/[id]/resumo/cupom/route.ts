import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '../../../../../../lib/database'
import { gerarHtmlDocumento, formatarValor, formatarData, empresaDefault } from '../../../../../../lib/recibo-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const caixaId = parseInt(id)
    
    if (isNaN(caixaId)) {
      return NextResponse.json({ error: 'ID de caixa inválido' }, { status: 400 })
    }

    // Buscar dados do caixa
    const caixaResults = await executeQuery(`
      SELECT 
        c.*,
        f.nome as funcionario_nome,
        f.cargo as funcionario_cargo
      FROM caixas c
      INNER JOIN funcionarios f ON c.funcionario_id = f.id
      WHERE c.id = ?
    `, [caixaId]) as any[]
    
    const caixaData = caixaResults[0]

    if (!caixaData) {
      return NextResponse.json({ error: 'Caixa não encontrado' }, { status: 404 })
    }

    // Buscar vendas do caixa com detalhamento de formas de pagamento
    const vendas = await executeQuery(`
      SELECT 
        v.id,
        v.total,
        v.data_venda,
        v.valor_dinheiro,
        v.valor_cartao_debito,
        v.valor_cartao_credito,
        v.valor_pix,
        v.valor_fiado,
        c.nome as cliente_nome
      FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.caixa_id = ?
      ORDER BY v.data_venda
    `, [caixaId]) as any[]

    // Verificar se a coluna `data_criacao` existe na tabela para montar consulta segura
    const colCheck = await executeQuery(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'caixa_movimentacoes' AND COLUMN_NAME = 'data_criacao'`,
      []
    ) as any[]

    const hasDataCriacao = (colCheck && colCheck.length > 0)

    // Buscar movimentações do caixa (ordena por data_criacao se disponível, caso contrário por id)
    const movQuery = `
      SELECT 
        id,
        tipo,
        valor,
        descricao${hasDataCriacao ? ', data_criacao' : ''}
      FROM caixa_movimentacoes
      WHERE caixa_id = ?
      ORDER BY ${hasDataCriacao ? 'data_criacao' : 'id'}
    `

    const movimentacoes = await executeQuery(movQuery, [caixaId]) as any[]

    // Calcular totais usando os dados já calculados da tabela caixas
    const totalVendas = Number(caixaData.total_vendas || 0)
    const totalSuprimentos = Number(caixaData.total_suprimentos || 0)
    const totalSangrias = Number(caixaData.total_sangrias || 0)

    // Calcular totais por forma de pagamento usando os dados da tabela caixas
    const totaisPorForma = {
      dinheiro: Number(caixaData.total_dinheiro || 0),
      cartao_debito: Number(caixaData.total_cartao_debito || 0),
      cartao_credito: Number(caixaData.total_cartao_credito || 0),
      pix: Number(caixaData.total_pix || 0),
      fiado: Number(caixaData.total_fiado || 0)
    }

    const valorEsperado = Number(caixaData.valor_inicial) + totalVendas + totalSuprimentos - totalSangrias
    const valorContado = Number(caixaData.valor_contado_dinheiro || caixaData.valor_final || 0)
    const diferenca = valorContado - valorEsperado

    const statusReconciliacao = diferenca === 0 ? 'PERFEITO' : 
                              diferenca > 0 ? 'SOBRA' : 'FALTA'

    // Gerar conteúdo HTML do resumo
    const conteudo = `
      <div class="documento-titulo">RESUMO DE FECHAMENTO DE CAIXA</div>
      
      <div class="detalhes">
        <div class="linha">
          <span><strong>Caixa ID:</strong></span>
          <span>#${caixaData.id}</span>
        </div>
        <div class="linha">
          <span><strong>Operador:</strong></span>
          <span>${caixaData.funcionario_nome}</span>
        </div>
        <div class="linha">
          <span><strong>Cargo:</strong></span>
          <span>${caixaData.funcionario_cargo}</span>
        </div>
        <div class="linha">
          <span><strong>Abertura:</strong></span>
          <span>${formatarData(caixaData.data_abertura)}</span>
        </div>
        ${caixaData.data_fechamento ? `
        <div class="linha">
          <span><strong>Fechamento:</strong></span>
          <span>${formatarData(caixaData.data_fechamento)}</span>
        </div>
        ` : ''}
      </div>

      <div class="documento-titulo">MOVIMENTAÇÃO FINANCEIRA</div>
      
      <div class="detalhes">
        <div class="linha">
          <span>Valor Inicial:</span>
          <span class="valor">R$ ${formatarValor(Number(caixaData.valor_inicial))}</span>
        </div>
        <div class="linha">
          <span>Total de Vendas:</span>
          <span class="valor">R$ ${formatarValor(totalVendas)}</span>
        </div>
        ${totalSuprimentos > 0 ? `
        <div class="linha">
          <span>Suprimentos:</span>
          <span class="valor">+ R$ ${formatarValor(totalSuprimentos)}</span>
        </div>
        ` : ''}
        ${totalSangrias > 0 ? `
        <div class="linha">
          <span>Sangrias:</span>
          <span class="valor">- R$ ${formatarValor(totalSangrias)}</span>
        </div>
        ` : ''}
        <div class="linha destaque">
          <span>Valor Esperado:</span>
          <span class="valor">R$ ${formatarValor(valorEsperado)}</span>
        </div>
        ${caixaData.data_fechamento ? `
        <div class="linha">
          <span>Valor Contado:</span>
          <span class="valor">R$ ${formatarValor(valorContado)}</span>
        </div>
        <div class="linha destaque" style="color: ${diferenca === 0 ? '#2e7d32' : diferenca > 0 ? '#1976d2' : '#d32f2f'}">
          <span>${statusReconciliacao}:</span>
          <span class="valor">R$ ${formatarValor(Math.abs(diferenca))}</span>
        </div>
        ` : ''}
      </div>

      <div class="formas-pagamento-section">
        <div class="formas-titulo">FORMAS DE PAGAMENTO</div>
        <div class="formas-lista">
          <div class="forma-pagamento-item">
            <span class="forma-tipo">Dinheiro:</span>
            <span class="forma-valor">R$ ${formatarValor(totaisPorForma.dinheiro)}</span>
          </div>
          <div class="forma-pagamento-item">
            <span class="forma-tipo">Cartão Débito:</span>
            <span class="forma-valor">R$ ${formatarValor(totaisPorForma.cartao_debito)}</span>
          </div>
          <div class="forma-pagamento-item">
            <span class="forma-tipo">Cartão Crédito:</span>
            <span class="forma-valor">R$ ${formatarValor(totaisPorForma.cartao_credito)}</span>
          </div>
          <div class="forma-pagamento-item">
            <span class="forma-tipo">PIX:</span>
            <span class="forma-valor">R$ ${formatarValor(totaisPorForma.pix)}</span>
          </div>
          <div class="forma-pagamento-item">
            <span class="forma-tipo">Fiado:</span>
            <span class="forma-valor">R$ ${formatarValor(totaisPorForma.fiado)}</span>
          </div>
        </div>
      </div>

      <div class="documento-titulo">RESUMO DE VENDAS</div>
      
      <div class="detalhes">
        <div class="linha">
          <span>Total de Transações:</span>
          <span class="valor">${vendas.length}</span>
        </div>
        <div class="linha">
          <span>Valor Total Vendido:</span>
          <span class="valor">R$ ${formatarValor(totalVendas)}</span>
        </div>
        <div class="linha">
          <span>Ticket Médio:</span>
          <span class="valor">R$ ${formatarValor(vendas.length > 0 ? totalVendas / vendas.length : 0)}</span>
        </div>
      </div>

      ${movimentacoes.length > 0 ? `
      <div class="documento-titulo">MOVIMENTAÇÕES</div>
      
      <div class="movimentos-lista">
        ${movimentacoes.map((mov: any) => `
          <div class="movimento-item">
            <div class="movimento-data">${mov.data_criacao ? new Date(mov.data_criacao).toLocaleString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : ''}</div>
            <div class="movimento-desc">${mov.descricao}</div>
            <div class="movimento-valor ${mov.tipo === 'suprimento' ? 'movimento-credito' : 'movimento-debito'}">
              ${mov.tipo === 'suprimento' ? '+' : '-'} R$ ${formatarValor(Number(mov.valor))}
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${caixaData.observacoes_abertura ? `
      <div class="detalhes">
        <div class="linha destaque">
          <span><strong>Obs. Abertura:</strong></span>
        </div>
        <div style="padding: 8px; background: #f9f9f9; border: 1px dashed #ccc; margin: 5px 0;">
          ${caixaData.observacoes_abertura}
        </div>
      </div>
      ` : ''}

      ${caixaData.observacoes_fechamento ? `
      <div class="detalhes">
        <div class="linha destaque">
          <span><strong>Obs. Fechamento:</strong></span>
        </div>
        <div style="padding: 8px; background: #f9f9f9; border: 1px dashed #ccc; margin: 5px 0;">
          ${caixaData.observacoes_fechamento}
        </div>
      </div>
      ` : ''}

      <div class="assinatura">
        <div class="linha-assinatura"></div>
        <div>Assinatura do Responsável</div>
      </div>
    `

    const htmlCompleto = gerarHtmlDocumento('Resumo de Caixa', conteudo, empresaDefault)

    return new NextResponse(htmlCompleto, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('Erro ao gerar cupom de resumo de caixa:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
