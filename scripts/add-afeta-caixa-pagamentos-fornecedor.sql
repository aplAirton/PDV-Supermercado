-- Adicionar coluna afeta_caixa na tabela pagamentos_fornecedor
-- Execute este script para adicionar a coluna que indica se o pagamento afetou o caixa

-- Adicionar coluna afeta_caixa na tabela pagamentos_fornecedor (se não existir)
ALTER TABLE pagamentos_fornecedor ADD COLUMN afeta_caixa BOOLEAN DEFAULT FALSE;

-- Atualizar registros existentes baseados na movimentacao_financeira correspondente
-- Pagamentos registrados como 'sangria' afetaram o caixa
UPDATE pagamentos_fornecedor pf
JOIN movimentacoes_financeiras mf ON mf.entidade_id = pf.fornecedor_id
  AND mf.entidade_tipo = 'fornecedor'
  AND mf.referencia LIKE CONCAT('Pagamento fornecedor #', pf.id)
SET pf.afeta_caixa = (mf.categoria = 'sangria')
WHERE pf.afeta_caixa = FALSE OR pf.afeta_caixa IS NULL;

SELECT 'Migração da coluna afeta_caixa concluída com sucesso!' as status;