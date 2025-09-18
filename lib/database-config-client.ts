"use client"

// Configuração do banco para o lado cliente
const DATABASE_CONFIG_KEY = 'pdv_database_config'

export type DatabaseType = 'remote' | 'local'

interface DatabaseConfig {
  type: DatabaseType
  lastUpdated: string
}

const DEFAULT_CONFIG: DatabaseConfig = {
  type: 'remote',
  lastUpdated: new Date().toISOString()
}

// Função para salvar configuração no localStorage
function saveToLocalStorage(config: DatabaseConfig): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DATABASE_CONFIG_KEY, JSON.stringify(config))
      console.log(`[CLIENT_CONFIG] Configuração salva: ${config.type}`)
    }
  } catch (error) {
    console.error('[CLIENT_CONFIG] Erro ao salvar no localStorage:', error)
  }
}

// Função para ler configuração do localStorage
function readFromLocalStorage(): DatabaseConfig {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DATABASE_CONFIG_KEY)
      if (stored) {
        const config = JSON.parse(stored) as DatabaseConfig
        console.log(`[CLIENT_CONFIG] Configuração carregada: ${config.type}`)
        return config
      }
    }
  } catch (error) {
    console.error('[CLIENT_CONFIG] Erro ao ler localStorage:', error)
  }

  console.log('[CLIENT_CONFIG] Usando configuração padrão: remote')
  return DEFAULT_CONFIG
}

// Estado da configuração atual
let currentConfig: DatabaseConfig = readFromLocalStorage()

// Função para obter a configuração atual do cliente
export function getCurrentDatabaseTypeClient(): DatabaseType {
  // Sempre recarregar do localStorage para garantir sincronização
  if (typeof window !== 'undefined') {
    currentConfig = readFromLocalStorage()
  }
  return currentConfig.type
}

// Função para atualizar configuração no cliente
export function updateDatabaseConfigClient(type: DatabaseType): void {
  const newConfig: DatabaseConfig = {
    type,
    lastUpdated: new Date().toISOString()
  }

  // Salvar no localStorage
  saveToLocalStorage(newConfig)
  
  // Atualizar estado em memória
  currentConfig = newConfig

  console.log(`[CLIENT_CONFIG] Configuração do cliente alterada para: ${type}`)
}

// Função para sincronizar com o servidor
export async function syncWithServer(type: DatabaseType): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`[CLIENT_CONFIG] Sincronizando com servidor: ${type}`)
    
    const response = await fetch('/api/database/reload-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type })
    })

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success) {
      // Atualizar configuração local apenas se servidor confirmou
      updateDatabaseConfigClient(type)
      console.log('[CLIENT_CONFIG] Sincronização com servidor bem-sucedida')
      return { success: true, message: `Configuração alterada para banco ${type}` }
    } else {
      throw new Error(result.message || 'Erro desconhecido do servidor')
    }
  } catch (error) {
    console.error('[CLIENT_CONFIG] Erro na sincronização:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro na comunicação com servidor' 
    }
  }
}

// Função para obter status da configuração
export function getConfigStatus(): { type: DatabaseType; lastUpdated: string; isClient: boolean } {
  return {
    type: currentConfig.type,
    lastUpdated: currentConfig.lastUpdated,
    isClient: typeof window !== 'undefined'
  }
}