# Discord Bot Manager SaaS - TODO

## Backend
- [x] Schema Drizzle com tabelas de instâncias, configurações, modos de fila, organizações, estatísticas e logs
- [x] Helpers de banco de dados (db.ts) com CRUD completo
- [x] Routers tRPC com procedimentos protegidos para todas as operações
- [x] Integração Socket.IO para logs em tempo real
- [x] Módulo socketIO.ts para emissão de eventos
- [ ] Sistema de gerenciamento de processos de bots (spawn/kill/restart)
- [ ] Emissão de eventos em tempo real para atualização de estatísticas

## Frontend
- [x] Layout DashboardLayout com sidebar navegação
- [x] Dashboard principal com cards de estatísticas (Entradas, Filas, Partidas, DMs, Uptime, Bots Online)
- [x] Página de instâncias com lista de bots e seleção individual
- [x] Card de instância com status, uptime e botões de ligar/desligar
- [x] Página de configurações por instância com formulário completo
- [x] Página de logs em tempo real com filtros por nível
- [x] Tema azul escuro com glassmorphism e animações suaves
- [x] Design responsivo para mobile e desktop
- [x] Componentes ShadCN/UI integrados

## Design Visual
- [x] Paleta de cores azul escuro premium
- [x] Efeitos glassmorphism nos cards
- [x] Animações suaves em transições
- [x] Ícones Lucide React integrados
- [x] Tipografia profissional SaaS

## Testes
- [x] Vitest para helpers de banco de dados (20 testes passando)
- [ ] Testes para procedimentos tRPC
- [ ] Testes de integração Socket.IO

## Deploy
- [ ] Configuração Docker para Railway
- [ ] Variáveis de ambiente para produção
- [ ] Build otimizado para produção
- [ ] Push para GitHub com histórico de commits
