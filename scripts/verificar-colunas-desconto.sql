-- Verificar se as colunas de desconto existem
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'vendas'
    AND COLUMN_NAME IN ('desconto_tipo', 'desconto_valor', 'desconto_percentual')
ORDER BY COLUMN_NAME;
