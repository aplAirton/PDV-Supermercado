-- Migration: criar tabela de cupons fiscais
USE pdv_supermercado;

CREATE TABLE IF NOT EXISTS cupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venda_id INT NOT NULL,
  conteudo_texto TEXT NOT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE
);

CREATE INDEX idx_cupons_venda ON cupons(venda_id);

SELECT 'migration_cupons ok' as status;
