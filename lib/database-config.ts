import fs from 'fs'
import path from 'path'

// Caminho para o arquivo de configuração
const CONFIG_FILE_PATH = path.join(process.cwd(), 'database-config.json')

// Configuração padrão
const DEFAULT_CONFIG = {
  type: 'remote' as 'remote' | 'local',
  lastUpdated: new Date().toISOString()
}

// Interface para a configuração
interface DatabaseConfig {
  type: 'remote' | 'local'
  lastUpdated: string
}

// Função para ler a configuração do arquivo
function readConfigFromFile(): DatabaseConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf8')
      const config = JSON.parse(data) as DatabaseConfig
      return config
    }
  } catch (error) {
    console.error('Erro ao ler configuração do arquivo:', error)
  }

  // Retornar configuração padrão se não conseguir ler
  return DEFAULT_CONFIG
}

// Função para salvar a configuração no arquivo
function saveConfigToFile(config: DatabaseConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2))
  } catch (error) {
    console.error('Erro ao salvar configuração no arquivo:', error)
    throw error
  }
}

// Estado em memória (para performance)
let currentConfig: DatabaseConfig = readConfigFromFile()

// Função para obter a configuração atual
export function getCurrentDatabaseConfig(): DatabaseConfig {
  return { ...currentConfig }
}

// Função para obter apenas o tipo de banco
export function getCurrentDatabaseType(): 'remote' | 'local' {
  return currentConfig.type
}

// Função para atualizar a configuração
export function updateDatabaseConfig(type: 'remote' | 'local'): void {
  const newConfig: DatabaseConfig = {
    type,
    lastUpdated: new Date().toISOString()
  }

  // Salvar no arquivo
  saveConfigToFile(newConfig)

  // Atualizar estado em memória
  currentConfig = newConfig

  console.log(`[DATABASE_CONFIG] Configuração alterada para: ${type}`)
}

// Função para recarregar configuração do arquivo (útil para desenvolvimento)
export function reloadDatabaseConfig(): void {
  currentConfig = readConfigFromFile()
  console.log(`[DATABASE_CONFIG] Configuração recarregada: ${currentConfig.type}`)
}

// Função para verificar se a configuração foi atualizada recentemente
export function getConfigLastUpdated(): Date {
  return new Date(currentConfig.lastUpdated)
}

// Função de diagnóstico para debug
export function debugConfig(): void {
  console.log('[DATABASE_CONFIG] Estado atual:', currentConfig)
  console.log('[DATABASE_CONFIG] Arquivo existe:', fs.existsSync(CONFIG_FILE_PATH))
  console.log('[DATABASE_CONFIG] Caminho:', CONFIG_FILE_PATH)
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    try {
      const fileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf8')
      console.log('[DATABASE_CONFIG] Conteúdo do arquivo:', fileContent)
    } catch (error) {
      console.log('[DATABASE_CONFIG] Erro ao ler arquivo:', error)
    }
  }
}

// Inicializar configuração na primeira carga
console.log('[DATABASE_CONFIG] Inicializando sistema de configuração...')
reloadDatabaseConfig()
debugConfig()