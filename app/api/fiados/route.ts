import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET() {
  try {
    // Retorna registros de fiados (abertos/parciais) com informações do cliente e venda
    const rows: any = await executeQuery(
      `
      SELECT f.id, f.venda_id, f.cliente_id, c.nome AS cliente_nome,
             f.valor_original, f.valor_pago, f.valor_restante, f.status, f.data_fiado,
             v.total AS venda_total, v.observacoes AS descricao
      FROM fiados f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      LEFT JOIN vendas v ON f.venda_id = v.id
      WHERE f.status IN ('aberto','parcial')
      ORDER BY f.data_fiado DESC
      LIMIT 500
      `,
      [],
    )

    return NextResponse.json(Array.isArray(rows) ? rows : [])
  } catch (error) {
    console.error('Erro ao listar fiados:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
