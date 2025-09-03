// Código para usar após executar o script SQL das colunas de desconto

// Substitua a query INSERT no arquivo /app/api/vendas/route.ts por esta versão:

const vendaResult = await tx.$executeRaw`
  INSERT INTO vendas (cliente_id, total, forma_pagamento_json, valor_pago, troco, caixa_id, data_venda, 
                     valor_dinheiro, valor_cartao_debito, valor_cartao_credito, valor_pix, valor_fiado,
                     desconto_tipo, desconto_valor, desconto_percentual) 
  VALUES (${cliente_id || null}, ${Number(total) || 0}, ${JSON.stringify(pagamentosNorm || [])}, 
          ${Number(somaPagamentos) || 0}, ${Number(troco) || 0}, ${caixaId}, NOW(),
          ${valorDinheiro}, ${valorCartaoDebito}, ${valorCartaoCredito}, ${valorPix}, ${valorFiado},
          ${desconto_tipo || null}, ${Number(desconto_valor) || 0}, ${Number(desconto_percentual) || 0})
`

// E remova a query UPDATE condicional que foi adicionada temporariamente
