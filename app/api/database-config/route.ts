import { type NextRequest, NextResponse } from "next/server"
import { updateDatabaseConfig, getCurrentDatabaseConfig } from "@/lib/database-config"

export async function GET() {
  try {
    const config = getCurrentDatabaseConfig()
    
    // Log de debug para verificar se está funcionando
    console.log('[DATABASE-CONFIG API] GET - Configuração atual:', config)
    
    return NextResponse.json({
      success: true,
      config
    })
  } catch (error) {
    console.error('[DATABASE-CONFIG API] Erro ao obter configuração:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao obter configuração do banco de dados'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()

    if (!type || !['remote', 'local'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de banco inválido. Deve ser "remote" ou "local"'
      }, { status: 400 })
    }

    // Atualizar configuração
    updateDatabaseConfig(type)

    console.log(`[DATABASE-CONFIG API] Configuração alterada para: ${type}`)

    return NextResponse.json({
      success: true,
      message: `Configuração do banco alterada para ${type === 'remote' ? 'remoto' : 'local'} com sucesso`,
      config: getCurrentDatabaseConfig()
    })

  } catch (error) {
    console.error('[DATABASE-CONFIG API] Erro ao atualizar configuração:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao atualizar configuração do banco de dados'
    }, { status: 500 })
  }
}