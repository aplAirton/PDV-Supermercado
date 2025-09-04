# Scanner de Código de Barras - PDV Supermercado

## 🚀 **Nova Implementação - ZXing**
Migrou do QuaggaJS para **@zxing/library** + **@zxing/browser** para melhor precisão na detecção de códigos de barras.

### ✅ **Melhorias da Biblioteca ZXing:**
- **Maior precisão** na detecção de códigos
- **Melhor compatibilidade** com diferentes navegadores
- **Suporte robusto** a múltiplos formatos:
  - Code 128, Code 39
  - EAN-13, EAN-8  
  - UPC-A, UPC-E
- **Detecção em tempo real** mais eficiente
- **Fallback inteligente** para canvas se necessário

## 🚨 Problemas Comuns

### Chrome em Rede Local (HTTP)
**Problema**: "Site não confiável" - câmera não solicita permissão

**Solução 1 - Configurar Chrome (Rápido):**
1. Abra: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Adicione sua URL local (ex: `http://192.168.1.100:3000`)
3. Reinicie o Chrome
4. Teste a câmera novamente

**Solução 2 - HTTPS Local (Recomendado):**
```bash
# Gerar certificado local
npx create-next-app@latest --example with-https
# ou usar mkcert
```

### Safari/iOS
**Problema**: "Não possui suporte a câmera"

**Soluções:**
- **iPhone/iPad**: Configurações → Safari → Câmera → Permitir
- **Safari Desktop**: Safari → Preferências → Sites → Câmera
- **iOS Específico**: Configurações → Privacidade → Câmera → Safari

### Testes Recomendados
1. Primeiro teste em `localhost` (sempre funciona)
2. Se não funcionar em IP local, aplicar configurações acima
3. Use "Digitar Código" como alternativa

## 🔧 **Dependências Instaladas:**
```bash
npm install @zxing/library @zxing/browser
```

## 📱 Compatibilidade
- ✅ Chrome (com configuração HTTPS)
- ✅ Firefox 
- ✅ Safari (com permissões corretas)
- ✅ Edge
- ✅ ZXing funciona melhor em todos os navegadores
- ⚠️ Browsers antigos (use atualização)

## 🎯 **Como Funciona:**
1. **Detecção primária**: ZXing BrowserMultiFormatReader
2. **Fallback**: Scanner canvas manual com ZXing
3. **Última opção**: Entrada manual de código
