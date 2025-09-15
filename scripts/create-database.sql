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

-- Tabela de Movimentações Financeiras Gerais (para todas as movimentações do sistema)
-- Recriar tabela se já existir com estrutura incorreta
DROP TABLE IF EXISTS movimentacoes_financeiras;
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

-- Adicionar índices separadamente para melhor compatibilidade
CREATE INDEX idx_mov_financeiras_tipo ON movimentacoes_financeiras(tipo);
CREATE INDEX idx_mov_financeiras_categoria ON movimentacoes_financeiras(categoria);
CREATE INDEX idx_mov_financeiras_data ON movimentacoes_financeiras(data_movimento);
CREATE INDEX idx_mov_financeiras_entidade ON movimentacoes_financeiras(entidade_tipo, entidade_id);
CREATE INDEX idx_mov_financeiras_usuario ON movimentacoes_financeiras(usuario_id);
CREATE INDEX idx_mov_financeiras_tipo_categoria ON movimentacoes_financeiras(tipo, categoria);
CREATE INDEX idx_mov_financeiras_data_range ON movimentacoes_financeiras(data_movimento, tipo);
CREATE INDEX idx_mov_financeiras_valor ON movimentacoes_financeiras(valor);
CREATE INDEX idx_mov_financeiras_referencia ON movimentacoes_financeiras(referencia(50));

-- Índices para melhor performance
CREATE INDEX idx_produtos_codigo ON produtos(codigo_barras);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_clientes_cpf ON clientes(cpf);
CREATE INDEX idx_vendas_data ON vendas(data_venda);
CREATE INDEX idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX idx_fiados_cliente ON fiados(cliente_id);
CREATE INDEX idx_fiados_status ON fiados(status);
CREATE INDEX idx_fiado_movimentos_cliente ON fiado_movimentos(cliente_id);
CREATE INDEX idx_fiado_movimentos_tipo ON fiado_movimentos(tipo);
CREATE INDEX idx_fiado_movimentos_data ON fiado_movimentos(data_movimento);

SELECT 'Banco de dados PDV criado com sucesso!' as status;
