-- Execute este comando diretamente no MySQL Workbench ou linha de comando
-- Primeiro, conecte ao banco: USE pdv_supermercado;

-- Verificar se a tabela existe
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema = 'pdv_supermercado' 
AND table_name = 'cupom_links';

-- Se a tabela não existir, execute os comandos abaixo:

CREATE TABLE IF NOT EXISTS cupom_links (
  id INT NOT NULL AUTO_INCREMENT,
  venda_id INT NOT NULL,
  public_token VARCHAR(128) NOT NULL,
  qr_data_url TEXT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cupom_links_venda (venda_id),
  UNIQUE KEY uq_cupom_links_token (public_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar se a tabela foi criada
DESCRIBE cupom_links;
