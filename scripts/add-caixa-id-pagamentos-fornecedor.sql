-- Script para adicionar coluna caixa_id na tabela pagamentos_fornecedor
-- Execute este script para adicionar a coluna que associa pagamentos de fornecedores ao caixa

USE pdv_supermercado;

-- Adicionar coluna caixa_id na tabela pagamentos_fornecedor
ALTER TABLE pagamentos_fornecedor
ADD COLUMN caixa_id INT NULL AFTER fornecedor_id,
ADD FOREIGN KEY (caixa_id) REFERENCES caixas(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX idx_pagamentos_fornecedor_caixa ON pagamentos_fornecedor(caixa_id);

-- Atualizar registros existentes (opcional - associa ao último caixa aberto se existir)
-- UPDATE pagamentos_fornecedor pf
-- SET pf.caixa_id = (
--   SELECT c.id FROM caixas c
--   WHERE c.status = 'aberto'
--   ORDER BY c.data_abertura DESC
--   LIMIT 1
-- )
-- WHERE pf.caixa_id IS NULL
--   AND pf.status = 'pago'
--   AND pf.data_pagamento >= (
--     SELECT MIN(c.data_abertura) FROM caixas c WHERE c.status = 'aberto'
--   );

SELECT 'Coluna caixa_id adicionada com sucesso à tabela pagamentos_fornecedor!' as status;