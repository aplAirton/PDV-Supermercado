# INSTRUÇÕES PARA IMPLEMENTAR SANGRIAS NO PDV

## 1. Execute o Script SQL

Execute o arquivo `scripts/create-caixa-sangrias.sql` no seu banco de dados MySQL para criar a tabela específica de sangrias.

```sql
-- Comando para executar via MySQL CLI
mysql -u seu_usuario -p seu_banco_dados < scripts/create-caixa-sangrias.sql

-- Ou execute diretamente no MySQL Workbench/phpMyAdmin o conteúdo do arquivo
```

## 2. Verificar Estrutura da Tabela

A tabela `caixa_sangrias` foi criada com a seguinte estrutura:

- `id`: Primary key auto increment
- `caixa_id`: FK para caixas (NOT NULL)
- `funcionario_id`: FK para funcionários (opcional)
- `valor`: DECIMAL(10,2) NOT NULL (valor da sangria)
- `descricao`: TEXT (descrição/motivo da sangria)
- `data_criacao`: TIMESTAMP automático
- `data_atualizacao`: TIMESTAMP automático

## 3. Funcionalidades Implementadas

### ✅ API Atualizada (`/api/caixa/[id]`)
- **Sangrias**: Agora salvas na tabela `caixa_sangrias` + atualização do `total_sangrias` na tabela `caixas`
- **Fechamento**: Lógica atualizada para buscar sangrias da tabela específica
- **Compatibilidade**: Mantida com sistema anterior

### ✅ Frontend (`app/caixa/page.tsx`)
- **Botão Sangria**: Adicionado no modal de resumo (apenas para caixas abertos)
- **Modal de Sangria**: Formulário completo com validação
- **Estados**: Controle de loading e processamento
- **Feedback**: Mensagens de sucesso/erro

### ✅ Impressão de Resumo (`/api/caixa/[id]/resumo/cupom`)
- **Sangrias Detalhadas**: Lista individual de cada sangria
- **Total Correto**: Cálculo preciso incluindo sangrias
- **Seção Específica**: Movimentações agora incluem sangrias detalhadas

## 4. Como Usar

1. **Realizar Sangria**:
   - Abrir modal de resumo de um caixa aberto
   - Clicar em "Sangria" (botão vermelho com seta para baixo)
   - Informar valor obrigatório e descrição opcional
   - Confirmar operação

2. **Visualizar no Resumo**:
   - Valor total aparece na linha "Sangrias"
   - Movimentações individuais aparecem na seção detalhada
   - Cálculo automático do valor esperado

3. **Impressão**:
   - Todas as sangrias aparecem no resumo impresso
   - Valores corretos calculados automaticamente

## 5. Banco de Dados

### Relacionamentos
```
caixas (1) ←→ (N) caixa_sangrias
funcionarios (1) ←→ (N) caixa_sangrias (opcional)
```

### Índices Criados
- `idx_caixa_id`: Performance para consultas por caixa
- `idx_funcionario_id`: Performance para consultas por funcionário  
- `idx_data_criacao`: Performance para consultas por data
- `idx_caixa_data`: Índice composto para relatórios

## 6. Observações Técnicas

- **Transações**: Cada sangria atualiza simultaneamente `caixa_sangrias` e `caixas.total_sangrias`
- **Compatibilidade**: Sistema funciona mesmo se tabela `caixa_sangrias` não existir
- **Validação**: Valores obrigatórios > 0, descrição opcional
- **Segurança**: Apenas caixas abertos podem ter sangrias
- **Auditoria**: Registro completo com timestamps automáticos

---

**IMPORTANTE**: Execute o script SQL antes de testar as sangrias no sistema!
