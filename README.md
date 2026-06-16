# Discord Automation - Python Backend

Refatoração completa do backend de automação Discord de TypeScript/Express para Python/FastAPI, com simplificação da arquitetura e consolidação do banco de dados.

## 🎯 Objetivo

Migrar o backend da automação Discord para uma stack Python moderna, mantendo as funcionalidades essenciais enquanto reduz a complexidade da arquitetura.

## 📋 Stack Tecnológica

- **Linguagem**: Python 3.11+
- **Framework Web/API**: FastAPI (substitui Express + tRPC)
- **Comunicação em Tempo Real**: WebSockets nativos do FastAPI (substitui Socket.IO)
- **Banco de Dados**: SQLite (desenvolvimento) / PostgreSQL (produção)
- **ORM**: SQLAlchemy 2.0 + SQLModel
- **Automação Discord**: discord.py-self (equivalente ao discord.js-selfbot-v13)

## 📁 Estrutura de Pastas

```
discord-automation-python/
├── app/
│   ├── __init__.py              # Inicialização do pacote
│   ├── main.py                  # Ponto de entrada do FastAPI
│   ├── database.py              # Modelos SQLAlchemy consolidados
│   ├── bot_manager.py           # Gerenciador de instâncias de bots
│   ├── routes.py                # Endpoints REST da API
│   └── websocket.py             # Handlers de WebSocket
├── requirements.txt             # Dependências Python
├── .env                         # Variáveis de ambiente
└── README.md                    # Este arquivo
```

## 🗄️ Consolidação do Banco de Dados

### Antes (7 tabelas)
- `users`
- `instances`
- `instanceSettings`
- `queueModes`
- `organizations`
- `statistics`
- `logs`

### Depois (Simplificado)
- `users` - Usuários do sistema
- `bots` - Consolidação de instances + instanceSettings
- `statistics` - Estatísticas dos bots
- `queue_modes` - Modos de fila suportados
- `organizations` - Organizações/Guilds
- `logs` - Logs em tempo real

## 🚀 Instalação e Setup

### 1. Clonar o Repositório
```bash
git clone https://github.com/nick444ff-afk/discord-automation.git
cd discord-automation-python
```

### 2. Criar Ambiente Virtual
```bash
python3.11 -m venv venv
source venv/bin/activate  # Linux/macOS
# ou
venv\Scripts\activate  # Windows
```

### 3. Instalar Dependências
```bash
pip install -r requirements.txt
```

### 4. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
# Editar .env com suas configurações
```

### 5. Inicializar Banco de Dados
```bash
python -c "from app.database import init_db; import asyncio; asyncio.run(init_db())"
```

### 6. Executar o Servidor
```bash
python -m app.main
# ou
uvicorn app.main:app --reload
```

O servidor estará disponível em `http://localhost:8000`

## 📚 API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health check

### Bot Management
- `GET /api/bots` - Listar todos os bots de um usuário
- `POST /api/bots` - Criar novo bot
- `GET /api/bots/{bot_id}` - Obter detalhes do bot
- `PUT /api/bots/{bot_id}` - Atualizar configuração do bot
- `DELETE /api/bots/{bot_id}` - Deletar bot

### Bot Control
- `POST /api/bots/{bot_id}/start` - Iniciar bot
- `POST /api/bots/{bot_id}/stop` - Parar bot
- `GET /api/bots/{bot_id}/status` - Obter status do bot

### Statistics
- `GET /api/bots/{bot_id}/statistics` - Obter estatísticas
- `PUT /api/bots/{bot_id}/statistics` - Atualizar estatísticas

### Logs
- `GET /api/bots/{bot_id}/logs` - Obter logs (memória + banco)
- `POST /api/bots/{bot_id}/logs` - Adicionar log

## 🔌 WebSocket Endpoints

### Real-time Logs
- `WS /ws/logs/{bot_id}` - Stream de logs em tempo real
  - Comando: `{"command": "ping"}` - Keep-alive
  - Comando: `{"command": "get_logs"}` - Obter logs atuais
  - Comando: `{"command": "get_status"}` - Obter status

### Real-time Status
- `WS /ws/status/{bot_id}` - Atualizações de status a cada 5 segundos

## 🤖 Gerenciador de Bots

### Funcionalidades

1. **Múltiplas Instâncias**: Gerencia múltiplos bots em paralelo
2. **Estados**: offline, authenticating, scanning, running, error
3. **Logs em Memória**: Últimos 100 logs armazenados em memória
4. **Rastreamento de Uptime**: Atualiza uptime a cada 5 segundos
5. **Automação**: Detecta mensagens, clica em botões e envia respostas

### Estados do Bot

- **offline**: Bot não está rodando
- **authenticating**: Validando token do Discord
- **scanning**: Escaneando servidores e canais
- **running**: Bot ativo e pronto para automação
- **error**: Erro durante execução

## 🔐 Segurança

- CORS configurável via variáveis de ambiente
- Trusted Host middleware
- Type hints completos para validação
- Tratamento de exceções robusto
- Logs estruturados

## 📊 Modelos de Dados

### Bot (Consolidado)
```python
{
    "id": int,
    "user_id": int,
    "name": str,
    "status": str,
    "uptime_seconds": int,
    "tokens": str,
    "rotation_minutes": int,
    "delay_seconds": int,
    "main_message": str,
    "secondary_message": str | None,
    "category": str,
    "selected_orgs": str | None,
    "selected_modes": str | None,
    "created_at": datetime,
    "updated_at": datetime
}
```

### Statistics
```python
{
    "id": int,
    "bot_id": int,
    "entries": int,
    "queues": int,
    "matches": int,
    "dms": int,
    "uptime": int,
    "created_at": datetime,
    "updated_at": datetime
}
```

### Log
```python
{
    "id": int,
    "bot_id": int,
    "level": str,  # INFO, SUCCESS, WARNING, ERROR
    "message": str,
    "created_at": datetime
}
```

## 🔄 Fluxo de Automação

1. **Autenticação**: Token validado e bot conecta ao Discord
2. **Escaneamento**: Bot escaneia servidores e canais disponíveis
3. **Monitoramento**: Bot aguarda mensagens nos canais configurados
4. **Filtros**: Aplica filtros de organização, categoria e modo
5. **Detecção**: Encontra mensagens com botões
6. **Clique**: Clica no botão apropriado com delay aleatório
7. **Envio**: Envia mensagens configuradas com delays
8. **Logging**: Registra todas as ações em tempo real

## 🐛 Troubleshooting

### Bot não conecta
- Verificar token válido
- Verificar permissões da conta no Discord
- Verificar logs de erro na console

### Mensagens não são enviadas
- Verificar permissões no canal
- Verificar se o bot está em estado "running"
- Verificar delays configurados

### WebSocket desconecta
- Verificar conexão de rede
- Verificar logs do servidor
- Reconectar cliente

## 📝 Logs

Logs são armazenados em dois lugares:

1. **Memória**: Últimos 100 logs por bot (rápido, não persistente)
2. **Banco de Dados**: Todos os logs (persistente, mais lento)

Configure o nível de log via `LOG_LEVEL` no `.env`

## 🚢 Deployment

### Railway (Recomendado)

1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Usar `python -m app.main` como comando de start
4. Railway detectará `requirements.txt` automaticamente

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "-m", "app.main"]
```

## 📄 Licença

MIT

## 👨‍💻 Autor

Nick444ff

## 🤝 Contribuições

Contribuições são bem-vindas! Abra uma issue ou pull request.
