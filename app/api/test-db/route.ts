import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    // Testar conexão e verificar dados do caixa
    const caixasQuery = `SELECT * FROM caixas WHERE status = 'aberto'`
    const caixas = await executeQuery(caixasQuery) as any[]

    const mfQuery = `SELECT COUNT(*) as total FROM movimentacoes_financeiras`
    const mfCount = await executeQuery(mfQuery) as any[]

    return Response.json({
      caixas: caixas,
      totalMovimentacoes: mfCount[0]?.total || 0,
      database: 'pdv_supermercado'
    })
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      database: 'unknown'
    }, { status: 500 })
  }
}