import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isValidToken } from '@/lib/cupom-utils'

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params

    if (!token || !isValidToken(token)) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    // Buscar cupom_link pelo token
    const cupomLink = await prisma.$queryRaw<any[]>`
      SELECT cl.*, v.*, c.conteudo_texto, cli.nome as cliente_nome
      FROM cupom_links cl
      JOIN vendas v ON cl.venda_id = v.id
      LEFT JOIN cupons c ON v.id = c.venda_id
      LEFT JOIN clientes cli ON v.cliente_id = cli.id
      WHERE cl.public_token = ${token}
      LIMIT 1
    `

    if (!cupomLink || cupomLink.length === 0) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })
    }

    const dados = cupomLink[0]

    // Buscar itens da venda
    const itens = await prisma.$queryRaw<any[]>`
      SELECT iv.*, p.nome as produto_nome
      FROM itens_venda iv
      JOIN produtos p ON iv.produto_id = p.id
      WHERE iv.venda_id = ${dados.venda_id}
    `

    return NextResponse.json({
      cupom: {
        venda_id: dados.venda_id,
        data_venda: dados.data_venda,
        total: Number(dados.total),
        troco: Number(dados.troco || 0),
        forma_pagamento: dados.forma_pagamento,
        forma_pagamento_json: dados.forma_pagamento_json,
        cliente_nome: dados.cliente_nome || 'Cliente Avulso',
        conteudo_texto: dados.conteudo_texto,
        criado_em: dados.criado_em,
        itens: itens.map(item => ({
          produto_nome: item.produto_nome,
          quantidade: Number(item.quantidade),
          preco_unitario: Number(item.preco_unitario),
          subtotal: Number(item.subtotal)
        }))
      }
    })
  } catch (error) {
    console.error('Erro ao buscar cupom público:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
