-- Script para adicionar triggers de validação à tabela movimentacoes_financeiras
-- Execute este script APÓS executar o fix-fiado-movimentos.sql

USE pdv_supermercado;

DELIMITER //

-- Trigger para validar entidade_id antes de INSERT
CREATE TRIGGER trg_mov_financeiras_before_insert
BEFORE INSERT ON movimentacoes_financeiras
FOR EACH ROW
BEGIN
    -- Validar que entidade_id existe na tabela correta
    IF NEW.entidade_tipo = 'cliente' AND NEW.entidade_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM clientes WHERE id = NEW.entidade_id) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cliente não encontrado';
        END IF;
    END IF;

    IF NEW.entidade_tipo = 'fornecedor' AND NEW.entidade_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM fornecedores WHERE id = NEW.entidade_id) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fornecedor não encontrado';
        END IF;
    END IF;

    -- Validar regras de negócio
    IF NEW.tipo = 'saida' AND NEW.categoria IN ('pagamento_fornecedor', 'sangria') AND NEW.valor <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Valor de saída deve ser positivo';
    END IF;

    IF NEW.tipo = 'entrada' AND NEW.categoria IN ('venda', 'pagamento_fiado', 'suprimento') AND NEW.valor <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Valor de entrada deve ser positivo';
    END IF;
END//

-- Trigger para validar entidade_id antes de UPDATE
CREATE TRIGGER trg_mov_financeiras_before_update
BEFORE UPDATE ON movimentacoes_financeiras
FOR EACH ROW
BEGIN
    -- Validar que entidade_id existe na tabela correta (se mudou)
    IF NEW.entidade_tipo != OLD.entidade_tipo OR NEW.entidade_id != OLD.entidade_id THEN
        IF NEW.entidade_tipo = 'cliente' AND NEW.entidade_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM clientes WHERE id = NEW.entidade_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cliente não encontrado';
            END IF;
        END IF;

        IF NEW.entidade_tipo = 'fornecedor' AND NEW.entidade_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM fornecedores WHERE id = NEW.entidade_id) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fornecedor não encontrado';
            END IF;
        END IF;
    END IF;
END//

DELIMITER ;

SELECT 'Triggers de validação criados com sucesso!' as status;