-- Adicionar colunas de desconto na tabela vendas se não existirem

-- Verificar e adicionar coluna desconto_tipo
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'vendas' 
AND column_name = 'desconto_tipo';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE vendas ADD COLUMN desconto_tipo VARCHAR(20) NULL COMMENT "Tipo de desconto: valor, percent"', 
    'SELECT "Coluna desconto_tipo já existe"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar coluna desconto_valor
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'vendas' 
AND column_name = 'desconto_valor';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE vendas ADD COLUMN desconto_valor DECIMAL(10,2) DEFAULT 0 COMMENT "Valor do desconto aplicado em reais"', 
    'SELECT "Coluna desconto_valor já existe"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar coluna desconto_percentual
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'vendas' 
AND column_name = 'desconto_percentual';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE vendas ADD COLUMN desconto_percentual DECIMAL(5,2) DEFAULT 0 COMMENT "Percentual do desconto aplicado"', 
    'SELECT "Coluna desconto_percentual já existe"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mostrar estrutura atualizada da tabela
DESCRIBE vendas;
