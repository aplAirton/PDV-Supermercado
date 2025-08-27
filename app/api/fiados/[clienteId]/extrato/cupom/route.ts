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

    // Função para formatar texto com padding
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

    // Calcular saldo corrente e gerar texto do cupom
    let saldo = 0
    let texto = ''
    const linha = '========================================\n'
    const linhaThin = '----------------------------------------\n'

    // Cabeçalho
    texto += linha
    texto += pad('BUDEGA AIRTON', 40, 'center') + '\n'
    texto += pad('EXTRATO DE FIADO', 40, 'center') + '\n'
    texto += linha + '\n'

    texto += `CLIENTE: ${cliente.nome}\n`
    texto += `CPF: ${cliente.cpf}\n`
    texto += `TELEFONE: ${cliente.telefone || 'Não informado'}\n`
    texto += `LIMITE: R$ ${Number(cliente.limite_credito || 0).toFixed(2)}\n`
    texto += `DÉBITO ATUAL: R$ ${Number(cliente.debito_atual || 0).toFixed(2)}\n`
    texto += `DATA: ${new Date().toLocaleString('pt-BR')}\n`
    texto += '\n' + linhaThin

    // Cabeçalho da tabela
    texto += pad('DATA', 12) + pad('TIPO', 10) + pad('VALOR', 12, 'right') + pad('SALDO', 12, 'right') + '\n'
    texto += linhaThin

    // Processar movimentos
    if (movimentos.length === 0) {
      texto += pad('Nenhum movimento encontrado', 46, 'center') + '\n'
    } else {
      movimentos.forEach((m) => {
        const valor = Number(m.valor || 0)
        if (m.direcao === 'debito') saldo += valor
        else saldo -= valor

        const data = new Date(m.data_movimento).toLocaleDateString('pt-BR')
        const tipoLabel = m.tipo === 'lancamento' ? 'VENDA' : 
                         m.tipo === 'pagamento' ? 'PGTO' : 
                         m.tipo === 'ajuste' ? 'AJUSTE' : m.tipo.toUpperCase()
        
        const valorStr = m.direcao === 'debito' ? 
          `+${valor.toFixed(2)}` : `-${valor.toFixed(2)}`
        
        texto += pad(data, 12) + 
                 pad(tipoLabel, 10) + 
                 pad(`R$ ${valorStr}`, 12, 'right') + 
                 pad(`R$ ${saldo.toFixed(2)}`, 12, 'right') + '\n'

        // Descrição em linha separada se existir
        if (m.descricao) {
          const descricao = m.descricao.length > 44 ? 
            m.descricao.substring(0, 41) + '...' : m.descricao
          texto += pad(`  ${descricao}`, 46) + '\n'
        }
      })
    }

    texto += linhaThin
    texto += pad('SALDO DEVEDOR ATUAL:', 34, 'right') + pad(`R$ ${saldo.toFixed(2)}`, 12, 'right') + '\n'
    texto += linha + '\n'

    // Rodapé
    texto += pad('Este extrato serve apenas para', 40, 'center') + '\n'
    texto += pad('controle interno do estabelecimento', 40, 'center') + '\n'
    texto += linha

    return NextResponse.json({ 
      cupom: texto,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
        telefone: cliente.telefone,
        debito_atual: Number(cliente.debito_atual || 0),
        limite_credito: Number(cliente.limite_credito || 0)
      },
      saldo_final: Number(saldo.toFixed(2)),
      total_movimentos: movimentos.length
    })

  } catch (error) {
    console.error('Erro ao gerar cupom de extrato:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
