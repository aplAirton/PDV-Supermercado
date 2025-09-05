-- Script de atualização da tabela produtos para suporte a diferentes tipos de produto
-- Execute este script APÓS ter o banco de dados criado

USE pdv_supermercado;

-- Adicionar novas colunas à tabela produtos
ALTER TABLE produtos
ADD COLUMN preco_kilo DECIMAL(10,2) NULL COMMENT 'Preço por kilo para produtos vendidos por peso',
ADD COLUMN unidade_medida ENUM('unidade', 'kilo', 'grama', 'litro', 'mililitro') NOT NULL DEFAULT 'unidade' COMMENT 'Unidade de medida do produto',
ADD COLUMN peso_liquido DECIMAL(10,3) NULL COMMENT 'Peso líquido do produto em kg/g',
ADD COLUMN custo_compra DECIMAL(10,2) NULL COMMENT 'Custo de compra do produto',
ADD COLUMN margem_lucro DECIMAL(5,2) NULL COMMENT 'Margem de lucro em porcentagem',
ADD COLUMN fornecedor VARCHAR(255) NULL COMMENT 'Nome do fornecedor',
ADD COLUMN localizacao VARCHAR(100) NULL COMMENT 'Localização física no estabelecimento',
ADD COLUMN data_validade DATE NULL COMMENT 'Data de validade do produto',
ADD COLUMN lote VARCHAR(50) NULL COMMENT 'Número do lote',
ADD COLUMN observacoes TEXT NULL COMMENT 'Observações adicionais sobre o produto';

-- Criar índices para as novas colunas
CREATE INDEX idx_produtos_unidade_medida ON produtos(unidade_medida);
CREATE INDEX idx_produtos_fornecedor ON produtos(fornecedor);
CREATE INDEX idx_produtos_data_validade ON produtos(data_validade);

-- Atualizar produtos existentes para ter unidade_medida = 'unidade' (padrão)
UPDATE produtos SET unidade_medida = 'unidade' WHERE unidade_medida IS NULL;

-- Adicionar comentários à tabela
ALTER TABLE produtos COMMENT = 'Tabela de produtos com suporte a diferentes tipos (unidade, peso, volume)';

-- Verificar se as alterações foram aplicadas
SELECT
    'Produtos atualizados com sucesso!' as status,
    COUNT(*) as total_produtos,
    SUM(CASE WHEN unidade_medida = 'unidade' THEN 1 ELSE 0 END) as produtos_unidade,
    SUM(CASE WHEN unidade_medida IN ('kilo', 'grama') THEN 1 ELSE 0 END) as produtos_peso,
    SUM(CASE WHEN unidade_medida IN ('litro', 'mililitro') THEN 1 ELSE 0 END) as produtos_volume
FROM produtos;

-- Exemplo de inserção de produto por peso
-- INSERT INTO produtos (
--     codigo_barras, nome, categoria, preco, preco_kilo, unidade_medida,
--     peso_liquido, estoque, estoque_minimo, custo_compra, margem_lucro,
--     fornecedor, localizacao
-- ) VALUES (
--     '7891234567890', 'Arroz Branco 5kg', 'Alimentos', 25.90, 5.18, 'kilo',
--     5.000, 50, 10, 20.00, 29.50, 'Fornecedor ABC', 'Prateleira A-01'
-- );

-- Exemplo de inserção de produto por volume
-- INSERT INTO produtos (
--     codigo_barras, nome, categoria, preco, unidade_medida,
--     peso_liquido, estoque, estoque_minimo, custo_compra, margem_lucro,
--     fornecedor, localizacao, data_validade
-- ) VALUES (
--     '7891234567891', 'Leite Integral 1L', 'Bebidas', 4.50, 'litro',
--     1.000, 100, 20, 3.20, 40.63, 'Laticínios XYZ', 'Geladeira 2',
--     '2024-12-31'
-- );

SELECT 'Script de atualização executado com sucesso!' as resultado;
