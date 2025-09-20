import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET() {
  try {
    const pagamentos = await executeQuery(`
      SELECT
        pf.*,
        f.nome as fornecedor_nome,
        f.cnpj as fornecedor_cnpj
      FROM pagamentos_fornecedor pf
      JOIN fornecedores f ON pf.fornecedor_id = f.id
      ORDER BY pf.data_pagamento DESC
    `)
    return NextResponse.json(pagamentos)
  } catch (error) {
    console.error("Erro ao buscar pagamentos de fornecedores:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('[PAGAMENTO API] Iniciando processamento de pagamento...')
  
  try {
    const payload = await request.json()
    console.log('[PAGAMENTO API] Payload recebido:', payload)
    
    const { fornecedor_id, valor_total, forma_pagamento, descricao, afeta_caixa = true } = payload

    // Validações básicas
    if (!fornecedor_id || fornecedor_id <= 0) {
      console.log('[PAGAMENTO API] Erro: ID do fornecedor inválido')
      return NextResponse.json({ error: 'ID do fornecedor é obrigatório' }, { status: 400 })
    }

    if (!valor_total || parseFloat(valor_total) <= 0) {
      console.log('[PAGAMENTO API] Erro: Valor inválido')
      return NextResponse.json({ error: 'Valor do pagamento deve ser maior que zero' }, { status: 400 })
    }

    if (!forma_pagamento || !['dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'transferencia', 'cheque'].includes(forma_pagamento)) {
      console.log('[PAGAMENTO API] Erro: Forma de pagamento inválida')
      return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 })
    }

    console.log('[PAGAMENTO API] Validações básicas OK')

    // Verificar se fornecedor existe
    const fornecedorExistente = await executeQuery("SELECT id, nome FROM fornecedores WHERE id = ?", [fornecedor_id]) as any
    if (fornecedorExistente.length === 0) {
      console.log('[PAGAMENTO API] Erro: Fornecedor não encontrado')
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 })
    }

    console.log('[PAGAMENTO API] Fornecedor encontrado:', fornecedorExistente[0].nome)

    // Validar saldo disponível quando usar dinheiro do caixa (apenas informativo)
    if (afeta_caixa && forma_pagamento === 'dinheiro') {
      try {
        // Consultar saldo disponível diretamente do banco
        const saldoQuery = `
          SELECT 
            COALESCE(SUM(CASE WHEN categoria = 'venda_produto' AND tipo = 'entrada' THEN valor ELSE 0 END), 0) as total_dinheiro,
            COALESCE((SELECT valor_inicial FROM caixas WHERE status = 'aberto' ORDER BY data_abertura DESC LIMIT 1), 0) as valor_inicial
          FROM movimentacoes_financeiras 
          WHERE forma_pagamento = 'dinheiro' 
          AND DATE(data_movimento) = CURDATE()
        `
        const saldoResult = await executeQuery(saldoQuery) as any[]
        
        if (saldoResult.length > 0) {
          const { total_dinheiro, valor_inicial } = saldoResult[0]
          const saldoDisponivel = (parseFloat(total_dinheiro) || 0) - (parseFloat(valor_inicial) || 0)
          const valorPagamento = parseFloat(valor_total)
          
          console.log(`[PAGAMENTO API] Saldo disponível: R$ ${saldoDisponivel.toFixed(2)}, Valor pagamento: R$ ${valorPagamento.toFixed(2)}`)
          
          // Removida a validação restritiva - permitir pagamento mesmo com saldo insuficiente
          // pois o frontend já validou e o usuário confirmou
        }
      } catch (saldoError) {
        console.error('Erro ao verificar saldo:', saldoError)
        // Continua com o pagamento se não conseguir verificar o saldo
        console.warn('Não foi possível verificar o saldo, processando pagamento sem validação')
      }
    }

    try {
      // Buscar caixa aberto atual (para associar ao pagamento se afetar caixa)
      let caixaId = null
      if (afeta_caixa) {
        const caixaAbertoQuery = `
          SELECT id FROM caixas
          WHERE status = 'aberto'
          ORDER BY data_abertura DESC
          LIMIT 1
        `
        const caixasAbertos = await executeQuery(caixaAbertoQuery) as any[]
        if (caixasAbertos.length > 0) {
          caixaId = caixasAbertos[0].id
        }
      }

      // Inserir pagamento
      console.log('[PAGAMENTO API] Inserindo pagamento na tabela...')
      const result = await executeQuery(
        `INSERT INTO pagamentos_fornecedor
         (fornecedor_id, caixa_id, valor_pagamento, forma_pagamento, observacoes, afeta_caixa, data_pagamento, status)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), 'pago')`,
        [fornecedor_id, caixaId, parseFloat(valor_total), forma_pagamento, descricao?.trim() || null, afeta_caixa]
      )

      console.log('[PAGAMENTO API] Pagamento inserido com ID:', (result as any).insertId)

      // Registrar na tabela geral de movimentações financeiras
      // Se afeta_caixa = true, registra como 'sangria' (saída do caixa)
      // Se afeta_caixa = false, registra como 'pagamento_fornecedor' (apenas histórico)
      const categoriaMovimento = afeta_caixa ? 'sangria' : 'pagamento_fornecedor';
      const tipoMovimento = afeta_caixa ? 'saida' : 'saida'; // ambos são saídas, mas sangria afeta caixa

      console.log('[PAGAMENTO API] Registrando movimentação financeira...', { categoriaMovimento, tipoMovimento, afeta_caixa })
      await executeQuery(
        "INSERT INTO movimentacoes_financeiras (tipo, categoria, valor, descricao, referencia, entidade_tipo, entidade_id, forma_pagamento, data_movimento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
        [tipoMovimento, categoriaMovimento, parseFloat(valor_total), `Pagamento fornecedor - ${fornecedorExistente[0]?.nome || 'Fornecedor'}`, `Pagamento fornecedor #${(result as any).insertId}`, 'fornecedor', fornecedor_id, forma_pagamento]
      )

      console.log('[PAGAMENTO API] Movimentação financeira registrada')

      // Verificar se há fundos suficientes no caixa (apenas para pagamentos em dinheiro E quando afeta_caixa = true)
      // Para pagamentos de fornecedor como sangria, permitimos saldo negativo pois é uma operação válida
      if (forma_pagamento === 'dinheiro' && afeta_caixa) {
        console.log('[PAGAMENTO API] Processando sangria do caixa...')
        try {
          // Buscar caixa aberto atual
          const caixaAbertoQuery = `
            SELECT id, total_sangrias
            FROM caixas
            WHERE status = 'aberto'
            ORDER BY data_abertura DESC
            LIMIT 1
          `
          const caixasAbertos = await executeQuery(caixaAbertoQuery) as any[]

          if (caixasAbertos.length > 0) {
            const caixaId = caixasAbertos[0].id
            console.log('[PAGAMENTO API] Caixa aberto encontrado:', caixaId)

            // Registrar saída no caixa (sangria) associada ao caixa aberto
            await executeQuery(
              "INSERT INTO caixa_movimentacoes_financeiras (caixa_id, tipo, valor, descricao) VALUES (?, ?, ?, ?)",
              [caixaId, 'sangria', parseFloat(valor_total), `Pagamento fornecedor - ${fornecedorExistente[0]?.nome || 'Fornecedor'}`]
            )

            console.log('[PAGAMENTO API] Movimentação do caixa registrada')

            // Atualizar total_sangrias na tabela caixas
            const updateResult = await executeQuery(
              "UPDATE caixas SET total_sangrias = COALESCE(total_sangrias, 0) + ? WHERE id = ?",
              [parseFloat(valor_total), caixaId]
            )

            console.log('[PAGAMENTO API] Total_sangrias atualizado:', {
              valor: parseFloat(valor_total),
              caixaId: caixaId,
              affectedRows: (updateResult as any).affectedRows
            })

            console.log(`[PAGAMENTO API] Sangria de R$ ${parseFloat(valor_total).toFixed(2)} registrada no caixa ${caixaId}`)
          } else {
            console.warn('[PAGAMENTO API] Nenhum caixa aberto encontrado para registrar sangria de pagamento de fornecedor')
            // Registrar sem caixa_id para não perder a informação
            await executeQuery(
              "INSERT INTO caixa_movimentacoes_financeiras (caixa_id, tipo, valor, descricao) VALUES (?, ?, ?, ?)",
              [null, 'sangria', parseFloat(valor_total), `Pagamento fornecedor - ${fornecedorExistente[0]?.nome || 'Fornecedor'}`]
            )
          }
        } catch (caixaError) {
          // Se houver erro com o caixa, registrar apenas o pagamento sem validação de saldo
          console.error('[PAGAMENTO API] Erro no sistema de caixa:', caixaError)
          console.warn('Sistema de caixa não configurado, registrando pagamento sem validação de saldo:', caixaError)
          // Não retorna erro, apenas registra o pagamento normalmente
        }
      } else {
        console.log('[PAGAMENTO API] Pagamento não afeta caixa ou não é em dinheiro - pulando sangria')
      }

      console.log('[PAGAMENTO API] Pagamento processado com sucesso!')
      return NextResponse.json({
        success: true,
        id: (result as any).insertId,
        message: 'Pagamento registrado com sucesso'
      })
    } catch (err: any) {
      console.error('Erro ao registrar pagamento:', err)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}