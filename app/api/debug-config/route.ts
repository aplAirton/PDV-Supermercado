import { getCurrentDatabaseConfig, debugConfig } from "@/lib/database-config"
import { getCurrentDatabaseType } from "@/lib/database"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Executar debug
    debugConfig()
    
    // Obter configurações de ambos os módulos
    const config1 = getCurrentDatabaseConfig()
    const config2 = getCurrentDatabaseType()
    
    console.log('[DEBUG API] Config do database-config.ts:', config1)
    console.log('[DEBUG API] Config do database.ts:', config2)
    
    return NextResponse.json({
      success: true,
      config_from_database_config: config1,
      config_from_database: config2,
      match: config1.type === config2
    })
  } catch (error) {
    console.error('[DEBUG API] Erro:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}