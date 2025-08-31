import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
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

    // Buscar movimento específico do fiado (apenas pagamentos)
    const movimento: any = await prisma.$queryRaw`
      SELECT 
        fm.*,
        c.nome as cliente_nome,
        c.cpf as cliente_cpf,
        c.telefone as cliente_telefone
      FROM fiado_movimentos fm
      JOIN clientes c ON fm.cliente_id = c.id
      WHERE fm.id = ${movimentoId} 
        AND fm.tipo = 'pagamento' 
        AND fm.direcao = 'credito'
    `
    
    if (!movimento || movimento.length === 0) {
      return NextResponse.json({ error: 'Movimento de pagamento não encontrado' }, { status: 404 })
    }

    const movimentoData = movimento[0]
    
    // Preparar dados do cliente
    const clienteInfo: ClienteInfo = {
      nome: movimentoData.cliente_nome,
      cpf: movimentoData.cliente_cpf,
      telefone: movimentoData.cliente_telefone
    }

    // Gerar conteúdo do recibo
    const conteudoRecibo = `
      <div class="documento-titulo">RECIBO DE PAGAMENTO - FIADO</div>

      ${getClienteInfo(clienteInfo)}

      <div class="detalhes">
        <div class="linha">
          <span>Data Pagamento:</span>
          <span>${formatarData(movimentoData.data_movimento)}</span>
        </div>
        
        ${movimentoData.referencia ? `
        <div class="linha">
          <span>Referência:</span>
          <span>${movimentoData.referencia}</span>
        </div>
        ` : ''}
        
        ${movimentoData.fiado_id ? `
        <div class="linha">
          <span>Fiado #:</span>
          <span>${movimentoData.fiado_id}</span>
        </div>
        ` : ''}
        
        <div class="linha">
          <span>Descrição:</span>
          <span>${movimentoData.descricao || 'Pagamento de fiado'}</span>
        </div>
        
        <div class="linha destaque">
          <span>VALOR PAGO:</span>
          <span class="valor">R$ ${formatarValor(Number(movimentoData.valor))}</span>
        </div>
      </div>

      <div class="assinatura">
        <div class="linha-assinatura"></div>
        <div>Assinatura do Cliente</div>
      </div>
    `

    const htmlRecibo = gerarHtmlDocumento(
      'Recibo - Pagamento Fiado',
      conteudoRecibo,
      empresaDefault
    )

    return new Response(htmlRecibo, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('Erro ao gerar recibo de fiado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
