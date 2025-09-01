import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '../../../../../lib/database'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const caixaId = params.id
    
    if (!caixaId) {
      return NextResponse.json(
        { error: 'ID do caixa é obrigatório' },
        { status: 400 }
      )
    }
    
    // Buscar dados do caixa
    const caixaQuery = `
      SELECT c.*, 
             f_abertura.nome as operador_abertura,
             f_fechamento.nome as operador_fechamento
      FROM caixas c
      LEFT JOIN funcionarios f_abertura ON c.funcionario_abertura_id = f_abertura.id
      LEFT JOIN funcionarios f_fechamento ON c.funcionario_fechamento_id = f_fechamento.id
      WHERE c.id = ?
      LIMIT 1
    `
    const caixas = await executeQuery(caixaQuery, [caixaId]) as any[]
    
    if (caixas.length === 0) {
      return NextResponse.json(
        { error: 'Caixa não encontrado' },
        { status: 404 }
      )
    }
    
    const caixa = caixas[0]
    
    // Calcular valores esperados
    const valorInicial = parseFloat(caixa.valor_inicial || 0)
    const totalVendasDinheiro = parseFloat(caixa.total_dinheiro || 0)
    const totalSuprimentos = parseFloat(caixa.total_suprimentos || 0)
    const totalSangrias = parseFloat(caixa.total_sangrias || 0)
    
    const valorEsperado = valorInicial + totalVendasDinheiro + totalSuprimentos - totalSangrias
    
    const valorContado = parseFloat(caixa.valor_contado_dinheiro || 0)
    const diferenca = valorContado - valorEsperado
    
    // Buscar detalhes das vendas
    const vendasQuery = `
      SELECT COUNT(*) as total_transacoes,
             COALESCE(SUM(total), 0) as total_vendas_calculado,
             COALESCE(SUM(valor_dinheiro), 0) as vendas_dinheiro,
             COALESCE(SUM(valor_cartao_debito), 0) as vendas_cartao_debito,
             COALESCE(SUM(valor_cartao_credito), 0) as vendas_cartao_credito,
             COALESCE(SUM(valor_pix), 0) as vendas_pix,
             COALESCE(SUM(valor_fiado), 0) as vendas_fiado
      FROM vendas
      WHERE caixa_id = ?
    `
    const vendas = await executeQuery(vendasQuery, [caixaId]) as any[]
    const resumoVendas = vendas[0] || { total_transacoes: 0, total_vendas_calculado: 0 }
    
    const resumo = {
      id: caixa.id,
      data_abertura: caixa.data_abertura,
      data_fechamento: caixa.data_fechamento,
      status: caixa.status,
      operador_abertura: caixa.operador_abertura,
      operador_fechamento: caixa.operador_fechamento,
      valores: {
        inicial: valorInicial,
        vendas: parseFloat(caixa.total_vendas || 0),
        vendas_dinheiro: totalVendasDinheiro,
        suprimentos: totalSuprimentos,
        sangrias: totalSangrias,
        esperado: valorEsperado,
        contado: valorContado,
        diferenca: diferenca
      },
      vendas: {
        total_transacoes: resumoVendas.total_transacoes,
        valor_total: parseFloat(resumoVendas.total_vendas_calculado || 0),
        valor_dinheiro: parseFloat(resumoVendas.vendas_dinheiro || 0),
        valor_cartao_debito: parseFloat(resumoVendas.vendas_cartao_debito || 0),
        valor_cartao_credito: parseFloat(resumoVendas.vendas_cartao_credito || 0),
        valor_pix: parseFloat(resumoVendas.vendas_pix || 0),
        valor_fiado: parseFloat(resumoVendas.vendas_fiado || 0)
      },
      status_reconciliacao: caixa.status_reconciliacao,
      diferenca_caixa: parseFloat(caixa.diferenca_caixa || 0)
    }
    
    return NextResponse.json(resumo)
  } catch (error) {
    console.error('Erro ao buscar resumo do caixa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
