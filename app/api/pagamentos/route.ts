import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cliente_id, pagamentos } = body

    if (!cliente_id) return NextResponse.json({ error: "cliente_id é obrigatório" }, { status: 400 })
    if (!Array.isArray(pagamentos) || pagamentos.length === 0) return NextResponse.json({ error: "pagamentos inválidos" }, { status: 400 })

    // Normalizar pagamentos: aceitar 'tipo' ou 'tipo_pagamento' e garantir valor numérico
    const pagamentosNorm = pagamentos.map((p: any) => ({
      tipo: p?.tipo_pagamento || p?.tipo || null,
      valor: Math.round(((Number.parseFloat(p?.valor) || 0) + Number.EPSILON) * 100) / 100,
    }))

    // Somar apenas pagamentos válidos (exclui tipo fiado por segurança)
    const soma = pagamentosNorm.reduce((s: number, p: any) => {
      if (!p || !p.tipo) return s
      if (p.tipo === 'fiado') return s
      return s + (Number(p.valor) || 0)
    }, 0)

    const somaArred = Math.round((soma + Number.EPSILON) * 100) / 100

    // Buscar fiados abertos do cliente, ordenados por data (FIFO)
    const fiados: any = await executeQuery("SELECT * FROM fiados WHERE cliente_id = ? AND status IN ('aberto','parcial') ORDER BY data_fiado ASC", [cliente_id])

    let restanteParaAplicar = somaArred
    const pagamentosAplicados: any[] = []

    // Aplicar pagamentos em ordem nos fiados
    for (const fiado of fiados) {
      if (restanteParaAplicar <= 0) break

      const valorRestanteFiado = Number(fiado.valor_restante || fiado.valor_original - (fiado.valor_pago || 0))
      if (valorRestanteFiado <= 0) continue

      const aplicar = Math.min(valorRestanteFiado, restanteParaAplicar)

      // Inserir registro em pagamentos_fiado — usamos o primeiro tipo válido recebido ou 'dinheiro'
      const tipoPagamentoParaInserir = (pagamentosNorm.find((pp: any) => pp && pp.tipo && pp.tipo !== 'fiado') || { tipo: 'dinheiro' }).tipo
      await executeQuery(
        "INSERT INTO pagamentos_fiado (fiado_id, valor_pagamento, forma_pagamento, observacoes, data_pagamento) VALUES (?, ?, ?, ?, NOW())",
        [fiado.id, aplicar, tipoPagamentoParaInserir, 'Pagamento via módulo'],
      )

      // Atualizar fiado: valor_pago e valor_restante e status
      const novoValorPago = Math.round(((Number(fiado.valor_pago || 0) + aplicar) + Number.EPSILON) * 100) / 100
      const novoValorRestante = Math.round(((Number(fiado.valor_restante || (fiado.valor_original - (fiado.valor_pago || 0))) - aplicar) + Number.EPSILON) * 100) / 100
      const novoStatus = novoValorRestante <= 0 ? 'quitado' : 'parcial'

      await executeQuery(
        "UPDATE fiados SET valor_pago = ?, valor_restante = ?, status = ? WHERE id = ?",
        [novoValorPago, novoValorRestante, novoStatus, fiado.id],
      )

      pagamentosAplicados.push({ fiado_id: fiado.id, valor: aplicar })

      restanteParaAplicar = Math.round(((restanteParaAplicar - aplicar) + Number.EPSILON) * 100) / 100
    }

    // Atualizar debito_atual do cliente subtraindo o total pago (somaArred)
    const rows: any = await executeQuery("SELECT debito_atual FROM clientes WHERE id = ?", [cliente_id])
    if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    const atual = Number(rows[0].debito_atual || 0)
    const novoDebito = Math.max(0, Math.round(((atual - somaArred) + Number.EPSILON) * 100) / 100)
    await executeQuery("UPDATE clientes SET debito_atual = ? WHERE id = ?", [novoDebito, cliente_id])

    const totalAplicado = somaArred - restanteParaAplicar
    return NextResponse.json({ success: true, debito_anterior: atual, debito_atual: novoDebito, aplicado: totalAplicado, restante_nao_aplicado: restanteParaAplicar, detalhes: pagamentosAplicados })
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
