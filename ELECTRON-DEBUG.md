# 🔧 Problema: Electron Abre Mas Não Carrega a Página

## 📋 Soluções Disponíveis:

### 1. **Script Melhorado (Recomendado)**
```bash
npm run electron:dev
```
- Timeout aumentado para 30 segundos
- Melhor tratamento de erros
- Logs detalhados no console

### 2. **Script Simples para Windows**
```bash
npm run electron:dev:simple
```
- Usa `timeout` do Windows
- Aguarda 10 segundos antes de iniciar Electron
- Mais direto, menos dependências

### 3. **Execução Manual (Debug)**
```bash
# Terminal 1 - Iniciar Next.js
npm run dev

# Terminal 2 - Aguardar e iniciar Electron (após Next.js carregar)
electron .
```

## 🔍 **Como Verificar se Está Funcionando:**

### ✅ **Sinais de Sucesso:**
- Console mostra: `✅ Página carregada com sucesso!`
- Título da janela muda para: `PDV Supermercado - Pronto`
- Interface do PDV aparece normalmente
- Controles da janela funcionam (minimizar/maximizar/fechar)

### ❌ **Sinais de Problema:**
- Console mostra: `❌ Falha ao carregar página:`
- Título permanece: `PDV Supermercado - Carregando...`
- Janela branca ou erro de conexão
- Título muda para: `PDV Supermercado - Erro de Carregamento`

## 🛠️ **Soluções Alternativas:**

### A. **Verificar Porta 3000**
```bash
# Verificar se algo está usando a porta 3000
netstat -ano | findstr :3000

# Se necessário, matar processo
taskkill /PID <PID> /F
```

### B. **Limpar Cache do Next.js**
```bash
# Limpar cache
rm -rf .next
npm run dev
```

### C. **Verificar Firewall**
- Certifique-se que o firewall não está bloqueando conexões locais
- Ou temporariamente desabilite o firewall para teste

### D. **Usar IP em vez de localhost**
Se `localhost` não funcionar, tente alterar no `main.js`:
```javascript
const startUrl = isDev
  ? 'http://127.0.0.1:3000'  // Em vez de localhost
  : `file://${path.join(__dirname, '../out/index.html')}`;
```

## 📊 **Logs para Debug:**

Os logs no console do Electron mostrarão:
- `🔗 Carregando URL: http://localhost:3000`
- `🛠️ Modo desenvolvimento: true`
- `✅ Página carregada com sucesso!` (sucesso)
- `❌ Falha ao carregar página:` (erro)

## 🎯 **Teste Sequencial:**

1. Execute: `npm run electron:dev`
2. Aguarde os logs no console
3. Se falhar, tente: `npm run electron:dev:simple`
4. Se ainda falhar, use a execução manual

O problema geralmente é relacionado ao timing entre Next.js e Electron. As melhorias aplicadas devem resolver isso! 🚀
