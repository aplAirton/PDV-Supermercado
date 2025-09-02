-- Script para criar tabela de sangrias do caixa
-- Execute este script no seu banco de dados MySQL

DROP TABLE IF EXISTS caixa_sangrias;

CREATE TABLE caixa_sangrias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caixa_id INT NOT NULL,
    funcionario_id INT DEFAULT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Adicionar chaves estrangeiras
ALTER TABLE caixa_sangrias 
ADD CONSTRAINT fk_sangria_caixa 
FOREIGN KEY (caixa_id) REFERENCES caixas(id) ON DELETE CASCADE;

ALTER TABLE caixa_sangrias 
ADD CONSTRAINT fk_sangria_funcionario 
FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE SET NULL;

-- Criar índices
CREATE INDEX idx_caixa_id ON caixa_sangrias (caixa_id);
CREATE INDEX idx_funcionario_id ON caixa_sangrias (funcionario_id);
CREATE INDEX idx_data_criacao ON caixa_sangrias (data_criacao);
CREATE INDEX idx_caixa_data ON caixa_sangrias (caixa_id, data_criacao);
