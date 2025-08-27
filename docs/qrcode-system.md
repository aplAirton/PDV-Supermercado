# Sistema de QR Code para Cupons

Este sistema permite gerar QR codes para cupons de venda que podem ser acessados publicamente online.

## Como Funciona

1. **Geração Automática**: Quando uma venda é criada, automaticamente são gerados:
   - Um token público único (64 caracteres hex)
   - Uma URL pública para o cupom (`/cupom/{token}`)
   - Um QR code que aponta para esta URL

2. **Acesso Público**: Qualquer pessoa com o QR code pode:
   - Escanear o código para acessar a URL
   - Ver o cupom formatado online
   - Imprimir o cupom se necessário

## Setup Necessário

### 1. Executar Migration
Execute o arquivo SQL no seu banco MySQL:
```sql
-- Localizado em: scripts/migration-cupom-links.sql
```

### 2. Configurar Variável de Ambiente
Adicione ao seu `.env.local`:
```env
NEXT_PUBLIC_BASE_URL=https://seu-dominio.com
```

### 3. Regenerar Cliente Prisma
```bash
npx prisma generate
```

## APIs Disponíveis

### GET /api/cupom/[token]
Retorna dados estruturados do cupom para consumo da página pública.

**Exemplo de resposta:**
```json
{
  "cupom": {
    "venda_id": 123,
    "data_venda": "2025-01-01T10:00:00Z",
    "total": 45.50,
    "cliente_nome": "João Silva",
    "conteudo_texto": "=== CUPOM FISCAL ===...",
    "itens": [...]
  }
}
```

### GET /api/vendas/[id]/qrcode
Retorna informações do QR code de uma venda específica.

**Exemplo de resposta:**
```json
{
  "public_token": "abc123...",
  "qr_data_url": "https://api.qrserver.com/v1/create-qr-code/...",
  "cupom_url": "https://seu-dominio.com/cupom/abc123...",
  "criado_em": "2025-01-01T10:00:00Z"
}
```

## Páginas

### /cupom/[token]
Página pública que exibe:
- Cupom fiscal formatado (igual ao texto original)
- Informações estruturadas da venda
- Tabela de itens
- Botão para imprimir
- Responsivo para mobile

## Fluxo de Uso

1. **Venda Criada** → Token e QR gerados automaticamente
2. **QR Code Impresso** → No cupom físico ou separadamente
3. **Cliente Escaneia** → Acessa `/cupom/{token}`
4. **Visualização Online** → Cupom formatado + dados estruturados
5. **Opção de Impressão** → Cliente pode imprimir se necessário

## Características Técnicas

- **Tokens Únicos**: 64 caracteres hex (256 bits de entropia)
- **QR Code Externo**: Usa qr-server.com (sem dependências)
- **Validação**: Tokens validados no backend
- **Performance**: Consultas otimizadas com índices
- **Segurança**: Tokens não-guessáveis, sem dados sensíveis na URL

## Customizações Possíveis

- **Layout do Cupom**: Editar `app/cupom/[token]/page.tsx`
- **Formato do QR**: Modificar `lib/cupom-utils.ts`
- **Dados Retornados**: Ajustar `app/api/cupom/[token]/route.ts`
- **Tamanho do QR**: Parâmetro `size` na função `generateQRCodeDataUrl`
