import { type NextRequest, NextResponse } from "next/server"
import { getCurrentDatabaseType, getCurrentDatabaseConfig } from "@/lib/database"

export async function GET() {
  try {
    console.log('[STATUS_API] Verificando configuração atual...')

    const currentType = getCurrentDatabaseType()
    console.log(`[STATUS_API] Tipo atual: ${currentType}`)

    const config = getCurrentDatabaseConfig()
    console.log(`[STATUS_API] Configuração:`, config)

    return NextResponse.json({
      success: true,
      currentType,
      config,
      message: `Sistema configurado para usar banco ${currentType === 'remote' ? 'remoto' : 'local'}`
    })
  } catch (error) {
    console.error("[STATUS_API] Erro ao verificar configuração:", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}