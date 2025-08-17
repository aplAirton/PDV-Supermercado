import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const q = url.searchParams.get("q")?.trim() || ""
    const mode = url.searchParams.get("mode") || "search" // search | all | exact
    const limitParam = url.searchParams.get("limit")
    const limit = limitParam ? Math.max(1, Math.min(50, Number.parseInt(limitParam, 10) || 10)) : 10

    console.log(`[PRODUTOS API] Mode: ${mode}, Query: "${q}", Limit: ${limit}`)

    // Modo ALL - retorna todos os produtos (para gerenciamento)
    if (mode === "all") {
      console.time("produtos-all")
      const produtos = await executeQuery(`
        SELECT id, codigo_barras, nome, categoria, preco, estoque, estoque_minimo, ativo 
        FROM produtos 
        ORDER BY nome ASC
      `)
      console.timeEnd("produtos-all")
      console.log(`[PRODUTOS] Retornados ${Array.isArray(produtos) ? produtos.length : 0} produtos (modo ALL)`)
      return NextResponse.json(produtos)
    }

    // Modo EXACT - busca exata por código de barras ou nome completo
    if (mode === "exact" && q) {
      console.time("produtos-exact")
      const produtos = await executeQuery(`
        SELECT id, codigo_barras, nome, preco, estoque, categoria 
        FROM produtos 
        WHERE ativo = 1 AND (codigo_barras = ? OR LOWER(nome) = LOWER(?))
        ORDER BY 
          CASE WHEN codigo_barras = ? THEN 1 ELSE 2 END,
          nome ASC
      `, [q, q, q])
      console.timeEnd("produtos-exact")
      console.log(`[PRODUTOS] Busca exata para "${q}": ${Array.isArray(produtos) ? produtos.length : 0} resultados`)
      return NextResponse.json(produtos)
    }

    // Modo SEARCH - busca parcial (padrão)
    if (!q || q.length < 2) {
      console.log(`[PRODUTOS] Query muito curta: "${q}" (mínimo 2 caracteres)`)
      return NextResponse.json([])
    }

    console.time("produtos-search")

    // Busca inteligente: prioriza código de barras exato, depois código parcial, depois nome
    // OBS: injetamos LIMIT diretamente (limit foi validado) para evitar problemas com prepared statements
    const searchQuery = `
      SELECT id, codigo_barras, nome, preco, estoque, categoria,
        CASE 
          WHEN codigo_barras = ? THEN 1
          WHEN codigo_barras LIKE ? THEN 2
          WHEN LOWER(nome) LIKE LOWER(?) THEN 3
          ELSE 4
        END as relevancia
      FROM produtos 
      WHERE ativo = 1 AND (
        codigo_barras LIKE ? OR 
        LOWER(nome) LIKE LOWER(?)
      )
      ORDER BY relevancia ASC, nome ASC
      LIMIT ${limit}
    `

    const likePattern = `%${q}%`
    const produtos = await executeQuery(searchQuery, [
      q,           // código exato
      `${q}%`,     // código começando com
      likePattern, // nome contendo (para CASE)
      likePattern, // código contendo (WHERE)
      likePattern, // nome contendo (WHERE)
    ])

    console.timeEnd("produtos-search")
    console.log(`[PRODUTOS] Busca para "${q}": ${Array.isArray(produtos) ? produtos.length : 0} resultados`)

    return NextResponse.json(produtos)
    
  } catch (error) {
    console.error("[PRODUTOS API] Erro:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, preco, categoria, estoque, codigo_barras } = await request.json()

    const result = await executeQuery(
      "INSERT INTO produtos (nome, preco, categoria, estoque, codigo_barras) VALUES (?, ?, ?, ?, ?)",
      [nome, preco, categoria, estoque, codigo_barras],
    )

    return NextResponse.json({ success: true, id: (result as any).insertId })
  } catch (error) {
    console.error("Erro ao criar produto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
