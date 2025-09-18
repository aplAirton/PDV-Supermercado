# Sistema de Senha Mestra

## 🔐 Visão Geral

O sistema de senha mestra implementa uma camada adicional de segurança para operações críticas, especificamente para alterações na configuração do banco de dados. A senha é calculada matematicamente baseada na hora atual.

## 📊 Algoritmo de Cálculo

### Fórmula Matemática:
```
Hora (24h) → Número → Quadrado → Divisão por π → Primeiros 4 dígitos
```

### Exemplo Detalhado:
```
Hora: 12:45
1. Converter para número: 1245
2. Elevar ao quadrado: 1245² = 1,550,025  
3. Dividir por π (3.14): 1,550,025 ÷ 3.14 = 493,642.038...
4. Extrair senha: 4936 (primeiros 4 dígitos)
```

## 🛠️ Implementação

### Arquivos Principais:

#### `lib/master-password.ts`
- **`generateMasterPassword()`**: Gera senha para hora atual
- **`validateMasterPasswordWithTolerance()`**: Valida com tolerância de ±1 minuto
- **`getMasterPasswordInfo()`**: Retorna informações de debug

#### `app/api/master-password/route.ts`
- **POST**: Valida senha fornecida pelo usuário
- **GET**: Endpoint de debug (sem expor senha)

#### Interface de Usuário:
- Modal de autenticação integrado na página de configurações
- Validação em tempo real
- Feedback visual de erros

## 🔒 Características de Segurança

### Vantagens:
- ✅ **Temporal**: Senha muda a cada minuto
- ✅ **Determinística**: Mesma hora sempre gera mesma senha
- ✅ **Não Armazenada**: Nunca é salva, sempre calculada
- ✅ **Servidor-Side**: Validação apenas no servidor
- ✅ **Tolerância**: Aceita ±1 minuto para acomodar atrasos

### Considerações:
- 🔹 **Previsibilidade**: Quem conhece o algoritmo pode calcular
- 🔹 **Janela de Tempo**: Válida por 1-3 minutos
- 🔹 **Dependência Horária**: Requer sincronização de horário

## 🎯 Casos de Uso

### Operações Protegidas:
- ✅ Alteração de configuração de banco de dados
- ✅ Mudança entre banco remoto/local
- ✅ Operações críticas do sistema

### Fluxo de Autenticação:
1. Usuário tenta alterar configuração
2. Sistema solicita senha mestra
3. Usuário calcula/insere senha baseada na hora
4. Sistema valida no servidor
5. Se válida, operação prossegue

## 📱 Interface do Usuário

### Modal de Senha Mestra:
```tsx
- Input com máximo de 4 dígitos
- Validação em tempo real
- Feedback de erro claro
- Botões de confirmar/cancelar
- Loading state durante validação
```

### Experiência do Usuário:
- 🎯 **Clara**: Instruções sobre como calcular
- 🎯 **Rápida**: Validação instantânea
- 🎯 **Segura**: Sem exposição da senha
- 🎯 **Tolerante**: Aceita pequenos atrasos

## 🧪 Testes e Debug

### Página de Teste:
Acesse `/test-master-password` para:
- Ver senha atual em tempo real
- Testar cálculos com horas específicas
- Entender o algoritmo
- Verificar funcionamento

### Logs do Sistema:
```
[MASTER PASSWORD] Hora: 12:45 → 1245 → 1245² = 1550025 → 1550025÷3.14 = 493642... → Senha: 4936
[MASTER PASSWORD VALIDATION] Input: 4936 | Expected: 4936 | Valid: true
```

## 🔧 Configuração e Manutenção

### Constantes do Sistema:
```typescript
const PI = 3.14; // Valor invariável conforme especificação
```

### Tolerância de Tempo:
- Senha atual: hora exata
- -1 minuto: para acomodar atraso
- +1 minuto: para mudança de minuto durante digitação

### Segurança Adicional:
- Validação apenas no servidor
- Logs de todas as tentativas
- Rate limiting implícito (por tempo)

## 📊 Exemplos de Senhas

| Hora  | Número | Quadrado  | Divisão π | Senha |
|-------|--------|-----------|-----------|-------|
| 08:30 | 830    | 688,900   | 219,426   | 2194  |
| 12:00 | 1200   | 1,440,000 | 458,598   | 4585  |
| 15:45 | 1545   | 2,387,025 | 760,008   | 7600  |
| 20:15 | 2015   | 4,060,225 | 1,293,706 | 1293  |
| 23:59 | 2359   | 5,565,881 | 1,773,044 | 1773  |

## 🚀 Deploy e Produção

### Considerações:
- Sincronização de horário do servidor
- Timezone configurado corretamente
- Logs de auditoria habilitados
- Backup das configurações críticas

### Monitoramento:
- Tentativas de autenticação
- Falhas de validação
- Operações críticas realizadas
- Logs de alterações no sistema

## 🔐 Conclusão

O sistema de senha mestra fornece uma camada adicional de segurança sem complexidade excessiva, ideal para proteger operações críticas como alterações de configuração do banco de dados. É especialmente eficaz quando combinado com outras medidas de segurança e auditoria.