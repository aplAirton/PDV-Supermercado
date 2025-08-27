import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, context: any) {
  try {
    // garantir que context seja aguardado corretamente (Next.js exige await antes de usar params)
    const ctx = await context
    const clienteId = Number(ctx?.params?.clienteId)
    if (Number.isNaN(clienteId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    // Buscar movimentos ordenados usando consulta raw para evitar depender do client gerado
    const movimentos: any[] = await prisma.$queryRaw`
      SELECT *
      FROM fiado_movimentos
      WHERE cliente_id = ${clienteId}
      ORDER BY data_movimento ASC, id ASC
    `

    // Calcular saldo corrente em JS (debito = soma de 'debito', credito = subtração)
    let saldo = 0
    const rows = movimentos.map((m) => {
      const valor = Number(m.valor || 0)
      if (m.direcao === 'debito') saldo += valor
      else saldo -= valor
      return {
        id: m.id,
        data_movimento: m.data_movimento,
        tipo: m.tipo,
        referencia: m.referencia,
        descricao: m.descricao,
        direcao: m.direcao,
        valor: Number(m.valor || 0),
        saldo_corrente: Number((saldo).toFixed(2)),
      }
    })

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Erro ao buscar extrato de fiado:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
