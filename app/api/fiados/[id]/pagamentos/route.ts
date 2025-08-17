import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fiadoId = Number(params.id)
    if (Number.isNaN(fiadoId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const rows: any = await executeQuery("SELECT id, valor_pagamento, forma_pagamento, observacoes, data_pagamento FROM pagamentos_fiado WHERE fiado_id = ? ORDER BY data_pagamento ASC", [fiadoId])
    return NextResponse.json(Array.isArray(rows) ? rows : [])
  } catch (error) {
    console.error('Erro ao buscar pagamentos do fiado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
