# Discord Bot Manager SaaS

Um painel SaaS premium para gerenciamento de múltiplas instâncias de bots Discord com design moderno, tema azul escuro, glassmorphism e animações suaves. Totalmente responsivo para mobile e desktop.

## Características

### 🎯 Dashboard Principal
- **Estatísticas em Tempo Real:** Entradas, Filas Ativas, Partidas Encontradas, DMs Enviadas, Uptime e Bots Online
- **Cards Premium:** Design glassmorphism com efeitos visuais sofisticados
- **Animações Suaves:** Transições fluidas em toda a interface

### 🤖 Gerenciamento de Instâncias
- **Múltiplas Instâncias:** Suporte para BOT 1, BOT 2 e futuras instâncias sem alteração estrutural
- **Independência Total:** Cada instância tem suas próprias configurações, tokens, estatísticas e logs
- **Controle Individual:** Botões de ligar/desligar para cada bot com status em tempo real
- **Seleção Inteligente:** Selecione uma instância para ver detalhes e configurações específicas

### ⚙️ Configurações Avançadas
- **Tokens:** Gerenciamento de múltiplos tokens com rotação automática
- **Delays:** Configuração de delays de mensagem por instância
- **Mensagens:** Mensagem principal e secundária por organização
- **Categorias:** Seleção entre Mobile, Emulador, Misto, Tático e Full soco
- **Modos de Fila:** Suporte para 1x1, 2x2, 3x3 e 4x4
- **Organizações:** Gerenciamento de organizações/guilds com mensagens customizadas

### 📊 Logs em Tempo Real
- **Socket.IO:** Comunicação em tempo real via WebSocket
- **Filtros Avançados:** Filtrar por nível (INFO, SUCCESS, WARNING, ERROR)
- **Download:** Exportar logs como arquivo .txt
- **Limpeza:** Limpar todos os logs com um clique
- **Auto-scroll:** Scroll automático para o último log

### 🎨 Design Premium
- **Tema Azul Escuro:** Paleta de cores profissional SaaS
- **Glassmorphism:** Efeitos de vidro fosco nos cards
- **Animações:** Transições suaves e efeitos de hover
- **Ícones:** Lucide React para ícones consistentes
- **Tipografia:** Inter font para leitura profissional
- **Responsivo:** Totalmente adaptado para mobile e desktop

## Stack Tecnológico

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS 4** - Utility-first CSS
- **ShadCN/UI** - Componentes acessíveis
- **Socket.IO Client** - Comunicação em tempo real
- **Lucide React** - Ícones

### Backend
- **Express.js** - Web framework
- **tRPC 11** - End-to-end type-safe APIs
- **Socket.IO** - Real-time communication
- **Drizzle ORM** - Type-safe database queries
- **MySQL** - Database

### DevOps
- **Vite** - Build tool
- **Vitest** - Testing framework
- **Docker** - Containerization
- **Railway** - Hosting

## Instalação

### Pré-requisitos
- Node.js 18+
- pnpm 10+
- MySQL 8+

### Setup Local

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env

# Executar migrations do banco
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

O servidor estará disponível em `http://localhost:3000`

## Estrutura do Projeto

```
discord-automation-v2/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas principais
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── hooks/            # Custom hooks
│   │   ├── types/            # Type definitions
│   │   ├── lib/              # Utilitários
│   │   └── index.css         # Estilos globais
│   └── index.html            # HTML template
├── server/                    # Backend Express
│   ├── routers.ts            # tRPC routers
│   ├── db.ts                 # Database helpers
│   ├── socketIO.ts           # Socket.IO utilities
│   └── _core/                # Framework core
├── drizzle/                   # Database schema e migrations
├── shared/                    # Código compartilhado
└── package.json              # Dependências
```

## Arquitetura de Banco de Dados

### Tabelas Principais
- **users** - Usuários autenticados
- **instances** - Instâncias de bots
- **instanceSettings** - Configurações por instância
- **queueModes** - Modos de fila suportados
- **organizations** - Organizações/guilds
- **statistics** - Estatísticas agregadas
- **logs** - Logs em tempo real

## API tRPC

### Instâncias
```typescript
trpc.instances.list.useQuery()
trpc.instances.create.useMutation()
trpc.instances.updateStatus.useMutation()
trpc.instances.updateUptime.useMutation()
```

### Configurações
```typescript
trpc.settings.get.useQuery()
trpc.settings.save.useMutation()
```

### Modos de Fila
```typescript
trpc.queueModes.get.useQuery()
trpc.queueModes.set.useMutation()
```

### Estatísticas
```typescript
trpc.statistics.get.useQuery()
trpc.statistics.update.useMutation()
trpc.statistics.aggregated.useQuery()
```

### Logs
```typescript
trpc.logs.list.useQuery()
trpc.logs.add.useMutation()
trpc.logs.clear.useMutation()
```

## Socket.IO Events

### Client → Server
```typescript
socket.emit('subscribe:logs', instanceId)
socket.emit('unsubscribe:logs', instanceId)
```

### Server → Client
```typescript
socket.on('log', (data) => {
  // { instanceId, level, message, timestamp }
})
socket.on('stats:update', (data) => {
  // { instanceId, ...stats, timestamp }
})
socket.on('instance:status', (data) => {
  // { instanceId, status, timestamp }
})
```

## Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes em modo watch
pnpm test --watch

# Gerar coverage
pnpm test --coverage
```

## Build para Produção

```bash
# Build frontend
pnpm build

# Iniciar servidor de produção
pnpm start
```

## Deploy na Railway

1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Railway detectará automaticamente `package.json`
4. Deploy será iniciado automaticamente

### Variáveis de Ambiente Necessárias
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_ID` - Manus OAuth app ID
- `OAUTH_SERVER_URL` - OAuth server URL
- `NODE_ENV` - production

## Escalabilidade

A arquitetura foi projetada para ser escalável:

- **Múltiplas Instâncias:** Adicione BOT 3, BOT 4, etc. sem alterações estruturais
- **Banco de Dados:** Schema suporta crescimento horizontal
- **Socket.IO:** Rooms por instância para comunicação eficiente
- **tRPC:** Type-safe APIs facilitam manutenção

## Roadmap Futuro

- [ ] Integração com Discord.js para controle real de bots
- [ ] Dashboard de analytics avançado
- [ ] Sistema de webhooks
- [ ] Agendamento de tarefas
- [ ] Multi-tenancy
- [ ] API pública
- [ ] Mobile app nativa

## Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

MIT License - veja LICENSE para detalhes

## Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através do email.

---

**Desenvolvido com ❤️ usando React, TypeScript e TailwindCSS**
