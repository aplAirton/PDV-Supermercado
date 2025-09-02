import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caixaId = params.id
    
    // Buscar detalhes do caixa
    const caixaQuery = `
      SELECT 
        c.*,
        f_abertura.nome as funcionario_nome,
        f_fechamento.nome as funcionario_fechamento_nome
      FROM caixas c
      LEFT JOIN funcionarios f_abertura ON c.funcionario_abertura_id = f_abertura.id
      LEFT JOIN funcionarios f_fechamento ON c.funcionario_fechamento_id = f_fechamento.id
      WHERE c.id = ?
    `
    
    const caixa = await executeQuery(caixaQuery, [caixaId]) as any[]
    
    if (caixa.length === 0) {
      return NextResponse.json(
        { error: 'Caixa não encontrado' },
        { status: 404 }
      )
    }
    
    // Buscar movimentações do caixa
    const movimentacoesQuery = `
      SELECT * FROM caixa_movimentacoes 
      WHERE caixa_id = ? 
      ORDER BY data_movimentacao DESC
    `
    
    const movimentacoes = await executeQuery(movimentacoesQuery, [caixaId])
    
    return NextResponse.json({
      caixa: caixa[0],
      movimentacoes
    })
  } catch (error) {
    console.error('Erro ao buscar detalhes do caixa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caixaId = params.id
    const data = await request.json()
    const { acao, valor, observacoes } = data
    
    if (acao === 'fechar') {
      // Fechar caixa
      const updateQuery = `
        UPDATE caixas 
        SET 
          status = 'fechado',
          data_fechamento = NOW(),
          observacoes_fechamento = ?
        WHERE id = ? AND status = 'aberto'
      `
      
      const result = await executeQuery(updateQuery, [observacoes, caixaId]) as any
      
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: 'Caixa não encontrado ou já fechado' },
          { status: 400 }
        )
      }
      
      return NextResponse.json({ success: true, message: 'Caixa fechado com sucesso' })
    } else if (acao === 'movimentacao') {
      // Adicionar movimentação (sangria, suprimento, etc.)
      const { tipo, descricao } = data
      
      if (tipo === 'sangria') {
        // Para sangrias, usar tabela específica e atualizar total
        
        // 1. Inserir registro na tabela caixa_sangrias
        const insertSangriaQuery = `
          INSERT INTO caixa_sangrias (
            caixa_id, 
            valor, 
            descricao
          ) VALUES (?, ?, ?)
        `
        
        await executeQuery(insertSangriaQuery, [caixaId, valor, descricao || 'Sangria do caixa'])
        
        // 2. Atualizar total_sangrias na tabela caixas
        const updateTotalQuery = `
          UPDATE caixas 
          SET total_sangrias = COALESCE(total_sangrias, 0) + ?
          WHERE id = ?
        `
        
        await executeQuery(updateTotalQuery, [valor, caixaId])
        
        return NextResponse.json({ 
          success: true, 
          message: `Sangria de R$ ${parseFloat(valor).toFixed(2)} registrada com sucesso` 
        })
        
      } else {
        // Para outras movimentações, usar tabela caixa_movimentacoes
        const insertQuery = `
          INSERT INTO caixa_movimentacoes (
            caixa_id, 
            tipo, 
            valor, 
            descricao
          ) VALUES (?, ?, ?, ?)
        `
        
        await executeQuery(insertQuery, [caixaId, tipo, valor, descricao])
        
        return NextResponse.json({ 
          success: true, 
          message: 'Movimentação registrada com sucesso' 
        })
      }
    } else {
      return NextResponse.json(
        { error: 'Ação não reconhecida' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro na operação do caixa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caixaId = params.id
    const data = await request.json()
    
    if (!caixaId) {
      return NextResponse.json(
        { error: 'ID do caixa é obrigatório' },
        { status: 400 }
      )
    }
    
    // Buscar caixa atual
    const caixaQuery = `
      SELECT * FROM caixas WHERE id = ? AND status = 'aberto'
      LIMIT 1
    `
    const caixas = await executeQuery(caixaQuery, [caixaId]) as any[]
    
    if (caixas.length === 0) {
      return NextResponse.json(
        { error: 'Caixa não encontrado ou já fechado' },
        { status: 404 }
      )
    }
    
    const caixa = caixas[0]
    
    if (data.status === 'fechado') {
      // Calcular totais de vendas do caixa
      const vendasQuery = `
        SELECT 
          COALESCE(SUM(total), 0) as total_vendas,
          COALESCE(SUM(valor_dinheiro), 0) as total_dinheiro,
          COALESCE(SUM(valor_cartao_debito), 0) as total_cartao_debito,
          COALESCE(SUM(valor_cartao_credito), 0) as total_cartao_credito,
          COALESCE(SUM(valor_pix), 0) as total_pix,
          COALESCE(SUM(valor_fiado), 0) as total_fiado
        FROM vendas 
        WHERE caixa_id = ?
      `
      const vendas = await executeQuery(vendasQuery, [caixaId]) as any[]
      const totaisVendas = vendas[0] || {}
      
      // Buscar totais de movimentações (suprimentos)
      const movimentacoesQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'suprimento' THEN valor ELSE 0 END), 0) as total_suprimentos
        FROM caixa_movimentacoes 
        WHERE caixa_id = ?
      `
      const movimentacoes = await executeQuery(movimentacoesQuery, [caixaId]) as any[]
      const totaisMovimentacoes = movimentacoes[0] || {}
      
      // Buscar total de sangrias da nova tabela específica
      const sangriasQuery = `
        SELECT COALESCE(SUM(valor), 0) as total_sangrias_tabela
        FROM caixa_sangrias 
        WHERE caixa_id = ?
      `
      const sangriasResult = await executeQuery(sangriasQuery, [caixaId]) as any[]
      const totalSangriasCalculado = sangriasResult[0]?.total_sangrias_tabela || 0
      
      // Usar o valor da tabela caixas (que já é atualizado) ou calcular da tabela específica
      const caixaAtual = await executeQuery('SELECT total_sangrias FROM caixas WHERE id = ?', [caixaId]) as any[]
      const totalSangriasFromCaixa = parseFloat(caixaAtual[0]?.total_sangrias || 0)
      const totalSangriasFinal = Math.max(totalSangriasFromCaixa, totalSangriasCalculado)
      
      // Atualizar caixa com fechamento
      const updateQuery = `
        UPDATE caixas SET
          status = 'fechado',
          data_fechamento = CURRENT_TIMESTAMP,
          funcionario_fechamento_id = ?,
          valor_contado_dinheiro = ?,
          observacoes_fechamento = ?,
          total_vendas = ?,
          total_dinheiro = ?,
          total_cartao_debito = ?,
          total_cartao_credito = ?,
          total_pix = ?,
          total_fiado = ?,
          total_suprimentos = ?,
          total_sangrias = ?,
          diferenca_caixa = ?,
          status_reconciliacao = ?,
          valor_final = ?
        WHERE id = ?
      `
      
      const valorFinal = parseFloat(data.valor_contado_dinheiro || 0)
      
      await executeQuery(updateQuery, [
        caixa.funcionario_id, // funcionário que está fechando
        data.valor_contado_dinheiro || 0,
        data.observacoes_fechamento || '',
        totaisVendas.total_vendas || 0,
        totaisVendas.total_dinheiro || 0,
        totaisVendas.total_cartao_debito || 0,
        totaisVendas.total_cartao_credito || 0,
        totaisVendas.total_pix || 0,
        totaisVendas.total_fiado || 0,
        totaisMovimentacoes.total_suprimentos || 0,
        totalSangriasFinal,
        data.diferenca_caixa || 0,
        data.status_reconciliacao || null,
        valorFinal,
        caixaId
      ])
    } else {
      // Atualização geral do caixa
      const updateFields: string[] = []
      const updateValues: any[] = []
      
      Object.keys(data).forEach(key => {
        if (key !== 'id') {
          updateFields.push(`${key} = ?`)
          updateValues.push(data[key])
        }
      })
      
      if (updateFields.length === 0) {
        return NextResponse.json(
          { error: 'Nenhum campo para atualizar' },
          { status: 400 }
        )
      }
      
      const updateQuery = `UPDATE caixas SET ${updateFields.join(', ')} WHERE id = ?`
      updateValues.push(caixaId)
      
      await executeQuery(updateQuery, updateValues)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar caixa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
