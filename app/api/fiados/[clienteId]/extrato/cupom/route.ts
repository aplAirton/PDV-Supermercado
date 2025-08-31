import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { 
  gerarHtmlDocumento, 
  empresaDefault, 
  getClienteInfo, 
  formatarValor, 
  formatarData,
  formatarDataCurta,
  type ClienteInfo 
} from '@/lib/recibo-utils'

export async function GET(request: NextRequest, context: any) {
  try {
    const { params } = await context
    const resolvedParams = await params
    const clienteId = Number(resolvedParams?.clienteId)
    
    if (Number.isNaN(clienteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Buscar dados do cliente
    const cliente = await prisma.clientes.findUnique({
      where: { id: clienteId }
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Buscar movimentos ordenados
    const movimentos: any[] = await prisma.$queryRaw`
      SELECT *
      FROM fiado_movimentos
      WHERE cliente_id = ${clienteId}
      ORDER BY data_movimento ASC, id ASC
    `

    // Calcular estatísticas
    let saldo = 0
    let totalCompras = 0
    let totalPagamentos = 0
    
    const movimentosProcessados = movimentos.map(mov => {
      if (mov.direcao === 'debito') {
        saldo += Number(mov.valor)
        if (mov.tipo === 'lancamento') totalCompras += Number(mov.valor)
      } else {
        saldo -= Number(mov.valor)
        if (mov.tipo === 'pagamento') totalPagamentos += Number(mov.valor)
      }
      
      return {
        ...mov,
        saldo_corrente: saldo,
        valor_num: Number(mov.valor)
      }
    })

    // Preparar dados do cliente
    const clienteInfo: ClienteInfo = {
      nome: cliente.nome,
      cpf: cliente.cpf || undefined,
      telefone: cliente.telefone || undefined
    }

    // Gerar lista de movimentos
    const movimentosHtml = movimentosProcessados.length === 0 ? `
      <div style="text-align: center; padding: 20px; color: #666;">
        Nenhum movimento encontrado
      </div>
    ` : `
      <div class="movimentos-lista">
        <div class="movimento-item" style="font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
          <div class="movimento-data">Data</div>
          <div class="movimento-desc">Descrição</div>
          <div class="movimento-valor">Valor</div>
          <div class="movimento-saldo">Saldo</div>
        </div>
        ${movimentosProcessados.map(mov => `
          <div class="movimento-item">
            <div class="movimento-data">${formatarDataCurta(mov.data_movimento)}</div>
            <div class="movimento-desc">
              ${mov.tipo === 'lancamento' ? 'Venda Fiado' : 
                mov.tipo === 'pagamento' ? 'Pagamento' : 
                mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
              ${mov.referencia ? `<br><small>${mov.referencia.includes('venda') || mov.referencia.includes('Venda') 
                ? `Venda ${mov.referencia.replace(/[^0-9#]/g, '')}` 
                : mov.referencia}</small>` : ''}
            </div>
            <div class="movimento-valor ${mov.direcao === 'debito' ? 'movimento-debito' : 'movimento-credito'}">
              ${mov.direcao === 'debito' ? '+' : '-'}${formatarValor(mov.valor_num)}
            </div>
            <div class="movimento-saldo">R$ ${formatarValor(mov.saldo_corrente)}</div>
          </div>
        `).join('')}
      </div>
    `

    // Gerar resumo final
    const resumoHtml = `
      <div class="resumo-final">
        <div class="linha">
          <span>Total em Compras:</span>
          <span class="valor movimento-debito">R$ ${formatarValor(totalCompras)}</span>
        </div>
        <div class="linha">
          <span>Total Pagamentos:</span>
          <span class="valor movimento-credito">R$ ${formatarValor(totalPagamentos)}</span>
        </div>
        <div class="linha destaque">
          <span>SALDO ATUAL:</span>
          <span class="valor ${saldo >= 0 ? 'movimento-debito' : 'movimento-credito'}">
            R$ ${formatarValor(Math.abs(saldo))}
            ${saldo >= 0 ? ' (DEVEDOR)' : ' (CREDOR)'}
          </span>
        </div>
        <div class="linha">
          <span>Limite de Crédito:</span>
          <span class="valor">R$ ${formatarValor(Number(cliente.limite_credito) || 0)}</span>
        </div>
        <div class="linha">
          <span>Crédito Disponível:</span>
          <span class="valor ${(Number(cliente.limite_credito) || 0) - saldo >= 0 ? 'movimento-credito' : 'movimento-debito'}">
            R$ ${formatarValor(Math.max(0, (Number(cliente.limite_credito) || 0) - saldo))}
          </span>
        </div>
      </div>
    `

    // Gerar conteúdo completo do extrato
    const conteudoExtrato = `
      <div class="documento-titulo">EXTRATO DE CONTA FIADO</div>

      ${getClienteInfo(clienteInfo)}

      <div class="detalhes">
        <div class="linha">
          <span>Período:</span>
          <span>Completo</span>
        </div>
        <div class="linha">
          <span>Data da consulta:</span>
          <span>${formatarData(new Date())}</span>
        </div>
      </div>

      ${movimentosHtml}

      ${resumoHtml}

      <div class="assinatura">
        <div class="linha-assinatura"></div>
        <div>Assinatura do Cliente</div>
      </div>
    `

    const htmlExtrato = gerarHtmlDocumento(
      `Extrato de Fiado - ${cliente.nome}`,
      conteudoExtrato,
      empresaDefault
    )

    return new Response(htmlExtrato, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('Erro ao gerar extrato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
