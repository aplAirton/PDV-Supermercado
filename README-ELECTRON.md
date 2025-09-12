# PDV Supermercado - Aplicação Desktop

Sistema de Ponto de Venda (PDV) para supermercados desenvolvido com Next.js e Electron.

## 🚀 Como executar

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento (Web)
npm run dev

# Executar como aplicação desktop
npm run electron:dev
```

### Build para produção
```bash
# Build para todas as plataformas
npm run dist

# Build específico para Windows
npm run dist:win

# Build específico para Linux
npm run dist:linux

# Build específico para macOS
npm run dist:mac
```

## 📋 Funcionalidades

- ✅ Gestão de produtos
- ✅ Controle de vendas
- ✅ Gestão de clientes
- ✅ Controle de caixa
- ✅ Relatórios financeiros
- ✅ Interface desktop nativa (Electron)

## 🛠️ Tecnologias utilizadas

- **Frontend**: Next.js 15, React, TypeScript
- **UI**: Radix UI, Tailwind CSS
- **Banco de dados**: MySQL com Prisma ORM
- **Desktop**: Electron
- **Build**: electron-builder

## 🖥️ Recursos do Electron

Quando executado como aplicação desktop, o sistema oferece:

- **Controles da janela**: Minimizar, maximizar, fechar
- **Notificações nativas**: Alertas do sistema
- **Impressão**: Suporte nativo à impressão
- **Acesso ao sistema de arquivos**: Para backup e relatórios
- **Menu personalizado**: Atalhos e funcionalidades específicas

## 📁 Estrutura do projeto

```
├── app/                    # Páginas Next.js
├── components/             # Componentes React
├── electron/               # Arquivos do Electron
│   ├── main.js            # Processo principal
│   └── preload.js         # Ponte segura
├── hooks/                 # Hooks personalizados
├── lib/                   # Utilitários e configurações
├── public/                # Arquivos estáticos
└── styles/                # Estilos CSS
```

## 🔧 Configuração do banco de dados

1. Configure o MySQL no arquivo `lib/database.ts`
2. Execute as migrações do Prisma:
   ```bash
   npm run prisma:migrate:dev
   ```
3. Popule o banco com dados iniciais:
   ```bash
   # Execute o script seed-data.sql no MySQL
   ```

## 📦 Distribuição

Os arquivos de instalação serão gerados na pasta `dist/` após o build:

- **Windows**: `.exe` installer
- **Linux**: `.deb` e AppImage
- **macOS**: `.dmg` disk image

## 🎯 Próximos passos

- [ ] Implementar backup automático
- [ ] Adicionar suporte a leitores de código de barras
- [ ] Criar sistema de permissões de usuário
- [ ] Implementar sincronização com nuvem
- [ ] Adicionar suporte a múltiplas lojas

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
