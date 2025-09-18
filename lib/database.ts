import mysql from "mysql2/promise"
import { getCurrentDatabaseType, updateDatabaseConfig, getCurrentDatabaseConfig as getPersistentConfig } from "./database-config"

// Re-exportar funções do módulo de configuração
export { getCurrentDatabaseType, getPersistentConfig as getCurrentDatabaseConfig }

// Sistema de logs para banco de dados
interface DatabaseLog {
  timestamp: Date
  operation: string
  configType: 'remote' | 'local'
  details?: string
  error?: string
}

let databaseLogs: DatabaseLog[] = []
const MAX_LOGS = 100

function addDatabaseLog(operation: string, configType: 'remote' | 'local', details?: string, error?: string) {
  const log: DatabaseLog = {
    timestamp: new Date(),
    operation,
    configType,
    details,
    error
  }

  databaseLogs.unshift(log) // Adiciona no início

  // Mantém apenas os logs mais recentes
  if (databaseLogs.length > MAX_LOGS) {
    databaseLogs = databaseLogs.slice(0, MAX_LOGS)
  }

  // Log no console para desenvolvimento
  console.log(`[DATABASE ${configType.toUpperCase()}] ${operation}${details ? ` - ${details}` : ''}${error ? ` - ERROR: ${error}` : ''}`)
}

export function getDatabaseLogs(): DatabaseLog[] {
  return [...databaseLogs]
}

export function clearDatabaseLogs() {
  databaseLogs = []
}

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

// Estado global da configuração atual
let currentDatabaseType: 'remote' | 'local' = 'remote' // Valor padrão seguro

// Inicializar com valor do arquivo se disponível
try {
  currentDatabaseType = getCurrentDatabaseType()
} catch (error) {
  console.warn('[DATABASE] Erro ao carregar configuração inicial, usando padrão:', error)
}

// Função para obter configuração específica
export function getDbConfig(type: 'remote' | 'local' = 'remote') {
  return dbConfigs[type]
}

// Função para definir o tipo atual de banco (para compatibilidade)
export function setCurrentDatabaseType(type: 'remote' | 'local') {
  updateDatabaseConfig(type)
  currentDatabaseType = type
}

// Função para obter a configuração atual
function getCurrentDbConfig() {
  return dbConfigs[currentDatabaseType]
}

// Função para recarregar a configuração (usada quando o usuário altera a configuração)
export function reloadDatabaseConfig(newType?: 'remote' | 'local') {
  if (newType) {
    updateDatabaseConfig(newType)
    currentDatabaseType = newType
  } else {
    // Recarregar do arquivo
    currentDatabaseType = getCurrentDatabaseType()
  }

  addDatabaseLog('CONFIG_RELOAD', currentDatabaseType, 'Configuração recarregada')
}

export async function getConnection() {
  try {
    const config = getCurrentDbConfig()
    addDatabaseLog('CONNECTION_CREATE', currentDatabaseType, `Conectando a ${config.host}:${config.port}`)
    const connection = await mysql.createConnection(config)
    addDatabaseLog('CONNECTION_SUCCESS', currentDatabaseType, 'Conexão estabelecida com sucesso')
    return connection
  } catch (error) {
    addDatabaseLog('CONNECTION_ERROR', currentDatabaseType, 'Falha ao conectar', error instanceof Error ? error.message : 'Erro desconhecido')
    throw error
  }
}

export async function getConnectionWithConfig(type: 'remote' | 'local' = 'remote') {
  try {
    const config = getDbConfig(type)
    addDatabaseLog('CONNECTION_CREATE_CONFIG', type, `Conectando a ${config.host}:${config.port}`)
    const connection = await mysql.createConnection(config)
    addDatabaseLog('CONNECTION_SUCCESS_CONFIG', type, 'Conexão estabelecida com sucesso')
    return connection
  } catch (error) {
    addDatabaseLog('CONNECTION_ERROR_CONFIG', type, 'Falha ao conectar', error instanceof Error ? error.message : 'Erro desconhecido')
    throw error
  }
}

export async function executeQuery(query: string, params: any[] = []) {
  const connection = await getConnection()
  try {
    addDatabaseLog('QUERY_EXECUTE', currentDatabaseType, `Executando query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`)
    const [results] = await connection.execute(query, params)
    addDatabaseLog('QUERY_SUCCESS', currentDatabaseType, `Query executada com sucesso - ${Array.isArray(results) ? results.length : 1} resultado(s)`)
    return results
  } catch (error) {
    addDatabaseLog('QUERY_ERROR', currentDatabaseType, `Erro na query: ${query.substring(0, 50)}...`, error instanceof Error ? error.message : 'Erro desconhecido')
    throw error
  } finally {
    await connection.end()
  }
}

export async function executeQueryWithConfig(query: string, params: any[] = [], configType: 'remote' | 'local' = 'remote') {
  const connection = await getConnectionWithConfig(configType)
  try {
    addDatabaseLog('QUERY_EXECUTE_CONFIG', configType, `Executando query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`)
    const [results] = await connection.execute(query, params)
    addDatabaseLog('QUERY_SUCCESS_CONFIG', configType, `Query executada com sucesso - ${Array.isArray(results) ? results.length : 1} resultado(s)`)
    return results
  } catch (error) {
    addDatabaseLog('QUERY_ERROR_CONFIG', configType, `Erro na query: ${query.substring(0, 50)}...`, error instanceof Error ? error.message : 'Erro desconhecido')
    throw error
  } finally {
    await connection.end()
  }
}
