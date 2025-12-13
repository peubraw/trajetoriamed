# 💬 Chat WhatsApp Integrado ao CRM - TrajetóriaMed

## 📋 Visão Geral

Sistema completo de chat WhatsApp integrado ao CRM que permite que administradores e vendedores conversem diretamente com leads através da plataforma, sem precisar usar o WhatsApp no celular.

## ✨ Funcionalidades Principais

### 🎯 Para Administradores e Vendedores

- **Interface Moderna**: Design inspirado no WhatsApp Web com tema dark
- **Chat em Tempo Real**: Mensagens instantâneas via Socket.IO
- **Histórico Completo**: Todas as conversas salvas no banco de dados
- **Integração CRM**: Acesso direto aos dados do lead
- **Notificações**: Contador de mensagens não lidas
- **Multi-usuário**: Suporte para múltiplos vendedores

### 💼 Recursos do Chat

1. **Lista de Conversas**
   - Busca por nome ou telefone
   - Preview da última mensagem
   - Contador de mensagens não lidas
   - Status do lead (temperatura e estágio)
   - Ordenação por última mensagem

2. **Janela de Chat**
   - Envio de mensagens de texto
   - Status de entrega (enviado, entregue, lido)
   - Indicador de digitação
   - Scroll automático
   - Auto-resize do campo de mensagem
   - Envio com Enter (Shift+Enter para quebra de linha)

3. **Integração com CRM**
   - Botão de chat em cada card do Kanban
   - Visualizar lead diretamente do chat
   - Badge de mensagens não lidas no menu
   - Sincronização automática de dados

4. **API WhatsApp**
   - Suporte para Meta WhatsApp Business API
   - Fallback para WppConnect
   - Salvamento automático de mensagens recebidas
   - Webhook integrado

## 🏗️ Arquitetura

### Backend

```
routes/chat.routes.js          # Endpoints REST do chat
services/chat.service.js       # Lógica de negócio
database/chat-schema.sql       # Estrutura do banco de dados
```

### Frontend

```
public/crm-chat.html          # Interface principal do chat
public/crm-kanban.html        # CRM com botão de chat integrado
```

### Banco de Dados

```
crm_chat_messages             # Histórico de todas as mensagens
crm_conversations             # Agrupamento por contato
crm_chat_typing               # Indicadores de digitação
vw_chat_messages_full         # View com joins de leads
vw_conversations_full         # View com informações agregadas
```

## 📦 Instalação

### 1. Executar Script SQL

```bash
mysql -u root -p wppbot_saas < database/chat-schema.sql
```

Ou via phpMyAdmin:
1. Abra phpMyAdmin
2. Selecione o banco de dados `wppbot_saas`
3. Vá em "SQL"
4. Cole o conteúdo de `database/chat-schema.sql`
5. Execute

### 2. Servidor já Configurado

O sistema já está integrado no `server.js`:
- Rota `/api/chat` ✅
- Socket.IO configurado ✅
- Eventos de tempo real ✅

### 3. Acessar o Chat

```
http://localhost:3000/crm-chat.html
```

Ou clique no menu lateral do CRM: **Chat WhatsApp**

## 🔌 API Endpoints

### GET /api/chat/conversations
Buscar todas as conversas do usuário

**Query Params:**
- `status`: active | archived | closed
- `assignedTo`: ID do vendedor
- `search`: Buscar por nome/telefone

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": 1,
      "phone": "5511999999999",
      "contact_name": "João Silva",
      "unread_count": 3,
      "last_message_content": "Olá, tenho interesse...",
      "last_message_at": "2025-12-13T10:30:00Z",
      "lead_name": "João Silva",
      "temperature": "hot",
      "stage_name": "Interessado"
    }
  ]
}
```

### GET /api/chat/messages/:phone
Buscar mensagens de uma conversa

**Query Params:**
- `limit`: Número de mensagens (padrão: 100)
- `offset`: Offset para paginação (padrão: 0)

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "phone": "5511999999999",
      "message_content": "Olá!",
      "direction": "inbound",
      "sender_type": "lead",
      "status": "delivered",
      "created_at": "2025-12-13T10:25:00Z"
    }
  ]
}
```

