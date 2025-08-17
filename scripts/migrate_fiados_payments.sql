-- Migração: Garantir tabelas para fiados e pagamentos de fiado
-- Execute este script no banco pdv_supermercado

CREATE TABLE IF NOT EXISTS fiados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  venda_id INT NOT NULL,
  valor_original DECIMAL(10,2) NOT NULL,
  valor_pago DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valor_restante DECIMAL(10,2) NOT NULL,
  status ENUM('aberto','parcial','quitado') NOT NULL DEFAULT 'aberto',
  data_fiado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_vencimento DATE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pagamentos_fiado (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fiado_id INT NOT NULL,
  valor_pagamento DECIMAL(10,2) NOT NULL,
  forma_pagamento ENUM('dinheiro', 'cartao_debito', 'cartao_credito', 'pix') NOT NULL,
  observacoes TEXT,
  data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fiado_id) REFERENCES fiados(id) ON DELETE CASCADE
);

-- Adicionar colunas caso tabela fiados exista com esquema diferente
ALTER TABLE fiados
  ADD COLUMN IF NOT EXISTS valor_original DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS valor_restante DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS status ENUM('aberto','parcial','quitado') DEFAULT 'aberto',
  ADD COLUMN IF NOT EXISTS data_fiado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS data_vencimento DATE;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_fiados_cliente ON fiados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_fiados_status ON fiados(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_fiado_fiado ON pagamentos_fiado(fiado_id);

SELECT 'Migração de fiados e pagamentos executada' as status;
