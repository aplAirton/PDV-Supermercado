import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    console.log('[DEBUG CAIXA] Verificando status do caixa...')
    
    // Verificar se há caixa aberto
    const caixaAberto = await executeQuery(`
      SELECT 
        id, 
        funcionario_id,
        status,
        valor_inicial,
        total_dinheiro,
        COALESCE(total_sangrias, 0) as total_sangrias,
        COALESCE(total_suprimentos, 0) as total_suprimentos,
        data_abertura
      FROM caixas 
      WHERE status = 'aberto' 
      ORDER BY data_abertura DESC 
      LIMIT 1
    `) as any[]

    // Verificar se há funcionários cadastrados
    const funcionarios = await executeQuery(`
      SELECT id, nome, ativo 
      FROM funcionarios 
      WHERE ativo = true
    `) as any[]

    // Verificar se há fornecedores
    const fornecedores = await executeQuery(`
      SELECT id, nome, ativo 
      FROM fornecedores 
      WHERE ativo = true 
      LIMIT 5
    `) as any[]

    return NextResponse.json({
      debug_timestamp: new Date().toISOString(),
      caixa_aberto: {
        existe: caixaAberto.length > 0,
        dados: caixaAberto[0] || null
      },
      funcionarios_cadastrados: funcionarios.length,
      fornecedores_cadastrados: fornecedores.length,
      estrutura_completa: {
        tem_caixa_aberto: caixaAberto.length > 0,
        tem_funcionarios: funcionarios.length > 0,
        tem_fornecedores: fornecedores.length > 0
      }
    })

  } catch (error) {
    console.error('[DEBUG CAIXA] Erro:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}