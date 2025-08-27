import { type NextRequest, NextResponse } from "next/server"
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import crypto from 'crypto'
import { generatePublicToken, generateQRCodeDataUrl, buildCupomPublicUrl } from '@/lib/cupom-utils'
import { generateQRCodeCompactASCII } from '@/lib/qr-ascii'

export async function GET(request: Request) {
  try {
    // Ler filtros da query string
    const url = new URL(request.url)
    const params = url.searchParams
    const data_inicio = params.get('data_inicio')
    const data_fim = params.get('data_fim')
    const forma_pagamento = params.get('forma_pagamento')
    const cliente = params.get('cliente')

    const where: any = {}

    // Filtro por período (assume data_venda é armazenada como datetime)
    if (data_inicio || data_fim) {
      where.data_venda = {}
      if (data_inicio) {
        // data_inicio inclusive at start of day
        const d = new Date(data_inicio)
        d.setHours(0,0,0,0)
        where.data_venda.gte = d
      }
      if (data_fim) {
        const d2 = new Date(data_fim)
        d2.setHours(23,59,59,999)
        where.data_venda.lte = d2
      }
    }

    // Filtro por forma de pagamento (verifica campo forma_pagamento ou forma_pagamento_json)
    if (forma_pagamento) {
      // tentar filtrar pelo campo enum forma_pagamento
      where.OR = [
        { forma_pagamento: forma_pagamento },
        // ou quando armazenado no JSON como parte das formas
        { forma_pagamento_json: { contains: forma_pagamento } }
      ]
    }

    // Filtro por cliente (aceita id numérico ou parte do nome)
    if (cliente) {
      const clienteId = Number(cliente)
      if (!Number.isNaN(clienteId)) {
        where.cliente_id = clienteId
      } else {
        where.cliente = { nome: { contains: cliente, mode: 'insensitive' } }
      }
    }

    const vendas = await prisma.vendas.findMany({
      where,
      include: {
        cliente: true,
        itens: { include: { produto: true } },
      },
      orderBy: { data_venda: 'desc' },
      take: 500,
    })

    const vendasComItens = vendas.map((v: any) => ({
      ...v,
      cliente_nome: v.cliente?.nome ?? null,
      itens: Array.isArray(v.itens)
        ? v.itens.map((it: any) => ({
            produto_nome: it.produto?.nome ?? '',
            quantidade: Number(it.quantidade || 0),
            preco_unitario: Number(it.preco_unitario || 0),
            subtotal: Number(it.subtotal || 0),
          }))
        : [],
    }))

    return NextResponse.json(vendasComItens)
  } catch (error) {
    console.error("Erro ao buscar vendas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let requestId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
  try {
    const body = await request.json()
    console.log(`[vendas][${requestId}] Incoming request body:`, JSON.stringify(body))
    const { cliente_id, itens, total, pagamentos, troco } = body

    // Validações básicas
    if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
      return NextResponse.json({ error: 'Pelo menos uma forma de pagamento é necessária' }, { status: 400 })
    }

    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: 'Itens da venda inválidos' }, { status: 400 })
    }

    const pagamentosNorm = pagamentos.map((p: any) => ({
      tipo: (p.tipo || p.tipo_pagamento || '').toString(),
      valor: Number(p.valor) || 0,
    }))

    const somaPagamentos = pagamentosNorm.reduce((s: number, p: any) => s + (Number(p.valor) || 0), 0)
  console.log('[vendas] pagamentosNorm:', pagamentosNorm, 'somaPagamentos:', somaPagamentos)
    if (Number(somaPagamentos.toFixed(2)) < Number(Number(total).toFixed(2))) {
      return NextResponse.json({ error: 'Valor total dos pagamentos menor que o total da venda' }, { status: 400 })
    }

    // Agregar itens por produto para atualizar estoque apenas uma vez por produto
    const aggByProduct: Record<string, { quantidade: number; preco_unitario: number; subtotal: number }> = {}
    for (const item of itens) {
      const pid = String(Number(item.produto_id))
      const q = Number(item.quantidade || 0)
      const preco = Number(item.preco_unitario || item.preco || 0)
      const sub = Number(item.subtotal ?? preco * q)

      if (!aggByProduct[pid]) aggByProduct[pid] = { quantidade: 0, preco_unitario: preco, subtotal: 0 }
      aggByProduct[pid].quantidade += q
      aggByProduct[pid].subtotal += sub
    }

  console.log('[vendas] aggByProduct (quantidades por produto):', aggByProduct)

    // Resumo da forma de pagamento para salvar em campo simples (label) e enum (campo obrigatório)
    const labelMap: Record<string, string> = {
      dinheiro: 'Dinheiro',
      cartao_debito: 'Cartão Débito',
      cartao_credito: 'Cartão Crédito',
      pix: 'PIX',
      fiado: 'Fiado',
    }

    const resumoLabel = pagamentosNorm
      .map((p: any) => labelMap[p.tipo] || (p.tipo || '').toString())
      .filter(Boolean)
      .join(', ')

    // Forma de pagamento (enum) - usar o primeiro método como valor primário (campo obrigatório no schema)
    const formaEnumValue = (pagamentosNorm[0]?.tipo && ['dinheiro','cartao_debito','cartao_credito','pix','fiado'].includes(pagamentosNorm[0].tipo)) ? pagamentosNorm[0].tipo : 'dinheiro'

    // Calcular total fiado (se houver)
    const totalFiado = pagamentosNorm.filter((p: any) => (p.tipo || '').toString() === 'fiado').reduce((s: number, p: any) => s + (Number(p.valor) || 0), 0)

  // Executar transação com Prisma (timeout aumentado para 15s)
  console.log(`[vendas][${requestId}] Iniciando transação - cliente_id: ${cliente_id} total: ${total} troco: ${troco} totalFiado: ${totalFiado}`)

  // Retry/backoff para P2028 (Transaction API error). Surface P1001 imediatamente (DB unreachable).
  const maxAttempts = 3
  let attempt = 0
  let result: any = null
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

  // Garantir que o cliente Prisma esteja conectado; se a conexão falhar, surface imediatamente
  try {
    await prisma.$connect()
  } catch (connectErr) {
    console.error(`[vendas][${requestId}] Falha ao conectar ao DB antes da transação:`, connectErr)
    throw connectErr
  }

  while (attempt < maxAttempts) {
    attempt++
    try {
      console.log(`[vendas][${requestId}] Iniciando transação (tentativa ${attempt}/${maxAttempts})`)
      result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const venda = await tx.vendas.create({
        data: {
          cliente_id: cliente_id || null,
          total: Number(total) || 0,
          forma_pagamento: formaEnumValue,
          forma_pagamento_json: JSON.stringify(pagamentosNorm || []),
          valor_pago: Number(somaPagamentos) || 0,
          troco: Number(troco) || 0,
        },
      })

      console.log('[vendas] Venda criada id=', venda.id)

      // Criar itens e atualizar estoque por produto agregado
      for (const pidStr of Object.keys(aggByProduct)) {
        const pid = Number(pidStr)
        const info = aggByProduct[pidStr]
        const quantidade = Number(info.quantidade)
        const preco_unitario = Number(info.preco_unitario) || 0
        const subtotal = Math.round((Number(info.subtotal) + Number.EPSILON) * 100) / 100

        // Log estoque ANTES
        const produtoAntes = await tx.produtos.findUnique({ where: { id: pid } })
        console.log(`[vendas] Produto ${pid} - estoque antes:`, produtoAntes ? produtoAntes.estoque : null, 'quantidade a decrementar:', quantidade)

        const itemCriado = await tx.itens_venda.create({
          data: {
            venda_id: venda.id,
            produto_id: pid,
            quantidade,
            preco_unitario,
            subtotal,
          },
        })
        console.log('[vendas] Item criado:', { id: itemCriado.id, produto_id: pid, quantidade })

        // Não decrementar manualmente: o trigger `atualizar_estoque_venda` em itens_venda
        // já atualiza o estoque automaticamente após o INSERT. Ler estoque para logar o efeito do trigger.
        const produtoDepois = await tx.produtos.findUnique({ where: { id: pid } })
        console.log(`[vendas] Produto ${pid} - estoque depois (após trigger):`, produtoDepois ? produtoDepois.estoque : null)
      }

      // Se houve fiado, criar registro e atualizar débito do cliente
      if (totalFiado > 0 && cliente_id) {
        try {
          console.log('[vendas] Criando fiado para cliente', cliente_id, 'valor:', totalFiado)
          const fiadoCriado = await tx.fiados.create({
            data: {
              cliente_id,
              venda_id: venda.id,
              valor_original: totalFiado,
              valor_pago: 0,
              valor_restante: totalFiado,
              status: 'aberto',
            },
          })
          console.log('[vendas] Fiado criado id=', fiadoCriado.id)

          const clienteAtualizado = await tx.clientes.update({ where: { id: cliente_id }, data: { debito_atual: { increment: totalFiado } as any } })
          console.log('[vendas] Cliente debito_atual depois:', clienteAtualizado.debito_atual)

          // Registrar movimento no extrato de fiado (raw SQL dentro da transação)
          const descricaoMov = `Venda a fiado #${venda.id}`
          const referenciaMov = `venda:${venda.id}`

          await tx.$executeRaw`
            INSERT INTO fiado_movimentos (cliente_id, fiado_id, venda_id, tipo, direcao, valor, descricao, referencia, criado_por, data_movimento)
            VALUES (${cliente_id}, ${fiadoCriado.id}, ${venda.id}, ${'lancamento'}, ${'debito'}, ${totalFiado}, ${descricaoMov}, ${referenciaMov}, ${'PDV'}, NOW())
          `

          const [movimento]: any = await tx.$queryRaw`
            SELECT * FROM fiado_movimentos WHERE id = LAST_INSERT_ID()
          `
          console.log('[vendas] Movimento de fiado criado id=', movimento?.id)
        } catch (fiadoErr) {
          console.error(`[vendas][${requestId}] Erro ao criar fiado/movimento:`, fiadoErr)
          throw fiadoErr
        }
      }

      console.log(`[vendas][${requestId}] Transação finalizada para venda id= ${venda.id}`)
      return { vendaId: venda.id }
      }, {
        timeout: 15000 // 15 segundos timeout
      })
      // Sucesso
      break
    } catch (err: any) {
      console.error(`[vendas][${requestId}] Erro na transação (tentativa ${attempt}):`, err?.message || err)
      // Prisma transaction invalid / race - retry
      const code = err?.code || (err?.meta && err.meta.code)
      if (code === 'P2028') {
        if (attempt < maxAttempts) {
          // backoff exponencial (máx 2000ms)
          const backoff = Math.min(2000, 200 * Math.pow(2, attempt - 1))
          console.warn(`[vendas][${requestId}] P2028 detectado — tentando novamente em ${backoff}ms`)
          await sleep(backoff)
          continue
        }
        // esgotou tentativas
        console.error(`[vendas][${requestId}] Esgotadas tentativas por P2028`)
        throw err
      }
      // DB unreachable
      if (code === 'P1001') {
        console.error(`[vendas][${requestId}] Erro P1001 - DB inacessível:`, err)
        throw err
      }
      // outro erro — rethrow
      throw err
    }
  }

    // Gerar cupom FORA da transação (não crítico para consistência)
    try {
      const itensCriados = await prisma.itens_venda.findMany({ 
        where: { venda_id: result.vendaId }, 
        include: { produto: true } 
      })

      const pad = (s: string, width: number, align: 'left' | 'right' | 'center' = 'left') => {
        if (align === 'right') return s.padStart(width, ' ')
        if (align === 'center') {
          const spaces = width - s.length
          const left = Math.floor(spaces / 2)
          const right = spaces - left
          return ' '.repeat(Math.max(0, left)) + s + ' '.repeat(Math.max(0, right))
        }
        return s.padEnd(width, ' ')
      }

      let texto = ''
      const linha = '========================================\n'
      const linhaThin = '----------------------------------------\n'

      texto += linha
      texto += pad('BUDEGA AIRTON', 40, 'center') + '\n'
      texto += pad('CNPJ: 00.000.000/0000-00', 40, 'center') + '\n'
      texto += pad('Povoado Jurema, 123', 40, 'center') + '\n'
      texto += pad('Tel: (00) 00000-0000', 40, 'center') + '\n'
      texto += linha + '\n'

      texto += `VENDA: #${result.vendaId}\n`
      texto += `DATA:  ${new Date().toLocaleString('pt-BR')}\n`
      // Se houver cliente_id, buscar nome do cliente para exibição no cupom
      let clienteNomeForCupom = 'AVULSO'
      if (cliente_id) {
        try {
          const clienteRec: any = await prisma.clientes.findUnique({ where: { id: Number(cliente_id) } })
          if (clienteRec && clienteRec.nome) clienteNomeForCupom = clienteRec.nome
        } catch (cliErr) {
          console.warn(`[vendas][${requestId}] Não foi possível buscar nome do cliente para cupom:`, cliErr)
        }
      }
      texto += `CLIENTE: ${clienteNomeForCupom}\n`
      texto += '\n' + linhaThin

      texto += pad('PRODUTO', 18) + pad('QTD', 5, 'right') + pad('V.UNIT', 8, 'right') + pad('SOMA', 9, 'right') + '\n'
      texto += linhaThin

      for (const it of itensCriados) {
        const nome = (it.produto?.nome || '').substring(0, 17)
        const qtd = Number(it.quantidade || 0).toFixed(0)
        const vu = Number(it.preco_unitario || 0).toFixed(2)
        const sub = Number(it.subtotal || 0).toFixed(2)

        texto += pad(nome, 18) + pad(qtd, 5, 'right') + pad(vu, 8, 'right') + pad(sub, 9, 'right') + '\n'
      }

      texto += linhaThin
      texto += pad('TOTAL GERAL:', 31, 'right') + pad(`R$ ${Number(total || 0).toFixed(2)}`, 9, 'right') + '\n'
      texto += linha + '\n'

      texto += 'FORMAS DE PAGAMENTO:\n' + linhaThin
      try {
        const formasJson = pagamentosNorm || []
        for (const f of formasJson) {
          const tipoRaw = (f.tipo || '').toString()
          const label = labelMap[tipoRaw] || tipoRaw.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
          const valor = `R$ ${Number(f.valor || 0).toFixed(2)}`
          texto += pad(`${label}:`, 25) + pad(valor, 15, 'right') + '\n'
        }
      } catch (e) {
        const valor = `R$ ${Number(total || 0).toFixed(2)}`
        texto += pad('Dinheiro:', 25) + pad(valor, 15, 'right') + '\n'
      }

      texto += linha + '\n' + pad('Obrigado pela preferência!', 40, 'center') + '\n' + pad('Volte sempre!', 40, 'center') + '\n' + linha

      // Gerar token e QR code primeiro para incluir no cupom
      let publicToken = ''
      let qrDataUrl = ''
      let qrCodeASCII = ''
      try {
        publicToken = generatePublicToken()
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const cupomPublicUrl = buildCupomPublicUrl(baseUrl, publicToken)
        console.log(`[vendas][${requestId}] Gerando QR code para URL: ${cupomPublicUrl}`)
        
        // Gerar QR code data URL para exibição na tela
        qrDataUrl = await generateQRCodeDataUrl(cupomPublicUrl)
        console.log(`[vendas][${requestId}] QR code gerado: ${qrDataUrl.substring(0, 50)}...`)
        
        // Gerar QR code ASCII para cupom impresso
        qrCodeASCII = await generateQRCodeCompactASCII(cupomPublicUrl)
        console.log(`[vendas][${requestId}] QR code ASCII gerado com ${qrCodeASCII.split('\n').length} linhas`)
        
        // Adicionar QR code ASCII ao cupom impresso
        texto += '\n' + pad('CUPOM DIGITAL', 40, 'center') + '\n'
        texto += linhaThin
        texto += pad('Escaneie o QR Code abaixo:', 40, 'center') + '\n'
        texto += linhaThin
        
        // Inserir QR code ASCII centralizado
        const qrLines = qrCodeASCII.split('\n').filter(line => line.trim().length > 0)
        for (const line of qrLines) {
          if (line.trim()) {
            const paddedLine = line.length > 40 ? line.substring(0, 40) : line
            texto += pad(paddedLine, 40, 'center') + '\n'
          }
        }
        
        texto += linhaThin
        texto += pad('Ou acesse diretamente:', 40, 'center') + '\n'
        const shortUrl = cupomPublicUrl.replace('http://localhost:3000', 'localhost:3000')
        const lines = []
        for (let i = 0; i < shortUrl.length; i += 38) {
          lines.push(shortUrl.substring(i, i + 38))
        }
        for (const line of lines) {
          texto += pad(line, 40, 'center') + '\n'
        }
        texto += linha
      } catch (qrErr) {
        console.warn(`[vendas][${requestId}] Erro ao gerar QR info para cupom:`, qrErr)
        texto += '\n' + pad('CUPOM DIGITAL INDISPONÍVEL', 40, 'center') + '\n' + linha
      }

      const cupomCriado = await prisma.cupons.create({ data: { venda_id: result.vendaId, conteudo_texto: texto } })
      console.log(`[vendas][${requestId}] Cupom criado id=`, cupomCriado.id, 'venda_id=', cupomCriado.venda_id)
      
      // Criar cupom_link com QR code para acesso público
      if (publicToken && qrDataUrl) {
        try {
          // Usar raw SQL até regenerar o cliente Prisma
          await prisma.$executeRaw`
            INSERT INTO cupom_links (venda_id, public_token, qr_data_url)
            VALUES (${result.vendaId}, ${publicToken}, ${qrDataUrl})
          `
          console.log(`[vendas][${requestId}] Cupom link criado - token: ${publicToken.substring(0,8)}...`)
        } catch (linkErr) {
          console.error(`[vendas][${requestId}] Erro ao criar cupom link (não crítico):`, linkErr)
        }
      }
    } catch (cupomErr) {
      console.error(`[vendas][${requestId}] Erro ao criar cupom (não crítico):`, cupomErr)
    }

    // Checar estoque final fora da transação para detectar alterações concorrentes
    for (const pidStr of Object.keys(aggByProduct)) {
      const pid = Number(pidStr)
      const produtoFinal = await prisma.produtos.findUnique({ where: { id: pid } })
      console.log(`[vendas][${requestId}] Produto ${pid} - estoque final no DB:`, produtoFinal ? produtoFinal.estoque : null)
    }

    return NextResponse.json({ success: true, vendaId: result.vendaId })
  } catch (error: any) {
    console.error(`[vendas][${requestId}] Erro ao processar venda:`, error)
    const message = error?.message || String(error)
    return NextResponse.json({ error: 'Erro interno do servidor', requestId, details: message }, { status: 500 })
  }
}
