-- Script para adicionar colunas de desconto na tabela vendas
-- Este script pode ser executado múltiplas vezes sem erro

-- Adicionar coluna desconto_tipo
ALTER TABLE vendas ADD COLUMN desconto_tipo VARCHAR(20) NULL COMMENT 'Tipo de desconto: valor, percent';

-- Adicionar coluna desconto_valor  
ALTER TABLE vendas ADD COLUMN desconto_valor DECIMAL(10,2) DEFAULT 0 COMMENT 'Valor do desconto aplicado em reais';

-- Adicionar coluna desconto_percentual
ALTER TABLE vendas ADD COLUMN desconto_percentual DECIMAL(5,2) DEFAULT 0 COMMENT 'Percentual do desconto aplicado';

-- Mostrar estrutura da tabela para confirmar
DESCRIBE vendas;
