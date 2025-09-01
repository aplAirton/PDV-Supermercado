-- Script de migração para adequar a estrutura das tabelas às novas demandas do sistema de caixa
-- Execute este script para atualizar o banco de dados

-- 1. Adicionar colunas de formas de pagamento na tabela vendas (se não existirem)
ALTER TABLE vendas 
ADD COLUMN valor_dinheiro DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN valor_cartao_debito DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN valor_cartao_credito DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN valor_pix DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN valor_fiado DECIMAL(10,2) DEFAULT 0.00;

-- 2. Criar tabela de movimentações de caixa (se não existir)
CREATE TABLE caixa_movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caixa_id INT NOT NULL,
    tipo ENUM('suprimento', 'sangria', 'outros') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    funcionario_id INT,
    FOREIGN KEY (caixa_id) REFERENCES caixas(id) ON DELETE CASCADE,
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE SET NULL,
    INDEX idx_caixa_movimentacoes_caixa (caixa_id),
    INDEX idx_caixa_movimentacoes_data (data_movimentacao)
);

-- 3. Atualizar dados existentes para compatibilidade
-- Vamos assumir que vendas existentes foram pagas em dinheiro
UPDATE vendas 
SET valor_dinheiro = total
WHERE valor_dinheiro = 0.00 OR valor_dinheiro IS NULL;

-- 4. Verificar se há vendas que precisam ter caixa_id definido
-- Se houver vendas sem caixa_id, vamos associá-las ao primeiro caixa disponível
UPDATE vendas 
SET caixa_id = (SELECT id FROM caixas ORDER BY data_abertura ASC LIMIT 1)
WHERE caixa_id IS NULL 
  AND EXISTS (SELECT 1 FROM caixas);

-- 5. Script para recalcular totais dos caixas existentes
-- Execute apenas se necessário reprocessar dados históricos
UPDATE caixas c
LEFT JOIN (
    SELECT 
        caixa_id,
        COALESCE(SUM(total), 0) as total_vendas_calc,
        COALESCE(SUM(valor_dinheiro), 0) as total_dinheiro_calc,
        COALESCE(SUM(valor_cartao_debito), 0) as total_cartao_debito_calc,
        COALESCE(SUM(valor_cartao_credito), 0) as total_cartao_credito_calc,
        COALESCE(SUM(valor_pix), 0) as total_pix_calc,
        COALESCE(SUM(valor_fiado), 0) as total_fiado_calc
    FROM vendas 
    WHERE caixa_id IS NOT NULL
    GROUP BY caixa_id
) v ON c.id = v.caixa_id
SET 
    c.total_vendas = COALESCE(v.total_vendas_calc, 0),
    c.total_dinheiro = COALESCE(v.total_dinheiro_calc, 0),
    c.total_cartao_debito = COALESCE(v.total_cartao_debito_calc, 0),
    c.total_cartao_credito = COALESCE(v.total_cartao_credito_calc, 0),
    c.total_pix = COALESCE(v.total_pix_calc, 0),
    c.total_fiado = COALESCE(v.total_fiado_calc, 0);

-- 6. Adicionar índices para melhor performance
CREATE INDEX idx_vendas_caixa_data ON vendas(caixa_id, data_venda);
CREATE INDEX idx_caixas_status_data ON caixas(status, data_abertura);
