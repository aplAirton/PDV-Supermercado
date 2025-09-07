-- Script para corrigir valores de dinheiro em vendas existentes
-- Este script recalcula o valor_dinheiro correto subtraindo o troco

USE pdv_supermercado;

-- Atualizar vendas que têm troco e valor_dinheiro incorreto
-- O valor_dinheiro deve ser: valor_pago - troco (apenas para dinheiro)
UPDATE vendas
SET valor_dinheiro = GREATEST(0, valor_pago - COALESCE(troco, 0))
WHERE troco > 0 AND valor_dinheiro > (valor_pago - COALESCE(troco, 0));

-- Para vendas com forma_pagamento_json, recalcular baseado nos pagamentos
UPDATE vendas
SET valor_dinheiro = (
  SELECT COALESCE(SUM(
    CASE
      WHEN JSON_UNQUOTE(JSON_EXTRACT(pg.value, '$.tipo')) = 'dinheiro'
      THEN GREATEST(0, CAST(JSON_UNQUOTE(JSON_EXTRACT(pg.value, '$.valor')) AS DECIMAL(10,2)) - COALESCE(troco, 0))
      ELSE 0
    END
  ), 0)
  FROM JSON_TABLE(
    CONCAT('[', REPLACE(REPLACE(forma_pagamento_json, '{"tipo":', '{"tipo":"'), '}', '"}'), ']'),
    '$[*]' COLUMNS (
      value JSON PATH '$'
    )
  ) pg
)
WHERE forma_pagamento_json IS NOT NULL
  AND JSON_VALID(forma_pagamento_json)
  AND troco > 0;

-- Recalcular totais do caixa após correção
-- Primeiro, zerar os totais
UPDATE caixas SET
  total_dinheiro = 0,
  total_cartao_debito = 0,
  total_cartao_credito = 0,
  total_pix = 0,
  total_fiado = 0,
  total_vendas = 0;

-- Recalcular totais baseado nas vendas corrigidas
UPDATE caixas c
SET total_vendas = (
  SELECT COALESCE(SUM(v.total), 0)
  FROM vendas v
  WHERE v.caixa_id = c.id
),
total_dinheiro = (
  SELECT COALESCE(SUM(v.valor_dinheiro), 0)
  FROM vendas v
  WHERE v.caixa_id = c.id
),
total_cartao_debito = (
  SELECT COALESCE(SUM(v.valor_cartao_debito), 0)
  FROM vendas v
  WHERE v.caixa_id = c.id
),
total_cartao_credito = (
  SELECT COALESCE(SUM(v.valor_cartao_credito), 0)
  FROM vendas v
  WHERE v.caixa_id = c.id
),
total_pix = (
  SELECT COALESCE(SUM(v.valor_pix), 0)
  FROM vendas v
  WHERE v.caixa_id = c.id
),
total_fiado = (
  SELECT COALESCE(SUM(v.valor_fiado), 0)
  FROM vendas v
  WHERE v.caixa_id = c.id
);

SELECT 'Correção de valores de vendas aplicada com sucesso!' as status;
