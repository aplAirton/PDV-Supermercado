-- Script para inserir funcionários de exemplo
-- Execute este script após criar o sistema de caixa

INSERT INTO funcionarios (nome, cargo, salario, ativo, data_admissao) VALUES 
('Airton Silva', 'Gerente', 2500.00, TRUE, '2024-01-15'),
('Maria Santos', 'Operadora de Caixa', 1400.00, TRUE, '2024-02-01'),
('João Oliveira', 'Vendedor', 1350.00, TRUE, '2024-03-10'),
('Ana Costa', 'Operadora de Caixa', 1400.00, TRUE, '2024-04-05');

-- Verificar se os funcionários foram inseridos
SELECT * FROM funcionarios WHERE ativo = TRUE;
