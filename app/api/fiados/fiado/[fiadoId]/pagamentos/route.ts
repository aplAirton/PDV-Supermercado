import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { fiadoId: string } }) {
  try {
    const fiadoId = Number(params.fiadoId)
    if (Number.isNaN(fiadoId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const rows = await prisma.pagamentos_fiado.findMany({
      where: { fiado_id: fiadoId },
      select: { id: true, valor_pagamento: true, forma_pagamento: true, observacoes: true, data_pagamento: true }
    })

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Erro ao buscar pagamentos do fiado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
