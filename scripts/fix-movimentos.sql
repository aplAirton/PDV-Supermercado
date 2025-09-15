-- Script simplificado para corrigir as tabelas de movimentações
-- Execute este script se houver problemas com foreign key constraints

USE pdv_supermercado;

-- Remover tabela existente se houver
DROP TABLE IF EXISTS movimentacoes_financeiras;

-- Criar nova tabela de movimentações financeiras gerais
CREATE TABLE movimentacoes_financeiras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL,
    categoria VARCHAR(30) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    referencia VARCHAR(255),
    entidade_tipo VARCHAR(20) DEFAULT 'sistema',
    entidade_id INT NULL,
    forma_pagamento VARCHAR(50),
    usuario_id INT NULL,
    saldo_anterior DECIMAL(10,2) NULL,
    saldo_posterior DECIMAL(10,2) NULL,
    data_movimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Adicionar índices separadamente
CREATE INDEX idx_mov_financeiras_tipo ON movimentacoes_financeiras(tipo);
CREATE INDEX idx_mov_financeiras_categoria ON movimentacoes_financeiras(categoria);
CREATE INDEX idx_mov_financeiras_data ON movimentacoes_financeiras(data_movimento);
CREATE INDEX idx_mov_financeiras_entidade ON movimentacoes_financeiras(entidade_tipo, entidade_id);
CREATE INDEX idx_mov_financeiras_usuario ON movimentacoes_financeiras(usuario_id);
CREATE INDEX idx_mov_financeiras_tipo_categoria ON movimentacoes_financeiras(tipo, categoria);
CREATE INDEX idx_mov_financeiras_data_range ON movimentacoes_financeiras(data_movimento, tipo);
CREATE INDEX idx_mov_financeiras_valor ON movimentacoes_financeiras(valor);
CREATE INDEX idx_mov_financeiras_referencia ON movimentacoes_financeiras(referencia(50));

-- Migrar dados existentes de fiado_movimentos para a nova tabela (se existir)
INSERT INTO movimentacoes_financeiras (tipo, categoria, valor, descricao, referencia, entidade_tipo, entidade_id, data_movimento)
SELECT
    CASE WHEN direcao = 'credito' THEN 'entrada' ELSE 'saida' END,
    CASE
        WHEN tipo = 'pagamento' AND direcao = 'credito' THEN 'pagamento_fiado'
        WHEN tipo = 'ajuste' THEN 'ajuste'
        ELSE 'ajuste'
    END,
    valor,
    descricao,
    referencia,
    'cliente',
    cliente_id,
    data_movimento
FROM fiado_movimentos
WHERE cliente_id IS NOT NULL;

SELECT 'Tabela movimentacoes_financeiras criada com sucesso!' as status;