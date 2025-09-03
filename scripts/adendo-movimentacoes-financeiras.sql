-- Adendo MySQL para adequar tabela caixa_sangrias para movimentações gerais
-- Execute este script para modificar a tabela existente
-- 1. Renomear tabela para nome mais genérico
ALTER TABLE caixa_sangrias RENAME TO caixa_movimentacoes_financeiras;

-- 2. Adicionar coluna tipo para distinguir sangrias de suprimentos
ALTER TABLE caixa_movimentacoes_financeiras 
ADD COLUMN tipo ENUM('sangria', 'suprimento') NOT NULL DEFAULT 'sangria' 
AFTER valor;

-- 3. Criar índice para performance nas consultas por tipo
CREATE INDEX idx_tipo ON caixa_movimentacoes_financeiras (tipo);

-- 4. Criar índice composto para consultas por caixa e tipo
CREATE INDEX idx_caixa_tipo ON caixa_movimentacoes_financeiras (caixa_id, tipo);

-- 5. Atualizar comentário da tabela
ALTER TABLE caixa_movimentacoes_financeiras 
COMMENT = 'Tabela para registrar todas as movimentações financeiras do caixa (sangrias e suprimentos)';

-- 6. Adicionar coluna total_suprimentos na tabela caixas se não existir
ALTER TABLE caixas 
ADD COLUMN total_suprimentos DECIMAL(10,2) DEFAULT 0.00;

-- 7. Popular dados existentes como sangria (se houver)
UPDATE caixa_movimentacoes_financeiras 
SET tipo = 'sangria' 
WHERE tipo IS NULL OR tipo = '';

-- 8. Verificação dos dados após migração
SELECT 
    COUNT(*) as total_registros,
    SUM(CASE WHEN tipo = 'sangria' THEN 1 ELSE 0 END) as total_sangrias,
    SUM(CASE WHEN tipo = 'suprimento' THEN 1 ELSE 0 END) as total_suprimentos
FROM caixa_movimentacoes_financeiras;
