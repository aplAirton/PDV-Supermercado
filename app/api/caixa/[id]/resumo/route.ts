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
    
    // Buscar valores de suprimentos e sangrias da tabela caixa_movimentacoes_financeiras
    const movimentacoesQuery = `
      SELECT
        tipo,
        SUM(valor) as total
      FROM caixa_movimentacoes_financeiras
      WHERE caixa_id = ?
      GROUP BY tipo
    `
    const movimentacoes = await executeQuery(movimentacoesQuery, [caixaId]) as any[]
    
    // Calcular totais de suprimentos e sangrias
    let totalSuprimentosMov = 0
    let totalSangriasMov = 0
    
    movimentacoes.forEach((mov: any) => {
      if (mov.tipo === 'suprimento' || mov.tipo === 'aporte') {
        totalSuprimentosMov += parseFloat(mov.total || 0)
      } else if (mov.tipo === 'sangria') {
        totalSangriasMov += parseFloat(mov.total || 0)
      }
    })
    
    // Usar valores diretos da tabela caixas (atualizados por triggers)
    const valorInicial = parseFloat(caixa.valor_inicial || 0)
    const totalVendas = parseFloat(caixa.total_vendas || 0)
    const totalDinheiro = parseFloat(caixa.total_dinheiro || 0)
    const totalCartaoDebito = parseFloat(caixa.total_cartao_debito || 0)
    const totalCartaoCredito = parseFloat(caixa.total_cartao_credito || 0)
    const totalPix = parseFloat(caixa.total_pix || 0)
    const totalFiado = parseFloat(caixa.total_fiado || 0)
    
    // Usar valores calculados das movimentações
    const totalSuprimentos = totalSuprimentosMov
    const totalSangrias = totalSangriasMov

    // Buscar total de pagamentos a fornecedores que afetam o caixa (através das movimentações)
    // Pagamentos a fornecedores são registrados como 'sangria' quando afetam_caixa = true
    const pagamentosFornecedorQuery = `
      SELECT COALESCE(SUM(mf.valor), 0) as total
      FROM movimentacoes_financeiras mf
      WHERE mf.categoria = 'sangria'
        AND mf.referencia LIKE 'Pagamento fornecedor%'
        AND mf.data_movimento >= (SELECT c.data_abertura FROM caixas c WHERE c.id = ?)
        AND mf.data_movimento <= COALESCE((SELECT c.data_fechamento FROM caixas c WHERE c.id = ?), NOW())
    `
    const pagamentosFornecedor = await executeQuery(pagamentosFornecedorQuery, [caixaId, caixaId]) as any[]
    const totalPagamentosFornecedor = parseFloat(pagamentosFornecedor[0]?.total || 0)

    // DEBUG: Verificar se os campos existem na tabela
    console.log(`[caixa-resumo][${caixaId}] DEBUG - Campos da tabela caixas:`, {
      camposDisponiveis: Object.keys(caixa),
      total_suprimentos: {
        valor: caixa.total_suprimentos,
        tipo: typeof caixa.total_suprimentos,
        convertido: totalSuprimentos
      },
      total_sangrias: {
        valor: caixa.total_sangrias,
        tipo: typeof caixa.total_sangrias,
        convertido: totalSangrias
      },
      totalPagamentosFornecedor,
      todosCampos: caixa
    })

    // Log para debug
    console.log(`[caixa-resumo][${caixaId}] Valores do caixa:`, {
      valorInicial,
      totalDinheiro,
      totalSuprimentos,
      totalSangrias,
      totalPagamentosFornecedor,
      totalVendas
    })

    // Valor esperado no caixa (dinheiro físico total)
    // Cálculo: valor inicial + vendas em dinheiro + suprimentos - sangrias - pagamentos a fornecedores
    const valorEsperado = valorInicial + totalDinheiro + totalSuprimentos - totalSangrias - totalPagamentosFornecedor

    console.log(`[caixa-resumo][${caixaId}] Valor esperado calculado:`, valorEsperado, `(inicial: ${valorInicial} + dinheiro: ${totalDinheiro} + suprimentos: ${totalSuprimentos} - sangrias: ${totalSangrias} - pagamentos_fornecedor: ${totalPagamentosFornecedor})`)
    
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
        pagamentos_fornecedor: totalPagamentosFornecedor,
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
