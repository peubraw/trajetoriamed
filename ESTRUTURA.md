# 📁 ESTRUTURA DO PROJETO

```
wppbot/
│
├── 📄 server.js                    # Servidor principal Express
├── 📄 package.json                 # Dependências do projeto
├── 📄 .env                         # Configurações (API Keys, DB)
├── 📄 .env.example                 # Exemplo de configuração
├── 📄 .gitignore                   # Arquivos ignorados pelo Git
│
├── 🔧 start.bat                    # Script para iniciar servidor (Windows)
├── 🔧 install.bat                  # Script para instalar dependências
│
├── 📚 README.md                    # Documentação principal
├── 📚 INSTALACAO.md                # Guia de instalação detalhado
├── 📚 INICIO_RAPIDO.md             # Início rápido em 5 minutos
├── 📚 FAQ.md                       # Perguntas frequentes
├── 📚 API_DOCS.md                  # Documentação da API
├── 📚 EXEMPLOS_PROMPTS.md          # Exemplos de prompts prontos
├── 📚 SCREENSHOTS.md               # Visualização das telas
├── 📚 ESTRUTURA.md                 # Este arquivo
│
├── 📂 config/
│   └── 📄 database.js              # Configuração MySQL
│
├── 📂 database/
│   └── 📄 schema.sql               # Schema do banco de dados
│
├── 📂 services/
│   ├── 📄 openrouter.service.js   # Integração com Grok AI
│   └── 📄 whatsapp.service.js     # Integração com WPPConnect
│
├── 📂 routes/
│   ├── 📄 auth.routes.js          # Rotas de autenticação
│   ├── 📄 whatsapp.routes.js      # Rotas do WhatsApp
│   ├── 📄 bot.routes.js           # Rotas do bot/prompts
│   └── 📄 dashboard.routes.js     # Rotas do dashboard
│
├── 📂 public/                      # Arquivos estáticos (Frontend)
│   ├── 📄 index.html              # Página principal
│   │
│   ├── 📂 css/
│   │   └── 📄 style.css           # Estilos do site
│   │
│   └── 📂 js/
│       └── 📄 app.js              # JavaScript do frontend
│
└── 📂 node_modules/                # Dependências (gerado automaticamente)
```

---

## 🎯 Fluxo de Dados

```
┌─────────────┐
│   Cliente   │ (Envia mensagem via WhatsApp)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   WPPConnect    │ (Recebe mensagem)
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ whatsapp.service.js  │ (Processa mensagem)
└─────────┬────────────┘
          │
          ├──► Busca configuração do bot no MySQL
          │
          ▼
┌──────────────────────┐
│ openrouter.service.js│ (Envia para Grok AI)
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│    Grok AI via       │ (Processa e gera resposta)
│    OpenRouter        │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│ whatsapp.service.js  │ (Envia resposta)
└─────────┬────────────┘
          │
          ▼
┌─────────────────┐
│   WPPConnect    │ (Envia para WhatsApp)
└────────┬────────┘
         │
         ▼
┌─────────────┐
│   Cliente   │ (Recebe resposta)
└─────────────┘
```

---

## 🗄️ Estrutura do Banco de Dados

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id              │◄────┐
│ name            │     │
│ email           │     │
│ password        │     │
│ trial_end_date  │     │
│ subscription    │     │
└─────────────────┘     │
                        │
        ┌───────────────┴───────────────┬────────────────┐
        │                               │                │
        │                               │                │
┌───────▼──────────┐        ┌──────────▼─────┐   ┌─────▼─────────┐
│ whatsapp_sessions│        │  bot_configs   │   │   messages    │
├──────────────────┤        ├────────────────┤   ├───────────────┤
│ id               │        │ id             │   │ id            │
│ user_id (FK)     │        │ user_id (FK)   │   │ user_id (FK)  │
│ session_name     │        │ bot_name       │   │ sender        │
│ qr_code          │        │ system_prompt  │   │ message       │
│ status           │        │ temperature    │   │ response      │
│ phone_number     │        │ max_tokens     │   │ timestamp     │
└──────────────────┘        │ is_active      │   └───────────────┘
                            └────────────────┘
                                    │
                            ┌───────▼──────────┐
                            │   statistics     │
                            ├──────────────────┤
                            │ id               │
                            │ user_id (FK)     │
                            │ date             │
                            │ messages_received│
                            │ messages_sent    │
                            └──────────────────┘
