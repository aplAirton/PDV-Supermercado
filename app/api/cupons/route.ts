import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { venda_id, conteudo_texto } = body
    if (!venda_id || !conteudo_texto) return NextResponse.json({ error: 'venda_id e conteudo_texto são obrigatórios' }, { status: 400 })

    const result: any = await executeQuery(
      'INSERT INTO cupons (venda_id, conteudo_texto) VALUES (?, ?)',
      [venda_id, conteudo_texto],
    )

    return NextResponse.json({ success: true, id: result.insertId })
  } catch (err) {
    console.error('Erro ao criar cupom:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
