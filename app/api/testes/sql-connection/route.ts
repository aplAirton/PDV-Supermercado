import { type NextRequest, NextResponse } from 'next/server'
import { executeQueryWithConfig } from '@/lib/database'

export async function GET(request: NextRequest) {
  // Obter o tipo de configuração da query string
  const { searchParams } = new URL(request.url)
  const configType = (searchParams.get('config') as 'remote' | 'local') || 'remote'

  try {

    // Teste básico de conexão - SELECT com informações do servidor e tabela
    const testQuery = `
      SELECT
        1 as test,
        NOW() as server_time,
        VERSION() as mysql_version,
        @@hostname as server_name,
        DATABASE() as current_database,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()) as total_tables
    `
    const result = await executeQueryWithConfig(testQuery, [], configType) as any[]

    if (result && result.length > 0) {
      const details = [
        `✅ Conexão estabelecida com sucesso`,
        `🖥️ Servidor: ${result[0].server_name}`,
        `🗄️ Banco de dados: ${result[0].current_database}`,
        `📊 Total de tabelas: ${result[0].total_tables}`,
        `⏰ Hora do servidor: ${new Date(result[0].server_time).toLocaleString('pt-BR')}`,
        `🔢 Versão MySQL: ${result[0].mysql_version}`,
        `✅ Teste de consulta: ${result[0].test}`
      ].join('\n')

      return NextResponse.json({
        success: true,
        details: details,
        serverInfo: {
          serverName: result[0].server_name,
          databaseName: result[0].current_database,
          totalTables: result[0].total_tables,
          serverTime: result[0].server_time,
          mysqlVersion: result[0].mysql_version
        },
        configType: configType,
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
      configType: configType,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
