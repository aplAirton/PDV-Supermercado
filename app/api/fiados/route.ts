import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Retorna registros de fiados (abertos/parciais) com informações do cliente e venda
    const fiados = await prisma.fiados.findMany({
      where: {
        status: { in: ['aberto', 'parcial'] }
      },
      include: {
        cliente: {
          select: { nome: true }
        },
        vendas: {
          select: { 
            total: true, 
            observacoes: true 
          }
        }
      },
      orderBy: { data_fiado: 'desc' },
      take: 500
    })

    const fiadosFormatados = fiados.map((f: any) => ({
      id: f.id,
      venda_id: f.venda_id,
      cliente_id: f.cliente_id,
      cliente_nome: f.cliente?.nome || 'Cliente não encontrado',
      valor_original: Number(f.valor_original || 0),
      valor_pago: Number(f.valor_pago || 0),
      valor_restante: Number(f.valor_restante || 0),
      status: f.status,
      data_fiado: f.data_fiado,
      venda_total: Number(f.vendas?.total || 0),
      descricao: f.vendas?.observacoes || `Fiado #${f.id}`
    }))

    return NextResponse.json(fiadosFormatados)
  } catch (error) {
    console.error('Erro ao listar fiados:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
