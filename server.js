const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Rotas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/whatsapp', require('./routes/whatsapp.routes'));
app.use('/api/bot', require('./routes/bot.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Acesse local: http://localhost:${PORT}`);
    console.log(`🌐 Acesse rede: http://192.168.1.x:${PORT}`);
    
    // Reconectar sessões existentes
    const whatsappService = require('./services/whatsapp.service');
    await whatsappService.reconnectExistingSessions();
});

module.exports = app;
