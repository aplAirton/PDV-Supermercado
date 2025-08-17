-- Migração: adicionar coluna forma_pagamento_json em vendas para suportar múltiplas formas
ALTER TABLE vendas
  ADD COLUMN forma_pagamento_json TEXT DEFAULT NULL;

-- Se quiser, popular forma_pagamento_json vazio com NULL
UPDATE vendas SET forma_pagamento_json = NULL WHERE forma_pagamento_json = '';

SELECT 'Coluna forma_pagamento_json adicionada (se necessário).' as status;
