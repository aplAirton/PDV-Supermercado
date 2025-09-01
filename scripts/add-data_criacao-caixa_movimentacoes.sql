-- Script: add-data_criacao-caixa_movimentacoes.sql
-- Objetivo: adicionar a coluna `data_criacao` na tabela `caixa_movimentacoes` de forma segura
-- Procedimento: 1) adicionar coluna NULL, 2) povoar valores existentes com NOW(), 3) tornar NOT NULL com DEFAULT CURRENT_TIMESTAMP
-- Faça backup da tabela/DB antes de executar.

START TRANSACTION;

-- 1) Adiciona a coluna como NULL para evitar erro em rows existentes
ALTER TABLE caixa_movimentacoes
  ADD COLUMN data_criacao DATETIME NULL AFTER descricao;

-- 2) Popula valores existentes (se houver registros sem valor definido)
UPDATE caixa_movimentacoes
  SET data_criacao = NOW()
  WHERE data_criacao IS NULL;

-- 3) Torna a coluna NOT NULL e define DEFAULT para futuras inserções
ALTER TABLE caixa_movimentacoes
  MODIFY data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

COMMIT;

-- Rollback (se precisar remover a coluna):
-- ALTER TABLE caixa_movimentacoes DROP COLUMN data_criacao;
