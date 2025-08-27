import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  context: { params: Promise<{ vendaId: string }> }
) {
  try {
    const { vendaId } = await context.params
    const id = Number(vendaId)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID da venda inválido' }, { status: 400 })
    }

    // Buscar cupom_link da venda
    console.log(`[qrcode] Buscando QR code para venda ID: ${id}`)
    const cupomLink = await prisma.$queryRaw<any[]>`
      SELECT public_token, qr_data_url, criado_em
      FROM cupom_links
      WHERE venda_id = ${id}
      LIMIT 1
    `

    console.log(`[qrcode] Resultado da busca:`, cupomLink)
    if (!cupomLink || cupomLink.length === 0) {
      console.log(`[qrcode] QR Code não encontrado para venda ${id}`)
      return NextResponse.json({ error: 'QR Code não encontrado para esta venda' }, { status: 404 })
    }

    const dados = cupomLink[0]
    console.log(`[qrcode] QR code encontrado para venda ${id}:`, dados.public_token.substring(0, 8) + '...')

    return NextResponse.json({
      public_token: dados.public_token,
      qr_data_url: dados.qr_data_url,
      cupom_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/cupom/${dados.public_token}`,
      criado_em: dados.criado_em
    })
  } catch (error) {
    console.error('Erro ao buscar QR code da venda:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
