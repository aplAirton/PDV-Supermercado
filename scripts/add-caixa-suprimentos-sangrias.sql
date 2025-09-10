-- Script para adicionar campos total_suprimentos e total_sangrias à tabela caixas
-- Estes campos são necessários para o cálculo correto do total do caixa

USE pdv_supermercado;

-- Adicionar coluna total_suprimentos se não existir
ALTER TABLE caixas
ADD COLUMN IF NOT EXISTS total_suprimentos DECIMAL(10,2) DEFAULT 0.00;

-- Adicionar coluna total_sangrias se não existir
ALTER TABLE caixas
ADD COLUMN IF NOT EXISTS total_sangrias DECIMAL(10,2) DEFAULT 0.00;

-- Verificar se as colunas foram adicionadas
DESCRIBE caixas;

SELECT 'Campos total_suprimentos e total_sangrias adicionados com sucesso à tabela caixas!' as status;
