import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    // O Next pode fornecer `params` como uma Promise; aguardar params garante acesso seguro a suas propriedades
    const paramsResolved = await (context as any).params
    const vendaId = Number(paramsResolved.id)
    if (Number.isNaN(vendaId)) return NextResponse.json({ error: 'vendaId inválido' }, { status: 400 })

    const rows: any = await executeQuery('SELECT * FROM cupons WHERE venda_id = ? ORDER BY data_criacao DESC LIMIT 1', [vendaId])
    if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })

    return NextResponse.json(rows[0])
  } catch (err) {
    console.error('Erro ao buscar cupom por venda:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
