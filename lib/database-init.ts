import { reloadDatabaseConfig } from './database-config'

// Função para inicializar a configuração do banco de dados
export function initializeDatabaseConfig() {
  try {
    reloadDatabaseConfig()
    console.log('[DATABASE_INIT] Configuração do banco inicializada com sucesso')
  } catch (error) {
    console.error('[DATABASE_INIT] Erro ao inicializar configuração:', error)
    throw error
  }
}

// Auto-execução para garantir inicialização
if (typeof window === 'undefined') { // Apenas no servidor
  initializeDatabaseConfig()
}