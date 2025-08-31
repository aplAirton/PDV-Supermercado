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

export async function GET(request: NextRequest, context: any) {
  try {
    const { params } = await context
    const resolvedParams = await params
    const movimentoId = Number(resolvedParams?.movimentoId)
    
    if (Number.isNaN(movimentoId)) {
      return NextResponse.json({ error: 'ID de movimento inválido' }, { status: 400 })
    }

    // Buscar detalhes do movimento específico
    const movimentoQuery = `
      SELECT 
        id,
        tipo,
        categoria,
        valor,
        descricao,
        referencia,
        forma_pagamento,
        forma_pagamento_json,
        data_movimento,
        cliente_nome,
        cliente_id
      FROM (
        -- Vendas
        SELECT 
          v.id,
          'entrada' as tipo,
          CASE 
            WHEN v.forma_pagamento_json IS NOT NULL THEN 'venda_multiplas'
            WHEN v.forma_pagamento = 'dinheiro' THEN 'venda_dinheiro'
            WHEN v.forma_pagamento IN ('cartao_debito', 'cartao_credito') THEN 'venda_cartao'
            WHEN v.forma_pagamento = 'pix' THEN 'venda_pix'
            ELSE 'outros'
          END as categoria,
          v.total as valor,
          CONCAT('Venda #', v.id) as descricao,
          CONCAT('Venda #', v.id) as referencia,
          CASE 
            WHEN v.forma_pagamento_json IS NOT NULL THEN 'Múltiplas'
            WHEN v.forma_pagamento = 'dinheiro' THEN 'Dinheiro'
            WHEN v.forma_pagamento = 'cartao_debito' THEN 'Débito'
            WHEN v.forma_pagamento = 'cartao_credito' THEN 'Crédito'
            WHEN v.forma_pagamento = 'pix' THEN 'PIX'
            ELSE v.forma_pagamento
          END as forma_pagamento,
          v.forma_pagamento_json,
          v.data_venda as data_movimento,
          c.nome as cliente_nome,
          v.cliente_id
        FROM vendas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        
        UNION ALL
        
        -- Pagamentos de fiado
        SELECT 
          fm.id,
          'entrada' as tipo,
          'pagamento_fiado' as categoria,
          fm.valor,
          COALESCE(fm.descricao, CONCAT('Pagamento Fiado #', fm.fiado_id)) as descricao,
          fm.referencia,
          CASE 
            WHEN fm.referencia LIKE '%dinheiro%' THEN 'Dinheiro'
            WHEN fm.referencia LIKE '%cartao%' OR fm.referencia LIKE '%débito%' THEN 'Débito'  
            WHEN fm.referencia LIKE '%crédito%' THEN 'Crédito'
            WHEN fm.referencia LIKE '%pix%' THEN 'PIX'
            ELSE 'Não especificado'
          END as forma_pagamento,
          NULL as forma_pagamento_json,
          fm.data_movimento,
          c.nome as cliente_nome,
          fm.cliente_id
        FROM fiado_movimentos fm
        JOIN clientes c ON fm.cliente_id = c.id
        WHERE fm.tipo = 'pagamento' AND fm.direcao = 'credito'
      ) AS todos_movimentos
      WHERE id = ?
    `

    const movimentos = await executeQuery(movimentoQuery, [movimentoId]) as any[]
    
    if (movimentos.length === 0) {
      return NextResponse.json({ error: 'Movimento não encontrado' }, { status: 404 })
    }

    const movimento = movimentos[0]
    
    // Helper para processar formas de pagamento
    const getFormasPagamentoDetalhadas = () => {
      if (!movimento.forma_pagamento_json) {
        return movimento.forma_pagamento
      }
      
      try {
        const pagamentosJson = JSON.parse(movimento.forma_pagamento_json)
        if (Array.isArray(pagamentosJson)) {
          return pagamentosJson.map((p: any) => {
            const tipo = (p.tipo || p.tipo_pagamento || '').toLowerCase()
            const valor = Number(p.valor || 0)
            
            let tipoFormatado = ''
            switch (tipo) {
              case 'dinheiro': tipoFormatado = 'Dinheiro'; break
              case 'cartao_debito': tipoFormatado = 'Cartão Débito'; break
              case 'cartao_credito': tipoFormatado = 'Cartão Crédito'; break
              case 'pix': tipoFormatado = 'PIX'; break
              case 'fiado': tipoFormatado = 'Fiado'; break
              default: tipoFormatado = tipo.charAt(0).toUpperCase() + tipo.slice(1); break
            }
            
            return `<div class="forma-pagamento-item">
              <span class="forma-tipo">${tipoFormatado}:</span>
              <span class="forma-valor">R$ ${valor.toFixed(2)}</span>
            </div>`
          }).join('')
        }
      } catch (error) {
        console.error('Erro ao processar forma_pagamento_json:', error)
      }
      
      return movimento.forma_pagamento
    }
    
    // Preparar dados do cliente se existir
    const clienteInfo: ClienteInfo | null = movimento.cliente_nome ? {
      nome: movimento.cliente_nome,
      cpf: movimento.cliente_cpf,
      telefone: movimento.cliente_telefone
    } : null

    // Gerar conteúdo do recibo
    const conteudoRecibo = `
      <div class="documento-titulo">RECIBO DE PAGAMENTO</div>

      ${clienteInfo ? getClienteInfo(clienteInfo) : ''}

      <div class="detalhes">
        <div class="linha">
          <span>Data:</span>
          <span>${formatarData(movimento.data_movimento)}</span>
        </div>
        
        <div class="linha">
          <span>Referência:</span>
          <span>${movimento.referencia || movimento.descricao}</span>
        </div>
        
        ${movimento.forma_pagamento_json ? `
        <div class="formas-pagamento-section">
          <div class="formas-titulo">Formas de Pagamento:</div>
          <div class="formas-lista">
            ${getFormasPagamentoDetalhadas()}
          </div>
        </div>
        ` : `
        <div class="linha">
          <span>Forma de Pagamento:</span>
          <span>${getFormasPagamentoDetalhadas()}</span>
        </div>
        `}
        
        <div class="linha destaque">
          <span>VALOR RECEBIDO:</span>
          <span class="valor">R$ ${formatarValor(Number(movimento.valor))}</span>
        </div>
      </div>

      <div class="assinatura">
        <div class="linha-assinatura"></div>
        <div>Assinatura do Responsável</div>
      </div>
    `

    const htmlRecibo = gerarHtmlDocumento(
      `Recibo - ${movimento.referencia}`,
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
