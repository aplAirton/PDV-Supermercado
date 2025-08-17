import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const rows: any = await executeQuery('SELECT * FROM cupons WHERE id = ?', [id])
    if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })

    return NextResponse.json(rows[0])
  } catch (err) {
    console.error('Erro ao buscar cupom:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
