"use client"

import { useState, useEffect } from 'react'
import { 
  getCurrentDatabaseTypeClient, 
  syncWithServer, 
  type DatabaseType,
  getConfigStatus 
} from '../lib/database-config-client'

export function useDatabaseConfig() {
  const [currentDatabase, setCurrentDatabase] = useState<DatabaseType>('remote')
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Carrega configuração inicial
  useEffect(() => {
    const config = getConfigStatus()
    setCurrentDatabase(config.type)
    setLastUpdated(config.lastUpdated)
  }, [])

  // Função para alterar configuração
  const changeDatabaseType = async (type: DatabaseType): Promise<{ success: boolean; message: string }> => {
    if (type === currentDatabase) {
      return { success: true, message: 'Configuração já está definida para este banco' }
    }

    setIsLoading(true)

    try {
      const result = await syncWithServer(type)
      
      if (result.success) {
        setCurrentDatabase(type)
        setLastUpdated(new Date().toISOString())
      }

      return result
    } catch (error) {
      console.error('Erro ao alterar configuração:', error)
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Função para recarregar configuração
  const reloadConfig = () => {
    const config = getConfigStatus()
    setCurrentDatabase(config.type)
    setLastUpdated(config.lastUpdated)
  }

  return {
    currentDatabase,
    isLoading,
    lastUpdated,
    changeDatabaseType,
    reloadConfig
  }
}