import { NextResponse } from 'next/server'
import { executeQuery, getConnection } from '@/lib/database'

export async function GET() {
  let connection: any = null
  
  try {
    // Tentar estabelecer conexão
    connection = await getConnection()
    
    // Buscar informações do banco
    const connectionInfo = await executeQuery(`
      SELECT 
        @@hostname as host,
        @@port as port,
        DATABASE() as database_name,
        @@version as version,
        USER() as user,
        @@character_set_database as charset
    `) as any[]

    // Testar algumas operações básicas
    const tables = await executeQuery(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `) as any[]

    // Verificar se a conexão está funcionando
    const testQuery = await executeQuery(`SELECT 1 as test`) as any[]

    const connectionData = connectionInfo[0] || {}
    const tableData = tables[0] || {}

    const databaseInfo = {
      host: connectionData.host || 'localhost',
      port: connectionData.port?.toString() || '3306',
      database: connectionData.database_name || 'pdv_supermercado',
      version: connectionData.version || 'MySQL',
      user: connectionData.user?.split('@')[0] || 'root',
      charset: connectionData.charset || 'utf8mb4',
      tableCount: parseInt(tableData.table_count) || 0
    }

    // Retornar sucesso com informações do banco
    return NextResponse.json({
      success: true,
      message: `Conexão estabelecida com sucesso! Banco: ${databaseInfo.database} (${databaseInfo.tableCount} tabelas)`,
      databaseInfo,
      tests: {
        connection: true,
        basicQuery: testQuery.length > 0,
        tableAccess: true,
        informationSchema: true
      }
    })

  } catch (error: any) {
    console.error('Erro no teste de banco:', error)
    
    return NextResponse.json({
      success: false,
      message: `Falha na conexão com o banco de dados: ${error.message}`,
      error: error.message,
      tests: {
        connection: false,
        basicQuery: false,
        tableAccess: false,
        informationSchema: false
      }
    }, { status: 500 })
    
  } finally {
    if (connection) {
      try {
        await connection.end()
      } catch (error) {
        console.error('Erro ao fechar conexão:', error)
      }
    }
  }
}