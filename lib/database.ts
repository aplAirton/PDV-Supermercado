import mysql from "mysql2/promise"

// Configurações de banco de dados
const dbConfigs = {
  remote: {
    host: process.env.DB_HOST || 'associacao.cjcs4o2mmp5e.us-east-2.rds.amazonaws.com',
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || 'airton',
    password: process.env.DB_PASSWORD || 'Jurema2580',
    database: process.env.DB_NAME || 'pdv_supermercado',
    charset: 'utf8mb4',
    timezone: '+00:00',
    connectTimeout: 60000
  },
  local: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'pdv_supermercado',
    charset: 'utf8mb4',
    timezone: '+00:00',
    connectTimeout: 60000
  }
}

// Função para obter configuração específica
export function getDbConfig(type: 'remote' | 'local' = 'remote') {
  return dbConfigs[type]
}

// Função para obter a configuração atual
function getCurrentDbConfig() {
  // Em ambiente de servidor, verificar se há uma configuração forçada
  // Caso contrário, usar remoto como padrão
  if (typeof window !== 'undefined') {
    // No navegador, verificar localStorage
    const savedConfig = localStorage.getItem('database_config') as 'remote' | 'local'
    return dbConfigs[savedConfig || 'remote']
  }

  // No servidor, sempre usar remoto (pode ser alterado via variáveis de ambiente)
  return dbConfigs.remote
}

// Configuração atual do banco
let dbConfig = getCurrentDbConfig()

// Função para recarregar a configuração (usada quando o usuário altera a configuração)
export function reloadDatabaseConfig() {
  dbConfig = getCurrentDbConfig()
}

export async function getConnection() {
  try {
    // Recarregar configuração antes de cada conexão (para capturar mudanças)
    reloadDatabaseConfig()
    const connection = await mysql.createConnection(dbConfig)
    return connection
  } catch (error) {
  console.error("Erro ao conectar com o banco:", error)
    throw error
  }
}

export async function getConnectionWithConfig(type: 'remote' | 'local' = 'remote') {
  try {
    const config = getDbConfig(type)
    const connection = await mysql.createConnection(config)
    return connection
  } catch (error) {
    console.error(`Erro ao conectar com o banco ${type}:`, error)
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

export async function executeQueryWithConfig(query: string, params: any[] = [], configType: 'remote' | 'local' = 'remote') {
  const connection = await getConnectionWithConfig(configType)
  try {
    const [results] = await connection.execute(query, params)
    return results
  } finally {
    await connection.end()
  }
}
