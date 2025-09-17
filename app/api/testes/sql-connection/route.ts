import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Teste básico de conexão - SELECT simples
    const testQuery = 'SELECT 1 as test, NOW() as current_time, VERSION() as mysql_version'
    const result = await executeQuery(testQuery) as any[]

    if (result && result.length > 0) {
      const details = [
        `✅ Conexão estabelecida com sucesso`,
        `⏰ Hora do servidor: ${new Date(result[0].current_time).toLocaleString('pt-BR')}`,
        `🗄️ Versão MySQL: ${result[0].mysql_version}`,
        `🔢 Teste de consulta: ${result[0].test}`
      ].join('\n')

      return NextResponse.json({
        success: true,
        details: details,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Consulta executada mas sem resultados'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro no teste de conexão SQL:', error)

    let errorMessage = 'Erro desconhecido na conexão com o banco de dados'

    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Servidor de banco de dados não está acessível (conexão recusada)'
      } else if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
        errorMessage = 'Acesso negado - verifique usuário e senha do banco de dados'
      } else if (error.message.includes('ER_BAD_DB_ERROR')) {
        errorMessage = 'Banco de dados não encontrado - verifique o nome da base de dados'
      } else if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Timeout na conexão com o banco de dados'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}