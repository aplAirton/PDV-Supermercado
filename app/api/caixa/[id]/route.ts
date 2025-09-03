import { type NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const caixaId = id
    
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
      SELECT * FROM caixa_movimentacoes_financeiras 
      WHERE caixa_id = ? 
      ORDER BY data_criacao DESC
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
    const { id } = await params
    const caixaId = id
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
        
        // 1. Inserir registro na tabela caixa_movimentacoes_financeiras
        const insertSangriaQuery = `
          INSERT INTO caixa_movimentacoes_financeiras (
            caixa_id, 
            valor, 
            descricao,
            tipo
          ) VALUES (?, ?, ?, 'sangria')
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
        // Para outras movimentações, usar tabela caixa_movimentacoes_financeiras
        const insertQuery = `
          INSERT INTO caixa_movimentacoes_financeiras (
            caixa_id, 
            valor, 
            descricao,
            tipo
          ) VALUES (?, ?, ?, ?)
        `
        
        await executeQuery(insertQuery, [caixaId, valor, descricao, tipo])
        
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
    const { id } = await params
    const caixaId = id
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
      
      // Buscar totais de movimentações financeiras (sangrias e suprimentos)
      const movimentacoesQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'suprimento' THEN valor ELSE 0 END), 0) as total_suprimentos,
          COALESCE(SUM(CASE WHEN tipo = 'sangria' THEN valor ELSE 0 END), 0) as total_sangrias
        FROM caixa_movimentacoes_financeiras 
        WHERE caixa_id = ?
      `
      const movimentacoes = await executeQuery(movimentacoesQuery, [caixaId]) as any[]
      const totaisMovimentacoes = movimentacoes[0] || {}
      
      const totalSangriasCalculado = totaisMovimentacoes.total_sangrias || 0
      const totalSuprimentosCalculado = totaisMovimentacoes.total_suprimentos || 0
      
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
        totalSuprimentosCalculado,
        totalSangriasCalculado,
        data.diferenca_caixa || 0,
        data.status_reconciliacao || null,
        valorFinal,
        caixaId
      ])
    } else if (data.acao === 'movimentacao_financeira' || data.acao === 'movimentacao') {
      // Movimentações financeiras (sangria, suprimento)
      const { tipo, valor, descricao } = data
      
      if (!tipo || !valor) {
        return NextResponse.json(
          { error: 'Tipo e valor são obrigatórios para movimentações' },
          { status: 400 }
        )
      }
      
      if (tipo === 'sangria' || tipo === 'suprimento') {
        // Ambos sangria e suprimento usam a mesma tabela caixa_movimentacoes_financeiras
        const insertMovimentacaoQuery = `
          INSERT INTO caixa_movimentacoes_financeiras (
            caixa_id, 
            valor, 
            descricao,
            tipo
          ) VALUES (?, ?, ?, ?)
        `
        
        await executeQuery(insertMovimentacaoQuery, [
          caixaId, 
          valor, 
          descricao || `${tipo === 'sangria' ? 'Sangria do caixa' : 'Suprimento ao caixa'}`,
          tipo
        ])
        
        // Atualizar totais na tabela caixas
        if (tipo === 'sangria') {
          const updateTotalQuery = `
            UPDATE caixas 
            SET total_sangrias = COALESCE(total_sangrias, 0) + ?
            WHERE id = ?
          `
          await executeQuery(updateTotalQuery, [valor, caixaId])
        } else {
          const updateTotalQuery = `
            UPDATE caixas 
            SET total_suprimentos = COALESCE(total_suprimentos, 0) + ?
            WHERE id = ?
          `
          await executeQuery(updateTotalQuery, [valor, caixaId])
        }
      } else {
        return NextResponse.json(
          { error: 'Tipo de movimentação não reconhecido' },
          { status: 400 }
        )
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `${tipo === 'sangria' ? 'Sangria' : 'Suprimento'} de R$ ${parseFloat(valor).toFixed(2)} registrada com sucesso` 
      })
    } else {
      // Atualização geral do caixa (apenas para campos válidos)
      const updateFields: string[] = []
      const updateValues: any[] = []
      
      // Lista de campos válidos da tabela caixas
      const camposValidos = [
        'status', 'data_fechamento', 'funcionario_fechamento_id', 
        'valor_contado_dinheiro', 'observacoes_fechamento', 'total_vendas',
        'total_dinheiro', 'total_cartao_debito', 'total_cartao_credito',
        'total_pix', 'total_fiado', 'total_suprimentos', 'total_sangrias',
        'diferenca_caixa', 'status_reconciliacao', 'valor_final'
      ]
      
      Object.keys(data).forEach(key => {
        if (key !== 'id' && camposValidos.includes(key)) {
          updateFields.push(`${key} = ?`)
          updateValues.push(data[key])
        }
      })
      
      if (updateFields.length === 0) {
        return NextResponse.json(
          { error: 'Nenhum campo válido para atualizar' },
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
