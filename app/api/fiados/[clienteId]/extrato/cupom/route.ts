import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, context: any) {
  try {
    const ctx = await context
    const clienteId = Number(ctx?.params?.clienteId)
    if (Number.isNaN(clienteId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

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

    // Funções utilitárias para formatação
    const pad = (s: string, width: number, align: 'left' | 'right' | 'center' = 'left') => {
      if (align === 'right') return s.padStart(width, ' ')
      if (align === 'center') {
        const spaces = width - s.length
        const left = Math.floor(spaces / 2)
        const right = spaces - left
        return ' '.repeat(Math.max(0, left)) + s + ' '.repeat(Math.max(0, right))
      }
      return s.padEnd(width, ' ')
    }

    const formatMoeda = (valor: number) => valor.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, maximumFractionDigits: 2 
    })

    const formatDataHora = (data: Date) => data.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    // Calcular estatísticas dos movimentos
    let saldo = 0
    let totalCompras = 0
    let totalPagamentos = 0
    let totalMovimentos = movimentos.length
    
    const estatisticas = {
      compras: 0,
      pagamentos: 0,
      valorCompras: 0,
      valorPagamentos: 0,
      ultimaCompra: null as Date | null,
      ultimoPagamento: null as Date | null
    }

    movimentos.forEach(m => {
      const valor = Number(m.valor || 0)
      const dataMovimento = new Date(m.data_movimento)
      
      if (m.direcao === 'debito') {
        saldo += valor
        totalCompras += valor
        estatisticas.compras++
        estatisticas.valorCompras += valor
        if (!estatisticas.ultimaCompra || dataMovimento > estatisticas.ultimaCompra) {
          estatisticas.ultimaCompra = dataMovimento
        }
      } else {
        saldo -= valor
        totalPagamentos += valor
        estatisticas.pagamentos++
        estatisticas.valorPagamentos += valor
        if (!estatisticas.ultimoPagamento || dataMovimento > estatisticas.ultimoPagamento) {
          estatisticas.ultimoPagamento = dataMovimento
        }
      }
    })

    // Gerar texto do cupom aprimorado
    let texto = ''
    const linha = '================================================\n'
    const linhaThin = '------------------------------------------------\n'
    const linhaDupla = '################################################\n'

    // Cabeçalho principal
    texto += linhaDupla
    texto += pad('BUDEGA AIRTON', 48, 'center') + '\n'
    texto += pad('EXTRATO DETALHADO DE FIADO', 48, 'center') + '\n'
    texto += linhaDupla + '\n'

    // Informações do cliente
    texto += 'DADOS DO CLIENTE:\n'
    texto += linhaThin
    texto += `Nome......: ${cliente.nome}\n`
    texto += `CPF.......: ${cliente.cpf}\n`
    texto += `Telefone..: ${cliente.telefone || 'Não informado'}\n`
    texto += `Limite....: R$ ${formatMoeda(Number(cliente.limite_credito || 0))}\n`
    texto += `Deb.Atual.: R$ ${formatMoeda(Number(cliente.debito_atual || 0))}\n`
    
    // Calcular percentual do limite usado
    const limiteCredito = Number(cliente.limite_credito || 0)
    const debitoAtual = Number(cliente.debito_atual || 0)
    const percentualUsado = limiteCredito > 0 ? (debitoAtual / limiteCredito * 100) : 0
    const disponivel = Math.max(0, limiteCredito - debitoAtual)
    
    texto += `Disponível: R$ ${formatMoeda(disponivel)} (${(100 - percentualUsado).toFixed(1)}%)\n`
    texto += `Uso Limite: ${percentualUsado.toFixed(1)}%\n`
    texto += '\n'

    // Resumo estatístico
    texto += 'RESUMO DO PERÍODO:\n'
    texto += linhaThin
    texto += `Total Movimentos....: ${totalMovimentos}\n`
    texto += `Compras (${estatisticas.compras})........: R$ ${formatMoeda(estatisticas.valorCompras)}\n`
    texto += `Pagamentos (${estatisticas.pagamentos}).....: R$ ${formatMoeda(estatisticas.valorPagamentos)}\n`
    texto += `Saldo Movimento.....: R$ ${formatMoeda(totalCompras - totalPagamentos)}\n`
    
    if (estatisticas.ultimaCompra) {
      texto += `Última Compra.......: ${formatDataHora(estatisticas.ultimaCompra)}\n`
    }
    if (estatisticas.ultimoPagamento) {
      texto += `Último Pagamento....: ${formatDataHora(estatisticas.ultimoPagamento)}\n`
    }
    
    texto += `Extrato Gerado em...: ${formatDataHora(new Date())}\n`
    texto += '\n'

    // Cabeçalho da tabela de movimentos
    texto += 'HISTÓRICO DE MOVIMENTOS:\n'
    texto += linhaThin
    texto += pad('DATA/HORA', 14) + pad('TIPO', 8) + pad('VALOR', 13, 'right') + pad('SALDO', 13, 'right') + '\n'
    texto += linhaThin

    // Processar movimentos com saldo recalculado
    saldo = 0
    let mesAnterior = ''
    
    if (movimentos.length === 0) {
      texto += pad('Nenhum movimento encontrado', 48, 'center') + '\n'
    } else {
      movimentos.forEach((m, index) => {
        const valor = Number(m.valor || 0)
        const dataMovimento = new Date(m.data_movimento)
        
        // Separador por mês
        const mesAtual = dataMovimento.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
        if (mesAtual !== mesAnterior && index > 0) {
          texto += '  ' + '.'.repeat(44) + '\n'
        }
        mesAnterior = mesAtual

        // Calcular saldo
        if (m.direcao === 'debito') saldo += valor
        else saldo -= valor

        // Formatação da data
        const dataHora = dataMovimento.toLocaleString('pt-BR', { 
          day: '2-digit', month: '2-digit', 
          hour: '2-digit', minute: '2-digit' 
        })
        
        // Tipo sem emoji
        const tipoMap: Record<string, string> = {
          'lancamento': 'VND',
          'pagamento': 'PAG',
          'ajuste': 'AJU'
        }
        const tipoLabel = tipoMap[m.tipo] || m.tipo.toUpperCase()
        
        // Valor com sinal
        const valorStr = m.direcao === 'debito' ? 
          `+${formatMoeda(valor)}` : `-${formatMoeda(valor)}`
        
        texto += pad(dataHora, 14) + 
                 pad(tipoLabel, 8) + 
                 pad(`R$ ${valorStr}`, 13, 'right') + 
                 pad(`R$ ${formatMoeda(saldo)}`, 13, 'right') + '\n'

        // Descrição detalhada com quebra de linha inteligente
        if (m.descricao) {
          const descricao = m.descricao.toString()
          const linhas = []
          let linha = ''
          const palavras = descricao.split(' ')
          
          palavras.forEach((palavra: string) => {
            if ((linha + ' ' + palavra).length <= 42) {
              linha += (linha ? ' ' : '') + palavra
            } else {
              if (linha) linhas.push(linha)
              linha = palavra
            }
          })
          if (linha) linhas.push(linha)
          
          linhas.forEach(l => {
            texto += pad(`  ${l}`, 48) + '\n'
          })
        }

        // Referência se existir
        if (m.referencia) {
          texto += pad(`  Ref: ${m.referencia}`, 48) + '\n'
        }
      })
    }

    // Totalizadores finais
    texto += linhaThin
    texto += linha
    texto += pad('SALDO DEVEDOR ATUAL:', 28, 'left') + 
             pad(`R$ ${formatMoeda(saldo)}`, 20, 'right') + '\n'
    
    // Status do saldo
    if (saldo > 0) {
      texto += pad('CLIENTE EM DÉBITO', 48, 'center') + '\n'
    } else if (saldo === 0) {
      texto += pad('CLIENTE QUITE', 48, 'center') + '\n'
    } else {
      texto += pad('CLIENTE COM CRÉDITO', 48, 'center') + '\n'
    }
    
    texto += linha + '\n'

    // Rodapé aprimorado
    texto += pad('BUDEGA AIRTON', 48, 'center') + '\n'
    texto += pad('Este extrato possui validade de 30 dias', 48, 'center') + '\n'
    texto += pad('e serve para controle interno', 48, 'center') + '\n'
    texto += pad('Em caso de dúvidas, entre em contato', 48, 'center') + '\n'
    texto += linhaDupla
    
    // Código de barras simulado (estético)
    texto += pad('||||| |||| || ||||| || |||||', 48, 'center') + '\n'
    texto += pad(`ID: ${cliente.id.toString().padStart(6, '0')} - ${new Date().getTime().toString().slice(-6)}`, 48, 'center') + '\n'
    texto += linhaDupla

    return NextResponse.json({ 
      cupom: texto,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
        telefone: cliente.telefone,
        debito_atual: Number(cliente.debito_atual || 0),
        limite_credito: Number(cliente.limite_credito || 0),
        credito_disponivel: disponivel,
        percentual_limite_usado: Number(percentualUsado.toFixed(1))
      },
      estatisticas: {
        saldo_final: Number(saldo.toFixed(2)),
        total_movimentos: movimentos.length,
        total_compras: estatisticas.compras,
        total_pagamentos: estatisticas.pagamentos,
        valor_total_compras: Number(estatisticas.valorCompras.toFixed(2)),
        valor_total_pagamentos: Number(estatisticas.valorPagamentos.toFixed(2)),
        saldo_movimento: Number((totalCompras - totalPagamentos).toFixed(2)),
        ultima_compra: estatisticas.ultimaCompra?.toISOString(),
        ultimo_pagamento: estatisticas.ultimoPagamento?.toISOString(),
        status_saldo: saldo > 0 ? 'devedor' : saldo === 0 ? 'quite' : 'credito'
      },
      metadata: {
        gerado_em: new Date().toISOString(),
        largura_cupom: 48,
        formato_moeda: 'pt-BR',
        validade_extrato_dias: 30
      }
    })

  } catch (error) {
    console.error('Erro ao gerar cupom de extrato:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
