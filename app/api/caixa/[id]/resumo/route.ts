import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '../../../../../lib/database'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const caixaId = id

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
    
    // Usar valores diretos da tabela caixas (atualizados por triggers)
    const valorInicial = parseFloat(caixa.valor_inicial || 0)
    const totalVendas = parseFloat(caixa.total_vendas || 0)
    const totalDinheiro = parseFloat(caixa.total_dinheiro || 0) 
    const totalCartaoDebito = parseFloat(caixa.total_cartao_debito || 0)
    const totalCartaoCredito = parseFloat(caixa.total_cartao_credito || 0)
    const totalPix = parseFloat(caixa.total_pix || 0)
    const totalFiado = parseFloat(caixa.total_fiado || 0)
    const totalSuprimentos = parseFloat(caixa.total_suprimentos || 0)
    const totalSangrias = parseFloat(caixa.total_sangrias || 0)
    
    // Valor esperado no caixa (apenas dinheiro físico)
    const valorEsperado = valorInicial + totalDinheiro + totalSuprimentos - totalSangrias
    
    const valorContado = parseFloat(caixa.valor_contado_dinheiro || 0)
    const diferenca = valorContado - valorEsperado

    // Buscar contagem de transações (simples query para performance)
    const vendasCountQuery = `SELECT COUNT(*) as total_transacoes FROM vendas WHERE caixa_id = ?`
    const vendas = await executeQuery(vendasCountQuery, [caixaId]) as any[]
    const totalTransacoes = vendas[0]?.total_transacoes || 0
    
    const resumo = {
      id: caixa.id,
      data_abertura: caixa.data_abertura,
      data_fechamento: caixa.data_fechamento,
      status: caixa.status,
      operador_abertura: caixa.operador_abertura,
      operador_fechamento: caixa.operador_fechamento,
      valores: {
        inicial: valorInicial,
        vendas: totalVendas,
        vendas_dinheiro: totalDinheiro,
        suprimentos: totalSuprimentos,
        sangrias: totalSangrias,
        esperado: valorEsperado,
        contado: valorContado,
        diferenca: diferenca
      },
      vendas: {
        total_transacoes: totalTransacoes,
        valor_total: totalVendas,
        valor_dinheiro: totalDinheiro,
        valor_cartao_debito: totalCartaoDebito,
        valor_cartao_credito: totalCartaoCredito,
        valor_pix: totalPix,
        valor_fiado: totalFiado
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
