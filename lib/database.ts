import mysql from "mysql2/promise"

// Suporta duas formas de configuração:
// 1) Variáveis separadas: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
// 2) DATABASE_URL no formato mysql://user:pass@host:3306/dbname
let dbConfig = {
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

if ((!dbConfig.host || !dbConfig.user || !dbConfig.database) && process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL)
    // url: mysql://user:pass@host:3306/db
    dbConfig = {
      host: url.hostname,
      port: Number.parseInt(url.port || "3306"),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname ? url.pathname.replace(/^\//, "") : process.env.DB_NAME,
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
