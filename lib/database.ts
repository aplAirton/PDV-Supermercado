import mysql from "mysql2/promise"

// Configuração local padrão para desenvolvimento
let dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pdv_supermercado',
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectTimeout: 60000,
  acquireTimeout: 60000
}

// Suporte para DATABASE_URL (produção)
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL)
    dbConfig = {
      ...dbConfig,
      host: url.hostname,
      port: Number.parseInt(url.port || "3306"),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname ? url.pathname.replace(/^\//, "") : dbConfig.database,
    }
    console.log("DATABASE_URL detectada — usando configuração via URL para conexão ao banco")
  } catch (err) {
    console.error("Falha ao parsear DATABASE_URL:", err)
  }
}

export async function getConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig)
    return connection
  } catch (error) {
  console.error("Erro ao conectar com o banco:", error)
    throw error
  }
}

export async function executeQuery(query: string, params: any[] = []) {
  const connection = await getConnection()
  try {
    const [results] = await connection.execute(query, params)
    return results
  } finally {
    await connection.end()
  }
}
