-- Script MySQL para Sistema PDV Supermercado - Fornecedores
-- Adiciona tabelas de fornecedores e pagamentos de fornecedores

USE pdv_supermercado;

-- Tabela de Fornecedores
CREATE TABLE fornecedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    contato_nome VARCHAR(255),
    contato_telefone VARCHAR(20),
    prazo_pagamento_dias INT DEFAULT 30,
    limite_credito DECIMAL(10,2) DEFAULT 0.00,
    debito_atual DECIMAL(10,2) DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Pagamentos de Fornecedor
CREATE TABLE pagamentos_fornecedor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fornecedor_id INT NOT NULL,
    valor_pagamento DECIMAL(10,2) NOT NULL,
    forma_pagamento ENUM('dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'transferencia', 'cheque') NOT NULL,
    numero_documento VARCHAR(100),
    observacoes TEXT,
    data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_vencimento DATE,
    status ENUM('pendente', 'pago', 'cancelado') DEFAULT 'pendente',
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE CASCADE
);

-- Tabela de Compras (para rastrear compras de fornecedores)
CREATE TABLE compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fornecedor_id INT NOT NULL,
    numero_nota_fiscal VARCHAR(50) UNIQUE,
    valor_total DECIMAL(10,2) NOT NULL,
    valor_pago DECIMAL(10,2) DEFAULT 0.00,
    valor_restante DECIMAL(10,2) NOT NULL,
    status ENUM('aberto', 'parcial', 'quitado', 'cancelado') DEFAULT 'aberto',
    data_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_vencimento DATE,
    observacoes TEXT,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE CASCADE
);

-- Tabela de Itens da Compra
CREATE TABLE itens_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT
);

-- Índices para melhor performance
CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX idx_fornecedores_ativo ON fornecedores(ativo);
CREATE INDEX idx_pagamentos_fornecedor_data ON pagamentos_fornecedor(data_pagamento);
CREATE INDEX idx_pagamentos_fornecedor_fornecedor ON pagamentos_fornecedor(fornecedor_id);
CREATE INDEX idx_pagamentos_fornecedor_status ON pagamentos_fornecedor(status);
CREATE INDEX idx_compras_fornecedor ON compras(fornecedor_id);
CREATE INDEX idx_compras_status ON compras(status);
CREATE INDEX idx_compras_data ON compras(data_compra);

-- Inserir alguns fornecedores de exemplo
INSERT INTO fornecedores (nome, cnpj, telefone, email, endereco, contato_nome, contato_telefone, prazo_pagamento_dias, limite_credito) VALUES
('Distribuidora ABC Ltda', '12.345.678/0001-90', '(11) 99999-9999', 'contato@distribuidoraabc.com.br', 'Rua das Flores, 123 - Centro, São Paulo - SP', 'João Silva', '(11) 88888-8888', 30, 50000.00),
('Alimentos XYZ S.A.', '98.765.432/0001-10', '(21) 77777-7777', 'vendas@alimentosxyz.com.br', 'Av. Brasil, 456 - Rio de Janeiro - RJ', 'Maria Santos', '(21) 66666-6666', 45, 75000.00),
('Bebidas Premium Ltda', '55.444.333/0001-22', '(31) 55555-5555', 'comercial@bebidaspremium.com.br', 'Rua dos Vinhos, 789 - Belo Horizonte - MG', 'Pedro Oliveira', '(31) 44444-4444', 60, 100000.00);

SELECT 'Tabelas de fornecedores criadas com sucesso!' as status;