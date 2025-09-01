-- Script para Sistema de Caixa - PDV Supermercado
-- Criação das tabelas necessárias para controle de abertura/fechamento de caixa

USE pdv_supermercado;

-- Tabela de Funcionários (para registrar quem abre/fecha o caixa)
CREATE TABLE IF NOT EXISTS funcionarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    cargo VARCHAR(100) NOT NULL DEFAULT 'Operador de Caixa',
    login VARCHAR(50) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Caixas (sessões de caixa)
CREATE TABLE IF NOT EXISTS caixas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    funcionario_id INT NOT NULL,
    status ENUM('aberto', 'fechado') NOT NULL DEFAULT 'aberto',
    valor_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- fundo inicial em dinheiro
    valor_final DECIMAL(10,2) DEFAULT NULL, -- valor final ao fechar
    data_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_fechamento TIMESTAMP NULL,
    observacoes_abertura TEXT,
    observacoes_fechamento TEXT,
    total_vendas DECIMAL(10,2) DEFAULT 0.00,
    total_dinheiro DECIMAL(10,2) DEFAULT 0.00,
    total_cartao_debito DECIMAL(10,2) DEFAULT 0.00,
    total_cartao_credito DECIMAL(10,2) DEFAULT 0.00,
    total_pix DECIMAL(10,2) DEFAULT 0.00,
    total_fiado DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE RESTRICT,
    INDEX idx_caixas_funcionario (funcionario_id),
    INDEX idx_caixas_status (status),
    INDEX idx_caixas_data_abertura (data_abertura)
);

-- Tabela de Movimentações do Caixa (aportes, sangrias, etc.)
CREATE TABLE IF NOT EXISTS caixa_movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caixa_id INT NOT NULL,
    tipo ENUM('aporte', 'sangria', 'ajuste') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caixa_id) REFERENCES caixas(id) ON DELETE CASCADE,
    INDEX idx_caixa_mov_caixa (caixa_id),
    INDEX idx_caixa_mov_data (data_movimentacao)
);

-- Adicionar coluna caixa_id nas tabelas existentes para indexação
ALTER TABLE vendas ADD COLUMN caixa_id INT NULL;
ALTER TABLE vendas ADD CONSTRAINT fk_vendas_caixa FOREIGN KEY (caixa_id) REFERENCES caixas(id) ON DELETE SET NULL;
ALTER TABLE vendas ADD INDEX idx_vendas_caixa (caixa_id);

ALTER TABLE fiado_movimentos ADD COLUMN caixa_id INT NULL;
ALTER TABLE fiado_movimentos ADD CONSTRAINT fk_fiado_mov_caixa FOREIGN KEY (caixa_id) REFERENCES caixas(id) ON DELETE SET NULL;
ALTER TABLE fiado_movimentos ADD INDEX idx_fiado_mov_caixa (caixa_id);

-- Trigger para atualizar totais do caixa quando uma venda é inserida
DELIMITER //
CREATE TRIGGER tr_venda_insert_caixa AFTER INSERT ON vendas
FOR EACH ROW
BEGIN
    DECLARE v_dinheiro DECIMAL(10,2) DEFAULT 0;
    DECLARE v_cartao_debito DECIMAL(10,2) DEFAULT 0;
    DECLARE v_cartao_credito DECIMAL(10,2) DEFAULT 0;
    DECLARE v_pix DECIMAL(10,2) DEFAULT 0;
    DECLARE v_fiado DECIMAL(10,2) DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    DECLARE j_length INT DEFAULT 0;
    DECLARE forma_tipo VARCHAR(50);
    DECLARE forma_valor DECIMAL(10,2);
    
    -- Se a venda tem caixa_id, processar os totais
    IF NEW.caixa_id IS NOT NULL THEN
        -- Processar forma_pagamento_json se existir
        IF NEW.forma_pagamento_json IS NOT NULL THEN
            SET j_length = JSON_LENGTH(NEW.forma_pagamento_json);
            WHILE i < j_length DO
                SET forma_tipo = JSON_UNQUOTE(JSON_EXTRACT(NEW.forma_pagamento_json, CONCAT('$[', i, '].tipo')));
                SET forma_valor = CAST(JSON_UNQUOTE(JSON_EXTRACT(NEW.forma_pagamento_json, CONCAT('$[', i, '].valor'))) AS DECIMAL(10,2));
                
                CASE forma_tipo
                    WHEN 'dinheiro' THEN SET v_dinheiro = v_dinheiro + forma_valor;
                    WHEN 'cartao_debito' THEN SET v_cartao_debito = v_cartao_debito + forma_valor;
                    WHEN 'cartao_credito' THEN SET v_cartao_credito = v_cartao_credito + forma_valor;
                    WHEN 'pix' THEN SET v_pix = v_pix + forma_valor;
                    WHEN 'fiado' THEN SET v_fiado = v_fiado + forma_valor;
                END CASE;
                
                SET i = i + 1;
            END WHILE;
        END IF;
        
        -- Atualizar totais no caixa
        UPDATE caixas 
        SET total_vendas = total_vendas + NEW.total,
            total_dinheiro = total_dinheiro + v_dinheiro,
            total_cartao_debito = total_cartao_debito + v_cartao_debito,
            total_cartao_credito = total_cartao_credito + v_cartao_credito,
            total_pix = total_pix + v_pix,
            total_fiado = total_fiado + v_fiado
        WHERE id = NEW.caixa_id;
    END IF;
END//
DELIMITER ;

-- Inserir funcionário padrão para testes
INSERT INTO funcionarios (nome, cpf, cargo, login, senha_hash) 
VALUES ('Administrador', '000.000.000-00', 'Gerente', 'admin', '$2b$10$dummy.hash.for.testing') 
ON DUPLICATE KEY UPDATE nome = nome;

SELECT 'Sistema de Caixa criado com sucesso!' as status;