### POST /api/chat/send
Enviar mensagem

**Body:**
```json
{
  "phone": "5511999999999",
  "content": "Olá! Como posso ajudar?",
  "messageType": "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": 2,
    "status": "sent",
    "message_id": "wamid.xxx"
  }
}
```

### POST /api/chat/mark-read/:phone
Marcar mensagens como lidas

### POST /api/chat/archive/:phone
Arquivar conversa

### GET /api/chat/stats
Estatísticas do chat

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_conversations": 45,
    "total_unread": 12,
    "active_conversations": 38,
    "total_messages_all": 1234
  }
}
```

## 🔔 Eventos Socket.IO

### Cliente → Servidor

```javascript
socket.emit('join-room', `user-${userId}`);
socket.emit('join-conversation', conversationId);
socket.emit('typing-start', { conversationId, userId });
socket.emit('typing-stop', { conversationId, userId });
```

### Servidor → Cliente

```javascript
socket.on('new-message', (message) => {
  // Nova mensagem recebida
});

socket.on('new-message-notification', (data) => {
  // Notificação de nova mensagem
});

socket.on('messages-read', (data) => {
  // Mensagens marcadas como lidas
});

socket.on('user-typing', (data) => {
  // Alguém está digitando
});
```

## 🎨 Personalizações

### Cores e Tema

As cores podem ser alteradas em `crm-chat.html`:

```css
:root {
    --whatsapp-green: #25D366;
    --bg-primary: #111B21;
    --bg-secondary: #202C33;
    --text-primary: #E9EDEF;
}
```

### Adicionar Suporte para Mídias

No `chat.service.js`, o sistema já suporta:
- text
- image
- video
- audio
- document
- location
- contact
- sticker

Basta implementar no frontend o upload de arquivos.

## 🔐 Segurança

- Autenticação via middleware
- Validação de usuário em todas as rotas
- Sanitização de HTML nas mensagens
- Rate limiting recomendado (não implementado)

## 📊 Monitoramento

### Logs Importantes

```javascript
console.log('💬 Mensagem salva no chat para', phone);
console.log('📨 Nova mensagem recebida:', message);
console.log('✅ Resposta enviada para', phone);
```

### Métricas Disponíveis

- Total de conversas
- Mensagens não lidas
- Conversas ativas
- Total de mensagens

## 🚀 Próximos Passos

1. **Implementar upload de mídias** (imagens, documentos, áudios)
2. **Adicionar emojis picker**
3. **Implementar busca em mensagens**
4. **Adicionar templates de mensagens rápidas**
5. **Implementar atribuição automática de conversas**
6. **Adicionar relatórios de tempo de resposta**
7. **Implementar chatbot automation direto no chat**
8. **Adicionar notas internas (privadas)**
9. **Implementar tags e categorias**
10. **Adicionar exportação de conversas**

## 🐛 Troubleshooting

### Mensagens não aparecem em tempo real

1. Verificar se Socket.IO está conectado:
```javascript
socket.on('connect', () => {
    console.log('Socket conectado');
});
```

2. Verificar se entrou na sala correta:
```javascript
socket.emit('join-room', `user-${userId}`);
```

### Erro ao enviar mensagem

1. Verificar se WhatsApp está conectado (Meta API ou WppConnect)
2. Verificar logs do servidor
3. Verificar se o telefone está no formato correto

### Conversas não carregam

1. Verificar autenticação
2. Verificar se banco de dados foi criado
3. Verificar logs do console

## 📝 Notas de Desenvolvimento

- O sistema usa `user_id = 1` como padrão (TODO: implementar multi-tenant)
- As mensagens do bot também são salvas no chat
- O chat funciona com Meta API e WppConnect (fallback automático)
- As mensagens recebidas via webhook são automaticamente salvas

## 🤝 Contribuindo

Para adicionar novas funcionalidades:

1. Backend: Adicionar método em `chat.service.js`
2. Route: Criar endpoint em `chat.routes.js`
3. Frontend: Implementar em `crm-chat.html`
4. Documentar aqui

## 📄 Licença

Este sistema faz parte do TrajetóriaMed CRM.
