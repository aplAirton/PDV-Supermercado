-- Executar no MySQL Workbench ou linha de comando
-- USE pdv_supermercado;

CREATE TABLE IF NOT EXISTS cupom_links (
  id INT NOT NULL AUTO_INCREMENT,
  venda_id INT NOT NULL,
  public_token VARCHAR(128) NOT NULL,
  qr_data_url TEXT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cupom_links_venda (venda_id),
  UNIQUE KEY uq_cupom_links_token (public_token),
  CONSTRAINT fk_cupom_links_venda
    FOREIGN KEY (venda_id) REFERENCES vendas (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cupom_links_token ON cupom_links (public_token);
CREATE INDEX idx_cupom_links_venda ON cupom_links (venda_id);

SELECT 'Tabela cupom_links criada com sucesso!' AS message;
