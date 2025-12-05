# 📡 DOCUMENTAÇÃO DA API

Esta documentação é para desenvolvedores que querem integrar ou estender o sistema.

---

## 🔐 Autenticação

Todas as requisições (exceto login/registro) requerem sessão ativa.

**Headers necessários:**
```
Cookie: connect.sid=<session_id>
Content-Type: application/json
```

---

## 📍 Endpoints

### 🔑 Autenticação

#### POST `/api/auth/register`
Criar nova conta de usuário.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999998888",
  "password": "senha123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cadastro realizado com sucesso! Você tem 1 dia de teste grátis.",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@email.com",
    "trialEndDate": "2024-11-25T10:30:00.000Z"
  }
}
```

**Response 400:**
```json
{
  "error": "Email já cadastrado"
}
```

---

#### POST `/api/auth/login`
Fazer login no sistema.

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response 200:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@email.com",
    "subscriptionStatus": "trial",
    "trialEndDate": "2024-11-25T10:30:00.000Z"
  }
}
```

**Response 401:**
```json
{
  "error": "Credenciais inválidas"
}
```

**Response 403:**
```json
{
  "error": "Período de teste expirado. Por favor, assine um plano."
}
```

---

#### POST `/api/auth/logout`
Fazer logout.

**Response 200:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

#### GET `/api/auth/check`
Verificar se o usuário está autenticado.

**Response 200:**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@email.com",
    "subscription_status": "trial",
    "trial_end_date": "2024-11-25T10:30:00.000Z"
  }
}
```

**Response 401:**
```json
{
  "authenticated": false
}
```

---

### 📱 WhatsApp

#### POST `/api/whatsapp/connect`
Iniciar conexão do WhatsApp (gera QR Code).

**Requer:** Autenticação

**Response 200:**
```json
{
  "success": true,
  "message": "Sessão iniciada. Aguarde o QR Code."
}
```

---

#### GET `/api/whatsapp/qrcode`
Obter QR Code para conexão.

**Requer:** Autenticação

**Response 200:**
```json
{
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "status": "connecting"
}
```

**Response 404:**
```json
{
  "error": "Sessão não encontrada"
}
```

---

#### GET `/api/whatsapp/status`
Verificar status da conexão WhatsApp.

**Requer:** Autenticação

**Response 200:**
```json
{
  "status": "connected",
  "phoneNumber": "5511999998888"
}
```

Status possíveis:
- `disconnected` - Não conectado
- `connecting` - Aguardando QR Code
- `connected` - Conectado e funcionando

---

#### POST `/api/whatsapp/disconnect`
Desconectar WhatsApp.

**Requer:** Autenticação

**Response 200:**
```json
{
  "success": true,
  "message": "Desconectado com sucesso"
}
```

---

### 🤖 Bot Configuration

#### GET `/api/bot/config`
Obter configuração atual do bot.

**Requer:** Autenticação

**Response 200:**
```json
{
  "config": {
    "id": 1,
    "user_id": 1,
    "bot_name": "Assistente da Pizzaria",
    "system_prompt": "Você é o assistente virtual...",
    "temperature": 0.7,
    "max_tokens": 500,
    "is_active": true,
    "created_at": "2024-11-24T10:00:00.000Z",
    "updated_at": "2024-11-24T12:00:00.000Z"
  }
}
```

**Response 200 (sem config):**
```json
{
  "config": null
}
```

---

#### POST `/api/bot/config`
Salvar/Atualizar configuração do bot.

**Requer:** Autenticação

**Body:**
```json
{
  "bot_name": "Assistente da Pizzaria",
  "system_prompt": "Você é o assistente virtual da Pizzaria...",
  "temperature": 0.7,
  "max_tokens": 500,
  "is_active": true
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Configuração salva com sucesso"
}
```

---

#### POST `/api/bot/generate-prompt`
Gerar prompt automaticamente usando IA.

**Requer:** Autenticação

**Body:**
```json
{
  "description": "Tenho uma pizzaria e quero um bot simpático que ajude com pedidos"
}
```

**Response 200:**
```json
{
  "success": true,
  "prompt": "Você é o assistente virtual da Pizzaria Bella Napoli..."
}
```

**Response 400:**
```json
{
  "error": "Descrição não fornecida"
}
```

---

#### POST `/api/bot/test-prompt`
Testar prompt com mensagem de exemplo.

**Requer:** Autenticação

**Body:**
```json
{
  "system_prompt": "Você é um assistente simpático...",
  "test_message": "Olá, quero fazer um pedido"
}
```

**Response 200:**
```json
{
  "success": true,
  "response": "Olá! Que ótimo! Como posso ajudá-lo com seu pedido?"
}
```

---

### 📊 Dashboard

#### GET `/api/dashboard/stats`
Obter estatísticas do usuário.

**Requer:** Autenticação

**Response 200:**
```json
{
  "totalMessages": 328,
  "todayMessages": {
    "messages_received": 15,
    "messages_sent": 15
  },
  "recentMessages": [
    {
      "sender": "5511999998888",
      "message": "Olá, quero fazer um pedido",
      "response": "Olá! Que ótimo! Como posso ajudá-lo?",
      "timestamp": "2024-11-24T14:30:00.000Z"
    }
  ],
  "weekStats": [
    {
      "date": "2024-11-18",
      "messages_received": 20,
      "messages_sent": 20
    },
    {
      "date": "2024-11-19",
      "messages_received": 25,
      "messages_sent": 25
    }
  ]
}
```

---

#### GET `/api/dashboard/user-info`
Obter informações do usuário logado.

**Requer:** Autenticação

**Response 200:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999998888",
  "created_at": "2024-11-24T10:00:00.000Z",
  "trial_end_date": "2024-11-25T10:00:00.000Z",
  "subscription_status": "trial",
  "daysRemaining": 1
}
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela `users`
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(255) NOT NULL
email VARCHAR(255) UNIQUE NOT NULL
password VARCHAR(255) NOT NULL -- bcrypt hash
phone VARCHAR(20)
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
trial_end_date DATETIME
is_active BOOLEAN DEFAULT TRUE
subscription_status ENUM('trial', 'active', 'expired', 'cancelled')
```

