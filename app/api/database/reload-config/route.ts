import { type NextRequest, NextResponse } from 'next/server'
import { reloadDatabaseConfig, getCurrentDatabaseType, getDatabaseLogs } from '@/lib/database'
import { switchPrismaInstance } from '@/lib/prisma'

// Esta rota permite recarregar a configuração do banco de dados
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (!type || !['remote', 'local'].includes(type)) {
      return NextResponse.json(
        { error: `Tipo de banco de dados inválido: "${type}". Use "remote" ou "local".` },
        { status: 400 }
      )
    }

    console.log(`[RELOAD_CONFIG] Iniciando reload para tipo: ${type}`)

    // Validar que o tipo é realmente válido
    const validType = type as 'remote' | 'local'
    if (validType !== 'remote' && validType !== 'local') {
      return NextResponse.json(
        { error: 'Tipo de banco de dados com validação de tipo falhou.' },
        { status: 400 }
      )
    }

    // Recarregar a configuração no servidor com o novo tipo
    reloadDatabaseConfig(validType)

    // Alternar a instância do Prisma para usar o novo banco
    switchPrismaInstance(validType)

    return NextResponse.json({
      success: true,
      message: `Configuração alterada para banco ${type}`,
      type: type,
      currentType: getCurrentDatabaseType()
    })

  } catch (error) {
    console.error('Erro ao alterar configuração do banco:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET para obter informações sobre a configuração atual
export async function GET() {
  try {
    const currentType = getCurrentDatabaseType()
    const logs = getDatabaseLogs()

    return NextResponse.json({
      success: true,
      currentType,
      logs: logs.slice(0, 10), // Últimos 10 logs
      totalLogs: logs.length
    })

  } catch (error) {
    console.error('Erro ao obter configuração do banco:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}