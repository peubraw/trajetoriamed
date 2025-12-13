const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
const PORT = process.env.PORT || 3000;

// Exportar io para uso em outros módulos
global.io = io;

// Middlewares
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar sessões
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key-change-this',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas - USANDO APENAS META API OFICIAL
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/whatsapp', require('./routes/whatsapp-meta.routes')); // META API (substituiu wppconnect)
app.use('/api/bot', require('./routes/bot.routes'));
app.use('/api/bot-control', require('./routes/bot-control.routes')); // Controle Bot + Distribuição
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/crm', require('./routes/crm.routes')); // CRM Kanban
app.use('/api/sellers', require('./routes/sellers.routes')); // Gestão de Vendedores
app.use('/api/webhooks', require('./routes/webhook.routes')); // Webhooks pagamento
app.use('/api/meta', require('./routes/meta-webhook.routes')); // Meta WhatsApp Business API Webhook
app.use('/api/chat', require('./routes/chat.routes')); // Chat WhatsApp Integrado

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO - Conexões em tempo real
io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado ao Socket.IO:', socket.id);

    // Entrar em sala do CRM
    socket.on('join-crm', (userId) => {
        socket.join(`crm-${userId}`);
        console.log(`👤 Usuário ${userId} entrou na sala CRM`);
    });

    // Entrar em sala de usuário (para chat)
    socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`📬 Socket ${socket.id} entrou na sala: ${room}`);
    });

    // Entrar em sala de conversa específica
    socket.on('join-conversation', (conversationId) => {
        socket.join(`conversation-${conversationId}`);
        console.log(`💬 Socket ${socket.id} entrou na conversa: ${conversationId}`);
    });

    // Sair de sala de conversa
    socket.on('leave-conversation', (conversationId) => {
        socket.leave(`conversation-${conversationId}`);
        console.log(`💬 Socket ${socket.id} saiu da conversa: ${conversationId}`);
    });

    // Indicador de digitação
    socket.on('typing-start', (data) => {
        socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
            userId: data.userId,
            isTyping: true
        });
    });

    socket.on('typing-stop', (data) => {
        socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
            userId: data.userId,
            isTyping: false
        });
    });

    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado:', socket.id);
    });
});

// Iniciar servidor
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Acesse local: http://localhost:${PORT}`);
    console.log(`🌐 Acesse rede: http://192.168.1.x:${PORT}`);
    console.log(`🔌 Socket.IO pronto para conexões em tempo real`);
    
    // Reconectar sessões existentes
    const whatsappService = require('./services/whatsapp.service');
    await whatsappService.reconnectExistingSessions();
});

module.exports = app;
