-- Cria a tabela fiado_movimentos para registrar lançamentos e pagamentos de fiado
CREATE TABLE IF NOT EXISTS fiado_movimentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  fiado_id INT NULL,
  venda_id INT NULL,
  tipo ENUM('lancamento','pagamento','ajuste') NOT NULL,
  direcao ENUM('debito','credito') NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  saldo_after DECIMAL(10,2) NULL,
  descricao TEXT NULL,
  referencia VARCHAR(100) NULL,
  criado_por VARCHAR(100) NULL,
  data_movimento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_mov_fiado FOREIGN KEY (fiado_id) REFERENCES fiados(id) ON DELETE SET NULL,
  CONSTRAINT fk_mov_venda FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE SET NULL
);

CREATE INDEX idx_fiado_mov_cliente ON fiado_movimentos(cliente_id);
CREATE INDEX idx_fiado_mov_data ON fiado_movimentos(data_movimento);
CREATE INDEX idx_fiado_mov_fiado ON fiado_movimentos(fiado_id);

-- Exemplo de uso e instruções:
-- 1) Após criar a tabela, incluir movimentos nas mesmas transações onde se criam vendas/fiados e pagamentos.
-- 2) Use a consulta de extrato (server-side) ou o endpoint /api/fiados/:clienteId/extrato que já vem implementado.
