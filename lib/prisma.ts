import { PrismaClient } from '@prisma/client'
import { getCurrentDatabaseType } from './database-config'
import { getDbConfig } from './database'

// Cache de instâncias do Prisma
const prismaInstances: { [key: string]: PrismaClient } = {}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: { [key: string]: PrismaClient | undefined }
}

if (!global.__prisma) {
  global.__prisma = {}
}

// Função para obter instância do Prisma baseada na configuração atual
export function getPrismaInstance(type?: 'remote' | 'local'): PrismaClient {
  const dbType = type || getCurrentDatabaseType()

  console.log(`[PRISMA] Solicitando instância para tipo: ${dbType}`)

  // Retornar instância do cache se existir
  if (prismaInstances[dbType]) {
    console.log(`[PRISMA] Retornando instância em cache para ${dbType}`)
    return prismaInstances[dbType]
  }

  console.log(`[PRISMA] Criando nova instância para ${dbType}`)

  // Criar nova instância se não existir
  try {
    const config = getDbConfig(dbType)
    console.log(`[PRISMA] Config obtida para ${dbType}:`, {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user ? '***' : 'undefined'
    })

    if (!config.host || !config.database) {
      throw new Error(`Configuração inválida para ${dbType}: host ou database ausentes`)
    }

    const connectionString = `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?charset=utf8mb4&timezone=+00:00&connectTimeout=60000`
    console.log(`[PRISMA] Connection string criada para ${dbType}`)

    const prisma = new PrismaClient({
      datasourceUrl: connectionString
    })

    console.log(`[PRISMA] PrismaClient criado para ${dbType}`)
    console.log(`[PRISMA] Nova instância criada para banco ${dbType}: ${config.host}:${config.port}`)

    // Cache da instância
    prismaInstances[dbType] = prisma

    // Cache global para desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      global.__prisma[dbType] = prisma
    }

    return prisma

  } catch (error) {
    console.error(`[PRISMA] Erro ao criar instância para ${dbType}:`, error)
    throw error
  }
}

// Instância padrão (para compatibilidade)
export const prisma = getPrismaInstance()

// Função para alternar a instância ativa
export function switchPrismaInstance(type: 'remote' | 'local'): PrismaClient {
  const newInstance = getPrismaInstance(type)
  console.log(`[PRISMA] Instância alternada para banco ${type}`)
  return newInstance
}

// Função para obter a instância atual
export function getCurrentPrismaInstance(): PrismaClient {
  return getPrismaInstance()
}

export default prisma
