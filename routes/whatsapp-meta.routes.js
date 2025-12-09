const express = require('express');
const router = express.Router();
const metaWhatsAppService = require('../services/meta-whatsapp.service');
const db = require('../config/database');

// Middleware de autenticação
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    next();
};

// ============================================
// STATUS DA CONEXÃO META API
// ============================================
router.get('/status', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        
        // Verificar health da Meta API
        const health = await metaWhatsAppService.healthCheck();
        
        // Buscar configuração no banco
        const [sessions] = await db.execute(
            'SELECT * FROM whatsapp_sessions WHERE user_id = ?',
            [userId]
        );

        const session = sessions[0];
        
        res.json({
            connected: health.healthy,
            status: health.healthy ? 'connected' : 'disconnected',
            phoneNumber: session?.phone_number || process.env.META_PHONE_NUMBER_ID,
            apiType: 'meta',
            health: health
        });
    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        res.json({
            connected: false,
            status: 'error',
            error: error.message
        });
    }
});

// ============================================
// CONECTAR META API (Simula conexão)
// ============================================
router.post('/connect', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        
        // Verificar health da Meta API
        const health = await metaWhatsAppService.healthCheck();
        
        if (!health.healthy) {
            return res.status(500).json({
                success: false,
                error: 'Meta API não está respondendo. Verifique as credenciais.'
            });
        }

        // Verificar se já existe sessão no banco
        const [sessions] = await db.execute(
            'SELECT * FROM whatsapp_sessions WHERE user_id = ?',
            [userId]
        );

        if (sessions.length === 0) {
            // Criar registro da sessão Meta
            await db.execute(
                'INSERT INTO whatsapp_sessions (user_id, session_name, status, phone_number, api_type) VALUES (?, ?, ?, ?, ?)',
                [userId, `meta_${userId}`, 'connected', process.env.META_PHONE_NUMBER_ID, 'meta']
            );
        } else {
            // Atualizar para conectado
            await db.execute(
                'UPDATE whatsapp_sessions SET status = ?, api_type = ?, phone_number = ? WHERE user_id = ?',
                ['connected', 'meta', process.env.META_PHONE_NUMBER_ID, userId]
            );
        }

        res.json({
            success: true,
            message: 'Meta WhatsApp API conectada com sucesso!',
            phoneNumber: process.env.META_PHONE_NUMBER_ID,
            apiType: 'meta'
        });

    } catch (error) {
        console.error('❌ Erro ao conectar Meta API:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// DESCONECTAR
// ============================================
router.post('/disconnect', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        await db.execute(
            'UPDATE whatsapp_sessions SET status = ? WHERE user_id = ?',
            ['disconnected', userId]
        );

        res.json({
            success: true,
            message: 'Meta API desconectada'
        });
    } catch (error) {
        console.error('❌ Erro ao desconectar:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ENVIAR MENSAGEM TESTE
// ============================================
router.post('/send-message', requireAuth, async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ error: 'Phone e message são obrigatórios' });
        }

        const result = await metaWhatsAppService.sendTextMessage(phone, message);

        res.json({
            success: true,
            messageId: result.messages[0].id,
            message: 'Mensagem enviada via Meta API'
        });
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// LISTAR TEMPLATES APROVADOS
// ============================================
router.get('/templates', requireAuth, async (req, res) => {
    try {
        const templates = await metaWhatsAppService.getTemplates();
        res.json({
            success: true,
            templates: templates
        });
    } catch (error) {
        console.error('❌ Erro ao listar templates:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// ANALYTICS
// ============================================
router.get('/analytics', requireAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const analytics = await metaWhatsAppService.getAnalytics(startDate, endDate);
        
        res.json({
            success: true,
            analytics: analytics
        });
    } catch (error) {
        console.error('❌ Erro ao buscar analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
