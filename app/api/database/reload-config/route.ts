import { type NextRequest, NextResponse } from 'next/server'
import { reloadDatabaseConfig } from '@/lib/database'

// Esta rota permite recarregar a configuração do banco de dados
// Na prática, como o Next.js roda em serverless, a configuração será
// recarregada na próxima requisição após a alteração no localStorage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (!type || !['remote', 'local'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de banco de dados inválido. Use "remote" ou "local".' },
        { status: 400 }
      )
    }

    // Recarregar a configuração no servidor
    reloadDatabaseConfig()

    return NextResponse.json({
      success: true,
      message: `Configuração alterada para banco ${type}`,
      type: type
    })

  } catch (error) {
    console.error('Erro ao alterar configuração do banco:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}