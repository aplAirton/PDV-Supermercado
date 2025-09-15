-- Dados de exemplo para fornecedores no sistema PDV

USE pdv_supermercado;

-- Fornecedores adicionais de exemplo
INSERT INTO fornecedores (nome, cnpj, telefone, email, endereco, contato_nome, contato_telefone, prazo_pagamento_dias, limite_credito) VALUES
('Carnes Premium Ltda', '11.222.333/0001-44', '(41) 33333-3333', 'vendas@carnespremium.com.br', 'Rua das Carnes, 1000 - Curitiba - PR', 'Roberto Carneiro', '(41) 22222-2222', 20, 30000.00),
('Hortifruti Verde S.A.', '77.888.999/0001-66', '(85) 11111-1111', 'comercial@hortifrutiverde.com.br', 'Av. das Frutas, 2000 - Fortaleza - CE', 'Lucia Verde', '(85) 00000-0000', 15, 25000.00),
('Padaria Central Ltda', '44.555.666/0001-77', '(51) 99999-0000', 'contato@padariacentral.com.br', 'Rua do Pão, 3000 - Porto Alegre - RS', 'Fernando Padeiro', '(51) 88888-1111', 25, 15000.00);

-- Compras de exemplo
INSERT INTO compras (fornecedor_id, numero_nota_fiscal, valor_total, valor_pago, valor_restante, status, data_compra, data_vencimento, observacoes) VALUES
(1, 'NF0012024001', 15000.00, 15000.00, 0.00, 'quitado', '2024-01-15 10:00:00', '2024-02-14', 'Compra mensal de produtos diversos'),
(2, 'NF0022024001', 8500.00, 4250.00, 4250.00, 'parcial', '2024-01-20 14:30:00', '2024-02-04', 'Compra de frutas e verduras'),
(3, 'NF0032024001', 3200.00, 0.00, 3200.00, 'aberto', '2024-01-25 09:15:00', '2024-02-19', 'Compra de pães e doces'),
(4, 'NF0042024001', 12000.00, 6000.00, 6000.00, 'parcial', '2024-02-01 11:45:00', '2024-02-21', 'Compra de carnes bovinas'),
(5, 'NF0052024001', 6800.00, 6800.00, 0.00, 'quitado', '2024-02-05 16:20:00', '2024-02-20', 'Compra de legumes e verduras');

-- Itens das compras de exemplo
INSERT INTO itens_compra (compra_id, produto_id, quantidade, preco_unitario, subtotal) VALUES
(1, 1, 20, 22.50, 450.00),
(1, 2, 30, 7.80, 234.00),
(1, 3, 50, 3.90, 195.00),
(1, 4, 25, 6.20, 155.00),
(2, 1, 15, 23.00, 345.00),
(2, 2, 20, 8.00, 160.00),
(3, 5, 40, 3.20, 128.00),
(3, 6, 25, 4.50, 112.50),
(4, 7, 10, 12.00, 120.00),
(4, 8, 5, 15.00, 75.00),
(5, 9, 30, 2.10, 63.00),
(5, 10, 20, 8.50, 170.00);

-- Pagamentos de fornecedores de exemplo
INSERT INTO pagamentos_fornecedor (fornecedor_id, valor_pagamento, forma_pagamento, numero_documento, observacoes, data_pagamento, data_vencimento, status) VALUES
(1, 15000.00, 'transferencia', 'TRANS001', 'Pagamento total da compra NF0012024001', '2024-01-16 08:00:00', '2024-02-14', 'pago'),
(2, 4250.00, 'pix', 'PIX002', 'Pagamento parcial da compra NF0022024001', '2024-01-22 10:30:00', '2024-02-04', 'pago'),
(3, 1600.00, 'dinheiro', 'REC003', 'Pagamento parcial da compra NF0032024001', '2024-01-28 14:15:00', '2024-02-19', 'pago'),
(4, 6000.00, 'cheque', 'CHQ004', 'Pagamento parcial da compra NF0042024001', '2024-02-03 09:45:00', '2024-02-21', 'pago'),
(5, 6800.00, 'cartao_credito', 'CRED005', 'Pagamento total da compra NF0052024001', '2024-02-06 11:20:00', '2024-02-20', 'pago'),
(2, 4250.00, 'pix', 'PIX006', 'Pagamento restante da compra NF0022024001', '2024-02-10 16:00:00', '2024-02-04', 'pendente'),
(3, 1600.00, 'transferencia', 'TRANS007', 'Pagamento restante da compra NF0032024001', '2024-02-15 13:30:00', '2024-02-19', 'pendente'),
(4, 6000.00, 'dinheiro', 'REC008', 'Pagamento restante da compra NF0042024001', '2024-02-20 10:00:00', '2024-02-21', 'pendente');

SELECT 'Dados de exemplo para fornecedores inseridos com sucesso!' as status;