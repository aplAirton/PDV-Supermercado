import { NextResponse } from "next/server"
import { getDatabaseLogs, clearDatabaseLogs } from "@/lib/database"

export async function GET() {
  try {
    const logs = getDatabaseLogs()
    return NextResponse.json({
      success: true,
      logs,
      total: logs.length
    })
  } catch (error) {
    console.error('[DATABASE-LOGS API] Erro ao obter logs:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao obter logs do banco de dados'
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    clearDatabaseLogs()
    return NextResponse.json({
      success: true,
      message: 'Logs limpos com sucesso'
    })
  } catch (error) {
    console.error('[DATABASE-LOGS API] Erro ao limpar logs:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao limpar logs do banco de dados'
    }, { status: 500 })
  }
}