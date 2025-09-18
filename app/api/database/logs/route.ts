import { NextResponse } from 'next/server'
import { getDatabaseLogs, clearDatabaseLogs, getCurrentDatabaseType } from '@/lib/database'

export async function GET() {
  try {
    const logs = getDatabaseLogs()
    const currentType = getCurrentDatabaseType()

    return NextResponse.json({
      success: true,
      currentType,
      logs,
      totalLogs: logs.length
    })

  } catch (error) {
    console.error('Erro ao obter logs do banco:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    clearDatabaseLogs()

    return NextResponse.json({
      success: true,
      message: 'Logs do banco de dados limpos com sucesso'
    })

  } catch (error) {
    console.error('Erro ao limpar logs do banco:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}