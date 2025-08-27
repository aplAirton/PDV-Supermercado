import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  // Rota depreciada. Use /api/fiados/fiado/[fiadoId]/pagamentos ou /api/fiados/[clienteId]/pagamentos
  return NextResponse.json({ error: 'Rota descontinuada. Use /api/fiados/fiado/[fiadoId]/pagamentos ou /api/fiados/[clienteId]/pagamentos' }, { status: 410 })
}
