import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    // Buscar informações básicas do banco
    const connectionInfo = await executeQuery(`
      SELECT 
        @@hostname as host,
        @@port as port,
        DATABASE() as database_name,
        @@version as version,
        USER() as user,
        @@character_set_database as charset
    `) as any[]

    // Buscar informações adicionais sobre o banco de dados atual
    const dbInfo = await executeQuery(`
      SELECT 
        SCHEMA_NAME as database_name,
        DEFAULT_CHARACTER_SET_NAME as charset,
        DEFAULT_COLLATION_NAME as collation
      FROM information_schema.SCHEMATA 
      WHERE SCHEMA_NAME = DATABASE()
    `) as any[]

    // Buscar estatísticas das tabelas
    const tableStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_tables,
        SUM(TABLE_ROWS) as total_rows,
        ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `) as any[]

    const connectionData = connectionInfo[0] || {}
    const dbData = dbInfo[0] || {}
    const statsData = tableStats[0] || {}

    const databaseInfo = {
      host: connectionData.host || 'localhost',
      port: connectionData.port?.toString() || '3306',
      database: connectionData.database_name || dbData.database_name || 'pdv_supermercado',
      version: connectionData.version || 'MySQL',
      user: connectionData.user?.split('@')[0] || 'root',
      charset: connectionData.charset || dbData.charset || 'utf8mb4',
      collation: dbData.collation || 'utf8mb4_general_ci',
      statistics: {
        totalTables: parseInt(statsData.total_tables) || 0,
        totalRows: parseInt(statsData.total_rows) || 0,
        sizeMB: parseFloat(statsData.size_mb) || 0
      }
    }

    return NextResponse.json(databaseInfo)
  } catch (error: any) {
    console.error('Erro ao buscar informações do banco:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao buscar informações do banco', 
        message: error.message 
      },
      { status: 500 }
    )
  }
}