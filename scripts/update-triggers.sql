-- Script para atualizar o trigger de vendas para usar colunas específicas
-- Este script corrige o trigger para usar valor_dinheiro, valor_cartao_debito, etc.

USE pdv_supermercado;

-- Remover trigger existente
DROP TRIGGER IF EXISTS tr_venda_insert_caixa;

-- Criar novo trigger atualizado para usar as colunas específicas
DELIMITER //
CREATE TRIGGER tr_venda_insert_caixa AFTER INSERT ON vendas
FOR EACH ROW
BEGIN
    -- Se a venda tem caixa_id, processar os totais
    IF NEW.caixa_id IS NOT NULL THEN
        -- Atualizar totais no caixa usando as colunas específicas
        UPDATE caixas 
        SET total_vendas = total_vendas + NEW.total,
            total_dinheiro = total_dinheiro + COALESCE(NEW.valor_dinheiro, 0),
            total_cartao_debito = total_cartao_debito + COALESCE(NEW.valor_cartao_debito, 0),
            total_cartao_credito = total_cartao_credito + COALESCE(NEW.valor_cartao_credito, 0),
            total_pix = total_pix + COALESCE(NEW.valor_pix, 0),
            total_fiado = total_fiado + COALESCE(NEW.valor_fiado, 0)
        WHERE id = NEW.caixa_id;
    END IF;
END//
DELIMITER ;

-- Criar trigger para UPDATE de vendas (caso precise atualizar uma venda)
DELIMITER //
CREATE TRIGGER tr_venda_update_caixa AFTER UPDATE ON vendas
FOR EACH ROW
BEGIN
    -- Se a venda tem caixa_id, ajustar os totais
    IF OLD.caixa_id IS NOT NULL THEN
        -- Primeiro, subtrair os valores antigos
        UPDATE caixas 
        SET total_vendas = total_vendas - OLD.total,
            total_dinheiro = total_dinheiro - COALESCE(OLD.valor_dinheiro, 0),
            total_cartao_debito = total_cartao_debito - COALESCE(OLD.valor_cartao_debito, 0),
            total_cartao_credito = total_cartao_credito - COALESCE(OLD.valor_cartao_credito, 0),
            total_pix = total_pix - COALESCE(OLD.valor_pix, 0),
            total_fiado = total_fiado - COALESCE(OLD.valor_fiado, 0)
        WHERE id = OLD.caixa_id;
    END IF;
    
    IF NEW.caixa_id IS NOT NULL THEN
        -- Depois, somar os novos valores
        UPDATE caixas 
        SET total_vendas = total_vendas + NEW.total,
            total_dinheiro = total_dinheiro + COALESCE(NEW.valor_dinheiro, 0),
            total_cartao_debito = total_cartao_debito + COALESCE(NEW.valor_cartao_debito, 0),
            total_cartao_credito = total_cartao_credito + COALESCE(NEW.valor_cartao_credito, 0),
            total_pix = total_pix + COALESCE(NEW.valor_pix, 0),
            total_fiado = total_fiado + COALESCE(NEW.valor_fiado, 0)
        WHERE id = NEW.caixa_id;
    END IF;
END//
DELIMITER ;

-- Criar trigger para DELETE de vendas (caso precise deletar uma venda)
DELIMITER //
CREATE TRIGGER tr_venda_delete_caixa AFTER DELETE ON vendas
FOR EACH ROW
BEGIN
    -- Se a venda tinha caixa_id, subtrair os totais
    IF OLD.caixa_id IS NOT NULL THEN
        UPDATE caixas 
        SET total_vendas = total_vendas - OLD.total,
            total_dinheiro = total_dinheiro - COALESCE(OLD.valor_dinheiro, 0),
            total_cartao_debito = total_cartao_debito - COALESCE(OLD.valor_cartao_debito, 0),
            total_cartao_credito = total_cartao_credito - COALESCE(OLD.valor_cartao_credito, 0),
            total_pix = total_pix - COALESCE(OLD.valor_pix, 0),
            total_fiado = total_fiado - COALESCE(OLD.valor_fiado, 0)
        WHERE id = OLD.caixa_id;
    END IF;
END//
DELIMITER ;

SELECT 'Triggers de vendas atualizados com sucesso!' as status;
