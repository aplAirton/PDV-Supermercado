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
  try {
    const payload = await request.json()
    const { fornecedor_id, valor_total, forma_pagamento, descricao, afeta_caixa = true } = payload

    // Validações básicas
    if (!fornecedor_id || fornecedor_id <= 0) {
      return NextResponse.json({ error: 'ID do fornecedor é obrigatório' }, { status: 400 })
    }

    if (!valor_total || parseFloat(valor_total) <= 0) {
      return NextResponse.json({ error: 'Valor do pagamento deve ser maior que zero' }, { status: 400 })
    }

    if (!forma_pagamento || !['dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'transferencia', 'cheque'].includes(forma_pagamento)) {
      return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 })
    }

    // Verificar se fornecedor existe
    const fornecedorExistente = await executeQuery("SELECT id FROM fornecedores WHERE id = ?", [fornecedor_id]) as any
    if (fornecedorExistente.length === 0) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 })
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
      const result = await executeQuery(
        `INSERT INTO pagamentos_fornecedor
         (fornecedor_id, caixa_id, valor_pagamento, forma_pagamento, observacoes, afeta_caixa, data_pagamento, status)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), 'pago')`,
        [fornecedor_id, caixaId, parseFloat(valor_total), forma_pagamento, descricao?.trim() || null, afeta_caixa]
      )

      // Registrar na tabela geral de movimentações financeiras
      // Se afeta_caixa = true, registra como 'sangria' (saída do caixa)
      // Se afeta_caixa = false, registra como 'pagamento_fornecedor' (apenas histórico)
      const categoriaMovimento = afeta_caixa ? 'sangria' : 'pagamento_fornecedor';
      const tipoMovimento = afeta_caixa ? 'saida' : 'saida'; // ambos são saídas, mas sangria afeta caixa

      await executeQuery(
        "INSERT INTO movimentacoes_financeiras (tipo, categoria, valor, descricao, referencia, entidade_tipo, entidade_id, forma_pagamento, data_movimento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
        [tipoMovimento, categoriaMovimento, parseFloat(valor_total), `Pagamento fornecedor - ${fornecedorExistente[0]?.nome || 'Fornecedor'}`, `Pagamento fornecedor #${(result as any).insertId}`, 'fornecedor', fornecedor_id, forma_pagamento]
      )

      // Verificar se há fundos suficientes no caixa (apenas para pagamentos em dinheiro E quando afeta_caixa = true)
      // Para pagamentos de fornecedor como sangria, permitimos saldo negativo pois é uma operação válida
      if (forma_pagamento === 'dinheiro' && afeta_caixa) {
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

            // Registrar saída no caixa (sangria) associada ao caixa aberto
            await executeQuery(
              "INSERT INTO caixa_movimentacoes_financeiras (caixa_id, tipo, valor, descricao, data_movimentacao) VALUES (?, ?, ?, ?, NOW())",
              [caixaId, 'sangria', parseFloat(valor_total), `Pagamento fornecedor - ${fornecedorExistente[0]?.nome || 'Fornecedor'}`]
            )

            // Atualizar total_sangrias na tabela caixas
            await executeQuery(
              "UPDATE caixas SET total_sangrias = COALESCE(total_sangrias, 0) + ? WHERE id = ?",
              [parseFloat(valor_total), caixaId]
            )

            console.log(`Sangria de R$ ${parseFloat(valor_total).toFixed(2)} registrada no caixa ${caixaId}`)
          } else {
            console.warn('Nenhum caixa aberto encontrado para registrar sangria de pagamento de fornecedor')
            // Registrar sem caixa_id para não perder a informação
            await executeQuery(
              "INSERT INTO caixa_movimentacoes_financeiras (caixa_id, tipo, valor, descricao, data_movimentacao) VALUES (?, ?, ?, ?, NOW())",
              [null, 'sangria', parseFloat(valor_total), `Pagamento fornecedor - ${fornecedorExistente[0]?.nome || 'Fornecedor'}`]
            )
          }
        } catch (caixaError) {
          // Se houver erro com o caixa, registrar apenas o pagamento sem validação de saldo
          console.warn('Sistema de caixa não configurado, registrando pagamento sem validação de saldo:', caixaError)
          // Não retorna erro, apenas registra o pagamento normalmente
        }
      }

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