### Tabela `whatsapp_sessions`
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT FOREIGN KEY -> users(id)
session_name VARCHAR(100) NOT NULL
qr_code TEXT
status ENUM('disconnected', 'connecting', 'connected')
phone_number VARCHAR(20)
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Tabela `bot_configs`
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT FOREIGN KEY -> users(id)
bot_name VARCHAR(255) DEFAULT 'Assistente'
system_prompt TEXT NOT NULL
temperature DECIMAL(3,2) DEFAULT 0.7
max_tokens INT DEFAULT 500
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Tabela `messages`
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT FOREIGN KEY -> users(id)
sender VARCHAR(100) NOT NULL -- Número WhatsApp
message TEXT NOT NULL
response TEXT
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Tabela `statistics`
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT FOREIGN KEY -> users(id)
date DATE NOT NULL
messages_received INT DEFAULT 0
messages_sent INT DEFAULT 0
UNIQUE(user_id, date)
```

---

## 🔧 Services (Arquitetura)

### OpenRouterService (`services/openrouter.service.js`)

#### `chat(messages, temperature, maxTokens)`
Envia mensagens para o modelo Grok.

**Parâmetros:**
- `messages`: Array de objetos `{ role, content }`
- `temperature`: 0-1 (padrão: 0.7)
- `maxTokens`: Número (padrão: 500)

**Retorna:** String com resposta da IA

---

#### `generatePrompt(userDescription)`
Gera prompt completo baseado em descrição do usuário.

**Parâmetros:**
- `userDescription`: String com descrição do negócio

**Retorna:** String com prompt gerado

---

#### `processMessage(systemPrompt, userMessage, conversationHistory)`
Processa mensagem do usuário com contexto.

**Parâmetros:**
- `systemPrompt`: Prompt de sistema (instrução do bot)
- `userMessage`: Mensagem do usuário
- `conversationHistory`: Array de mensagens anteriores (opcional)

**Retorna:** String com resposta da IA

---

### WhatsAppService (`services/whatsapp.service.js`)

#### `createSession(userId, sessionName)`
Cria nova sessão do WhatsApp.

**Parâmetros:**
- `userId`: ID do usuário
- `sessionName`: Nome da sessão (ex: "session_1")

**Retorna:** Promise<Client>

---

#### `handleIncomingMessage(userId, message)`
Processa mensagem recebida e responde automaticamente.

**Parâmetros:**
- `userId`: ID do usuário dono da sessão
- `message`: Objeto de mensagem do WPPConnect

---

#### `closeSession(userId)`
Fecha sessão do WhatsApp.

**Parâmetros:**
- `userId`: ID do usuário

---

#### `getClient(userId)`
Obtém cliente WhatsApp do usuário.

**Parâmetros:**
- `userId`: ID do usuário

**Retorna:** Client ou undefined

---

## 🔌 Integrações Externas

### OpenRouter API

**Base URL:** `https://openrouter.ai/api/v1`

