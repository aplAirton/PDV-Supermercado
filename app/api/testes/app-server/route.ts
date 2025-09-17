import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Informações do servidor
    const serverInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    }

    // Calcular uptime em formato legível
    const uptimeSeconds = Math.floor(serverInfo.uptime)
    const hours = Math.floor(uptimeSeconds / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const seconds = uptimeSeconds % 60
    const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`

    // Calcular uso de memória
    const memoryMB = {
      rss: Math.round(serverInfo.memory.rss / 1024 / 1024),
      heapTotal: Math.round(serverInfo.memory.heapTotal / 1024 / 1024),
      heapUsed: Math.round(serverInfo.memory.heapUsed / 1024 / 1024),
      external: Math.round(serverInfo.memory.external / 1024 / 1024)
    }

    const details = [
      `✅ Servidor Next.js funcionando`,
      `⏰ Uptime: ${uptimeFormatted}`,
      `🖥️ Plataforma: ${serverInfo.platform} (${serverInfo.arch})`,
      `📦 Node.js: ${serverInfo.nodeVersion}`,
      `🌍 Ambiente: ${serverInfo.environment}`,
      `💾 Memória RSS: ${memoryMB.rss} MB`,
      `🏗️ Heap usado: ${memoryMB.heapUsed} MB / ${memoryMB.heapTotal} MB`,
      `📅 Última verificação: ${new Date(serverInfo.timestamp).toLocaleString('pt-BR')}`
    ].join('\n')

    return NextResponse.json({
      success: true,
      details: details,
      serverInfo: {
        ...serverInfo,
        uptimeFormatted,
        memoryMB
      }
    })

  } catch (error) {
    console.error('Erro no teste do servidor da aplicação:', error)

    return NextResponse.json({
      success: false,
      error: `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}