```

---

## 🔄 Arquitetura do Sistema

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  ┌─────────────────────────────────────────────┐    │
│  │           index.html (SPA)                  │    │
│  │  ┌────────────┬───────────┬──────────────┐ │    │
│  │  │  Landing   │ Dashboard │  Configuração│ │    │
│  │  │   Page     │   Stats   │      Bot     │ │    │
│  │  └────────────┴───────────┴──────────────┘ │    │
│  │                                             │    │
│  │  CSS (style.css) + JavaScript (app.js)     │    │
│  └─────────────────────────────────────────────┘    │
└────────────────┬─────────────────────────────────────┘
                 │ HTTP/AJAX
                 ▼
┌──────────────────────────────────────────────────────┐
│                    BACKEND                           │
│  ┌──────────────────────────────────────────────┐   │
│  │            server.js (Express)               │   │
│  │                                              │   │
│  │  ┌──────────────────────────────────────┐   │   │
│  │  │         Routes (API Endpoints)       │   │   │
│  │  │  ┌─────────┬─────────┬─────────────┐│   │   │
│  │  │  │  auth   │whatsapp │    bot      ││   │   │
│  │  │  │ routes  │ routes  │   routes    ││   │   │
│  │  │  └─────────┴─────────┴─────────────┘│   │   │
│  │  └──────────────────────────────────────┘   │   │
│  │                                              │   │
│  │  ┌──────────────────────────────────────┐   │   │
│  │  │            Services                  │   │   │
│  │  │  ┌─────────────┬──────────────────┐ │   │   │
│  │  │  │  whatsapp   │   openrouter     │ │   │   │
│  │  │  │  service    │    service       │ │   │   │
│  │  │  └─────────────┴──────────────────┘ │   │   │
│  │  └──────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────┘   │
└───────┬────────────────────┬─────────────────────────┘
        │                    │
        ▼                    ▼
┌───────────────┐    ┌──────────────────┐
│     MySQL     │    │  External APIs   │
│   Database    │    │  ┌────────────┐  │
│               │    │  │ OpenRouter │  │
│ - users       │    │  │   (Grok)   │  │
│ - sessions    │    │  └────────────┘  │
│ - configs     │    │  ┌────────────┐  │
│ - messages    │    │  │ WPPConnect │  │
│ - stats       │    │  │ (WhatsApp) │  │
└───────────────┘    │  └────────────┘  │
                     └──────────────────┘
```

---

## 📋 Principais Funcionalidades por Arquivo

### 🎯 server.js
- Configuração do Express
- Middlewares (CORS, sessions, body-parser)
- Rotas principais
- Inicialização do servidor

### 🔐 routes/auth.routes.js
- Registro de usuários
- Login/Logout
- Verificação de sessão
- Controle de trial

### 📱 routes/whatsapp.routes.js
- Conexão WhatsApp
- Geração QR Code
- Status da conexão
- Desconexão

### 🤖 routes/bot.routes.js
- Salvar/carregar configuração
- Gerar prompt com IA
- Testar prompts

### 📊 routes/dashboard.routes.js
- Estatísticas
- Informações do usuário
- Histórico de mensagens

### 🔧 services/openrouter.service.js
- Chat com Grok AI
- Geração de prompts
- Processamento de mensagens

### 📱 services/whatsapp.service.js
- Criar sessão WhatsApp
- Gerenciar QR Code
- Receber mensagens
- Enviar respostas
- Atualizar estatísticas

