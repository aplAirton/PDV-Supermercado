-- Inserir dados de exemplo no sistema PDV

USE pdv_supermercado;

-- Produtos de exemplo
INSERT INTO produtos (codigo_barras, nome, categoria, preco, estoque, estoque_minimo) VALUES
('7891000100103', 'Arroz Tio João 5kg', 'Grãos', 25.90, 50, 10),
('7891000053003', 'Feijão Carioca 1kg', 'Grãos', 8.50, 30, 5),
('7891000315507', 'Açúcar Cristal União 1kg', 'Açúcar', 4.20, 40, 8),
('7891000244807', 'Óleo de Soja Soya 900ml', 'Óleos', 6.80, 25, 5),
('7891000100004', 'Macarrão Espaguete 500g', 'Massas', 3.50, 60, 15),
('7891118000506', 'Leite Integral Parmalat 1L', 'Laticínios', 4.90, 35, 10),
('7891000053201', 'Café Pilão 500g', 'Bebidas', 12.90, 20, 5),
('7891000100202', 'Sabão em Pó Omo 1kg', 'Limpeza', 15.80, 15, 3),
('7891000244906', 'Detergente Ypê 500ml', 'Limpeza', 2.30, 45, 10),
('7891000315408', 'Papel Higiênico Neve 4 rolos', 'Higiene', 8.90, 25, 8);

-- Clientes de exemplo
INSERT INTO clientes (nome, cpf, telefone, endereco, limite_credito) VALUES
('João Silva Santos', '123.456.789-01', '(11) 99999-1234', 'Rua das Flores, 123 - Centro', 500.00),
('Maria Oliveira Costa', '987.654.321-02', '(11) 88888-5678', 'Av. Principal, 456 - Jardim', 300.00),
('Pedro Souza Lima', '456.789.123-03', '(11) 77777-9012', 'Rua da Paz, 789 - Vila Nova', 200.00),
('Ana Paula Ferreira', '321.654.987-04', '(11) 66666-3456', 'Rua do Comércio, 321 - Centro', 400.00),
('Carlos Eduardo Rocha', '789.123.456-05', '(11) 55555-7890', 'Av. Santos Dumont, 654 - Aeroporto', 600.00);

SELECT 'Dados de exemplo inseridos com sucesso!' as status;
