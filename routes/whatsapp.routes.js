const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsapp.service');
const db = require('../config/database');

// Middleware de autenticação
const requireAuth = (req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('User ID:', req.session.userId);
    console.log('Session:', req.session);
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado', sessionID: req.sessionID });
    }
    next();
};

// Iniciar sessão do WhatsApp
router.post('/connect', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const sessionName = `session_${userId}`;

        // Verificar se já existe uma sessão ativa
        const existingClient = whatsappService.getClient(userId);
        if (existingClient) {
            console.log('Sessão WhatsApp já existe para user:', userId);
            return res.json({ success: true, message: 'Sessão já iniciada. Aguarde o QR Code.' });
        }

        // Verificar se já existe uma sessão no banco
        const [sessions] = await db.execute(
            'SELECT * FROM whatsapp_sessions WHERE user_id = ?',
            [userId]
        );

        if (sessions.length === 0) {
            // Criar registro da sessão
            await db.execute(
                'INSERT INTO whatsapp_sessions (user_id, session_name, status) VALUES (?, ?, ?)',
                [userId, sessionName, 'connecting']
            );
        } else {
            // Atualizar status para connecting
            await db.execute(
                'UPDATE whatsapp_sessions SET status = ? WHERE user_id = ?',
                ['connecting', userId]
            );
        }

        // Responder imediatamente
        res.json({ success: true, message: 'Sessão iniciada. Aguarde o QR Code.' });

        // Criar sessão do WhatsApp em background (não bloqueia a resposta)
        whatsappService.createSession(userId, sessionName).catch(error => {
            console.error('Erro ao criar sessão WhatsApp:', error);
        });

    } catch (error) {
        console.error('Erro ao conectar WhatsApp:', error);
        res.status(500).json({ error: 'Erro ao conectar WhatsApp', details: error.message });
    }
});

// Obter QR Code
router.get('/qrcode', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const [sessions] = await db.execute(
            'SELECT qr_code, status FROM whatsapp_sessions WHERE user_id = ?',
            [userId]
        );

        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Sessão não encontrada' });
        }

        res.json({
            qrCode: sessions[0].qr_code,
            status: sessions[0].status
        });
    } catch (error) {
        console.error('Erro ao obter QR Code:', error);
        res.status(500).json({ error: 'Erro ao obter QR Code' });
    }
});

// Status da sessão
router.get('/status', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const [sessions] = await db.execute(
            'SELECT status, phone_number FROM whatsapp_sessions WHERE user_id = ?',
            [userId]
        );

        if (sessions.length === 0) {
            return res.json({ status: 'disconnected' });
        }

        res.json({
            status: sessions[0].status,
            phoneNumber: sessions[0].phone_number
        });
    } catch (error) {
        console.error('Erro ao obter status:', error);
        res.status(500).json({ error: 'Erro ao obter status' });
    }
});

// Desconectar
router.post('/disconnect', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        await whatsappService.closeSession(userId);
        res.json({ success: true, message: 'Desconectado com sucesso' });
    } catch (error) {
        console.error('Erro ao desconectar:', error);
        res.status(500).json({ error: 'Erro ao desconectar' });
    }
});

// Logout permanente (limpa tokens)
router.post('/logout', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        await whatsappService.logoutSession(userId);
        res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        res.status(500).json({ error: 'Erro ao fazer logout' });
    }
});

module.exports = router;