### 🎨 public/css/style.css
- Estilos da landing page
- Estilos do dashboard
- Componentes (cards, modals, forms)
- Responsividade

### ⚡ public/js/app.js
- Login/Registro
- Navegação no dashboard
- Conexão WhatsApp
- Configuração do bot
- Geração de prompts com IA
- Testes de prompt
- Atualização de estatísticas

---

## 🔀 Fluxo de Usuário

```
1. ACESSO INICIAL
   ├─► Landing Page
   └─► [Teste Grátis] → Registro
       └─► Dashboard

2. DASHBOARD - PRIMEIRA CONFIGURAÇÃO
   ├─► WhatsApp
   │   ├─► Conectar
   │   ├─► Escanear QR Code
   │   └─► ✅ Conectado
   │
   └─► Configurar Bot
       ├─► Descrever negócio
       ├─► Gerar Prompt (IA)
       ├─► Revisar/Ajustar
       ├─► Ativar Bot
       └─► ✅ Bot Ativo

3. OPERAÇÃO NORMAL
   ├─► Cliente envia mensagem
   ├─► Bot responde automaticamente
   ├─► Mensagem salva no histórico
   └─► Estatísticas atualizadas

4. MONITORAMENTO
   ├─► Dashboard
   │   └─► Ver estatísticas
   │
   ├─► Mensagens
   │   └─► Ver histórico
   │
   └─► Configurar Bot
       └─► Ajustar prompt
```

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MySQL** - Banco de dados
- **bcryptjs** - Hash de senhas
- **express-session** - Gerenciamento de sessões

### Integrações
- **WPPConnect** - WhatsApp Web API
- **OpenRouter** - Gateway para Grok AI
- **Axios** - HTTP client

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilos (Grid, Flexbox, Animations)
- **Vanilla JavaScript** - Lógica do cliente
- **Fetch API** - Requisições AJAX

---

## 📦 Dependências Principais

```json
{
  "@wppconnect-team/wppconnect": "WhatsApp",
  "express": "Servidor web",
  "express-session": "Autenticação",
  "bcryptjs": "Segurança",
  "mysql2": "Banco de dados",
  "axios": "HTTP requests",
  "cors": "Cross-origin",
  "dotenv": "Variáveis de ambiente",
  "socket.io": "Real-time (futuro)",
  "qrcode": "Geração de QR"
}
```

---

## 🔒 Segurança

```
┌─────────────────────────────────┐
│     Camadas de Segurança        │
├─────────────────────────────────┤
│ 1. Senhas hasheadas (bcrypt)   │
│ 2. Sessions (httpOnly cookies)  │
│ 3. CORS configurado             │
│ 4. .env para secrets            │
│ 5. SQL com prepared statements  │
│ 6. Validação de inputs          │
└─────────────────────────────────┘
```

---

## 📈 Escalabilidade

Para escalar o sistema:

1. **Banco de Dados**
   - Índices otimizados
   - Replicação master-slave
   - Cache com Redis

2. **Servidor**
   - Load balancer (Nginx)
   - Múltiplas instâncias (PM2)
   - CDN para estáticos

3. **WhatsApp**
   - Pool de números
   - Queue system (Bull/RabbitMQ)
   - Webhooks assíncronos

4. **IA**
   - Cache de respostas comuns
   - Rate limiting
   - Fallback para outros modelos

---

## 🎯 Próximas Features (Sugestões)

- [ ] Sistema de pagamentos
- [ ] Múltiplos WhatsApps por usuário
- [ ] Templates de respostas rápidas
- [ ] Integração com CRM
- [ ] Analytics avançados
- [ ] API pública
- [ ] Mobile app
- [ ] Respostas com mídia
- [ ] Chatbot com memória
- [ ] Automações/Fluxos

---

**Esta estrutura foi criada para ser:**
- ✅ Fácil de entender
- ✅ Fácil de manter
- ✅ Fácil de escalar
- ✅ Fácil de estender

---

**Desenvolvido com ❤️ e boas práticas**
