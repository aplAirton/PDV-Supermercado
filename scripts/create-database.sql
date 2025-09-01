-- Script MySQL para Sistema PDV Supermercado
-- Criação do banco de dados e tabelas

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS pdv_supermercado;
USE pdv_supermercado;

-- Tabela de Produtos
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_barras VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    estoque_minimo INT NOT NULL DEFAULT 5,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    limite_credito DECIMAL(10,2) DEFAULT 0.00,
    debito_atual DECIMAL(10,2) DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Vendas
CREATE TABLE `vendas` (
    `id` int NOT NULL AUTO_INCREMENT,
    `cliente_id` int DEFAULT NULL,
    `total` decimal(10, 2) NOT NULL,
    `desconto` decimal(10, 2) NOT NULL DEFAULT '0.00',
    `valor_pago` decimal(10, 2) DEFAULT NULL,
    `troco` decimal(10, 2) NOT NULL DEFAULT '0.00',
    `observacoes` text,
    `data_venda` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `forma_pagamento_json` text,
    `forma_pagamento` varchar(50) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_vendas_data` (`data_venda`),
    KEY `idx_vendas_cliente` (`cliente_id`),
    CONSTRAINT `vendas_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 198 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci

-- Tabela de Itens da Venda
CREATE TABLE itens_venda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venda_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT
);

-- Tabela de Fiados (Débitos)
CREATE TABLE fiados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    venda_id INT NOT NULL,
    valor_original DECIMAL(10,2) NOT NULL,
    valor_pago DECIMAL(10,2) DEFAULT 0.00,
    valor_restante DECIMAL(10,2) NOT NULL,
    status ENUM('aberto', 'parcial', 'quitado') DEFAULT 'aberto',
    data_fiado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_vencimento DATE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE
);

-- Tabela de Pagamentos de Fiado
CREATE TABLE pagamentos_fiado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fiado_id INT NOT NULL,
    valor_pagamento DECIMAL(10,2) NOT NULL,
    forma_pagamento ENUM('dinheiro', 'cartao_debito', 'cartao_credito', 'pix') NOT NULL,
    observacoes TEXT,
    data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fiado_id) REFERENCES fiados(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX idx_produtos_codigo ON produtos(codigo_barras);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_clientes_cpf ON clientes(cpf);
CREATE INDEX idx_vendas_data ON vendas(data_venda);
CREATE INDEX idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX idx_fiados_cliente ON fiados(cliente_id);
CREATE INDEX idx_fiados_status ON fiados(status);

SELECT 'Banco de dados PDV criado com sucesso!' as status;
