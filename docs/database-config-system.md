# Sistema de Configuração de Banco de Dados

Este documento explica como funciona o sistema de persistência e roteamento de banco de dados implementado na aplicação PDV Supermercado.

## Problema Resolvido

**Problema**: A aplicação sempre voltava a usar o banco remoto após reload da página, mesmo quando o usuário havia configurado para usar o banco local.

**Solução**: Sistema completo de persistência e roteamento de banco de dados com logs em tempo real.

## Arquitetura da Solução

### 1. **Arquivo de Configuração Persistente**
- **Arquivo**: `database-config.json` (na raiz do projeto)
- **Conteúdo**: Armazena qual banco está sendo usado (`remote` ou `local`) e timestamp da última alteração
- **Vantagem**: Persiste entre reinicializações da aplicação

### 2. **Módulo de Configuração (`lib/database-config.ts`)**
- Gerencia leitura/escrita do arquivo de configuração
- Mantém estado em memória para performance
- Funções principais:
  - `getCurrentDatabaseType()`: Obtém tipo atual
  - `updateDatabaseConfig(type)`: Atualiza configuração
  - `reloadDatabaseConfig()`: Recarrega do arquivo

### 3. **Sistema de Roteamento (`lib/database.ts`)**
- **Interceptação de Conexões**: Toda conexão passa pela função `ensureConfigUpdated()`
- **Recarregamento Automático**: Verifica se configuração mudou antes de cada operação
- **Funções Melhoradas**:
  - `getConnection()`: Sempre usa configuração mais atual
  - `executeQuery()`: Força verificação antes de executar

### 4. **Sistema de Logs**
- **Arquivo**: Implementado em `lib/database.ts`
- **Funcionalidades**:
  - Log de todas as operações (conexão, queries, erros)
  - Identificação do banco usado (remoto/local)
  - Timestamps precisos
  - Limite de 100 logs (mantém os mais recentes)

### 5. **APIs de Gerenciamento**
- **`/api/database-config`**: 
  - GET: Obtém configuração atual
  - POST: Altera configuração
- **`/api/database-logs`**: 
  - GET: Obtém logs
  - DELETE: Limpa logs

### 6. **Interface de Configuração**
- **Modal de Loading**: Feedback visual durante alterações
- **Modal de Logs**: Visualização em tempo real dos logs
- **Status em Tempo Real**: Mostra qual banco está ativo

## Fluxo de Funcionamento

### Alteração de Banco de Dados:
1. Usuário clica em "Configurar" no banco de dados
2. Escolhe entre remoto/local
3. Sistema salva no `database-config.json`
4. Próximas operações usam nova configuração automaticamente

### Inicialização da Aplicação:
1. `database-init.ts` executa automaticamente
2. Carrega configuração do `database-config.json`
3. Todas as conexões respeitam a configuração salva

### Durante as Operações:
1. Cada `executeQuery()` verifica se configuração mudou
2. Se mudou, atualiza estado interno
3. Usa sempre a configuração mais atual
4. Registra log da operação

## Logs Disponíveis

- **CONNECTION_CREATE**: Iniciando conexão
- **CONNECTION_SUCCESS**: Conexão estabelecida  
- **CONNECTION_ERROR**: Erro na conexão
- **QUERY_EXECUTE**: Executando query
- **QUERY_SUCCESS**: Query executada com sucesso
- **QUERY_ERROR**: Erro na query
- **CONFIG_RELOAD**: Configuração recarregada
- **INIT**: Inicialização do sistema

## Vantagens da Solução

✅ **Persistência Completa**: Configuração mantida após reload
✅ **Transparência**: Todas as operações passam pelo sistema  
✅ **Logs Detalhados**: Rastreamento completo das operações
✅ **Feedback Visual**: Interface clara sobre qual banco está ativo
✅ **Performance**: Estado em memória + verificação apenas quando necessário
✅ **Confiabilidade**: Sistema de fallback para configuração padrão

## Monitoramento

### Interface de Logs:
- Acesse em Configurações → "Ver Logs"
- Mostra todas as operações em tempo real
- Diferencia entre banco remoto e local
- Timestamps precisos para auditoria

### Console de Desenvolvimento:
- Todos os logs também aparecem no console
- Formato: `[DATABASE REMOTE/LOCAL] Operação - Detalhes`

## Arquivos Principais

```
lib/
├── database-config.ts     # Gerencia configuração persistente
├── database-init.ts       # Inicialização automática
└── database.ts           # Sistema principal com roteamento

app/api/
├── database-config/      # API para alterar configuração
└── database-logs/        # API para visualizar logs

database-config.json      # Arquivo de configuração (criado automaticamente)
```

## Resolução do Problema Original

**Antes**: Aplicação sempre usava banco remoto como padrão
**Depois**: Sistema verifica arquivo de configuração e usa o banco escolhido pelo usuário

A solução garante que a configuração escolhida pelo usuário seja **sempre respeitada**, mesmo após reloads, reinicializações ou deployments da aplicação.