**Headers necessários:**
```
Authorization: Bearer <API_KEY>
Content-Type: application/json
HTTP-Referer: <your_site_url>
X-Title: <your_app_name>
```

**Endpoint usado:** `POST /chat/completions`

**Documentação:** https://openrouter.ai/docs

---

### WPPConnect

Biblioteca para conectar WhatsApp Web.

**GitHub:** https://github.com/wppconnect-team/wppconnect

**Principais métodos usados:**
- `wppconnect.create()` - Criar sessão
- `client.onMessage()` - Listener de mensagens
- `client.sendText()` - Enviar mensagem
- `client.getHostDevice()` - Info do dispositivo
- `client.close()` - Fechar sessão

---

## 🛠️ Como Estender

### Adicionar Novo Modelo de IA

Edite `services/openrouter.service.js`:

```javascript
// Trocar modelo
this.model = 'anthropic/claude-3-opus'; // Exemplo

// Ou criar método para escolher
setModel(modelName) {
    this.model = modelName;
}
```

---

### Adicionar Memória de Conversação

```javascript
// Em whatsapp.service.js, no handleIncomingMessage:

// Buscar últimas 5 mensagens
const [history] = await db.execute(
    'SELECT message, response FROM messages WHERE user_id = ? AND sender = ? ORDER BY timestamp DESC LIMIT 5',
    [userId, message.from]
);

// Formatar para IA
const conversationHistory = history.reverse().flatMap(msg => [
    { role: 'user', content: msg.message },
    { role: 'assistant', content: msg.response }
]);

// Usar no processamento
const aiResponse = await openRouterService.processMessage(
    config.system_prompt,
    message.body,
    conversationHistory
);
```

---

### Adicionar Webhook

```javascript
// No server.js, adicione:

app.post('/webhook/message', async (req, res) => {
    const { userId, sender, message, response } = req.body;
    
    // Processar evento
    console.log(`Mensagem de ${sender}: ${message}`);
    
    // Notificar outro sistema
    await fetch('https://seu-sistema.com/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, message, response })
    });
    
    res.json({ success: true });
});

// No whatsapp.service.js, após enviar resposta:
await axios.post('http://localhost:3000/webhook/message', {
    userId, sender: message.from, 
    message: message.body, 
    response: aiResponse
});
```

---

### Adicionar Sistema de Pagamentos

```javascript
// Criar rota para Stripe/Mercado Pago
app.post('/api/payment/subscribe', requireAuth, async (req, res) => {
    const { planId } = req.body;
    const userId = req.session.userId;
    
    // Criar checkout session
    const session = await stripe.checkout.sessions.create({
        customer_email: req.session.email,
        payment_method_types: ['card'],
        line_items: [{ price: planId, quantity: 1 }],
        mode: 'subscription',
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel'
    });
    
    res.json({ sessionId: session.id });
});

// Webhook para confirmar pagamento
app.post('/webhook/stripe', async (req, res) => {
    const event = req.body;
    
    if (event.type === 'checkout.session.completed') {
        const userId = event.data.object.client_reference_id;
        
        // Ativar assinatura
        await db.execute(
            'UPDATE users SET subscription_status = ?, is_active = TRUE WHERE id = ?',
            ['active', userId]
        );
    }
    
    res.json({ received: true });
});
```

---

## 🧪 Testes

### Testar API com cURL

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@email.com","password":"senha123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"teste@email.com","password":"senha123"}'

# Obter stats (usa cookie do login)
curl -X GET http://localhost:3000/api/dashboard/stats \
  -b cookies.txt
```

---

## 📝 Notas para Desenvolvedores

### Variáveis de Ambiente
Sempre use `.env` para configurações sensíveis. Nunca commite este arquivo.

### Segurança
- Senhas são hasheadas com bcrypt
- Sessões usam httpOnly cookies
- CORS está configurado mas ajuste para produção
- Em produção, use HTTPS obrigatoriamente

### Performance
- O pool de conexões MySQL está configurado para 10 conexões
- Considere cache Redis para sessões em grande escala
- WPPConnect mantém sessões na pasta `.wppconnect/`

### Logs
- Adicione Winston ou similar para logs estruturados
- Monitore erros da API do OpenRouter
- Log todas as mensagens trocadas para análise

---

**Boa codificação! 🚀**
