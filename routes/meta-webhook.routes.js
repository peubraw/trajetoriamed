const express = require('express');
const router = express.Router();
const metaWhatsAppService = require('../services/meta-whatsapp.service');
const chatbotFlowService = require('../services/chatbot-flow.service');
require('dotenv').config();

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

/**
 * Rota de teste para ver se o webhook está acessível
 */
router.get('/webhook-test', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Meta Webhook está funcionando!',
        timestamp: new Date().toISOString(),
        verifyToken: VERIFY_TOKEN ? 'Configurado' : 'NÃO CONFIGURADO'
    });
});

/**
 * Webhook Verification (GET)
 * A Meta envia uma requisição GET para verificar o webhook
 */
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔔 Verificação de webhook recebida');
    console.log('   Mode:', mode);
    console.log('   Token recebido:', token);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verificado com sucesso!');
        res.status(200).send(challenge);
    } else {
        console.error('❌ Falha na verificação do webhook - token inválido');
        res.sendStatus(403);
    }
});

/**
 * Webhook Messages (POST)
 * Recebe mensagens enviadas pelos usuários
 */
router.post('/webhook', async (req, res) => {
    try {
        // Responder imediatamente com 200 (requisito da Meta)
        res.sendStatus(200);

        const body = req.body;

        // Verificar se é notificação de mensagem
        if (body.object !== 'whatsapp_business_account') {
            console.log('⚠️ Webhook recebido mas não é mensagem WhatsApp');
            return;
        }

        console.log('📩 Webhook de mensagem recebido:', JSON.stringify(body, null, 2));

        // Processar a mensagem
        const messageData = await metaWhatsAppService.processWebhookMessage(body);

        if (!messageData) {
            console.log('⚠️ Nenhuma mensagem para processar');
            return;
        }

        console.log(`📨 Mensagem de ${messageData.profileName} (${messageData.from}): "${messageData.text}"`);

        // Buscar usuário associado (assumindo user_id = 1 por enquanto)
        // TODO: Implementar lógica de múltiplos usuários
        const userId = 1;

        // Processar mensagem no fluxo do chatbot
        // Adaptar o formato para o chatbot-flow.service
        const adaptedMessage = {
            from: messageData.from + '@c.us',
            body: messageData.text,
            fromMe: false,
            timestamp: messageData.timestamp,
            id: messageData.messageId,
            isGroupMsg: false,
            type: messageData.type
        };

        // Verificar se o bot está ativo para este lead
        const [leads] = await require('../config/database').execute(
            'SELECT bot_active FROM crm_leads WHERE phone = ? AND user_id = ?',
            [messageData.from, userId]
        );

        if (leads.length > 0 && !leads[0].bot_active) {
            console.log(`⏸️ Bot pausado para ${messageData.from} - ignorando mensagem`);
            return;
        }

        // Processar com o chatbot flow
        await chatbotFlowService.handleMessage(userId, adaptedMessage, metaWhatsAppService);

    } catch (error) {
        console.error('❌ Erro ao processar webhook:', error);
    }
});

/**
 * Testar envio de mensagem via Meta API
 */
router.post('/test-send', async (req, res) => {
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
        res.status(500).json({ 
            error: 'Erro ao enviar mensagem', 
            details: error.message 
        });
    }
});

/**
 * Testar envio de botões interativos
 */
router.post('/test-buttons', async (req, res) => {
    try {
        const { phone, text, buttons } = req.body;

        const result = await metaWhatsAppService.sendInteractiveButtons(
            phone,
            text,
            buttons
        );

        res.json({ 
            success: true, 
            messageId: result.messages[0].id 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Erro ao enviar botões', 
            details: error.message 
        });
    }
});

/**
 * Listar templates disponíveis
 */
router.get('/templates', async (req, res) => {
    try {
        const templates = await metaWhatsAppService.getTemplates();
        res.json({ success: true, templates });
    } catch (error) {
        res.status(500).json({ 
            error: 'Erro ao listar templates', 
            details: error.message 
        });
    }
});

/**
 * Health check da Meta API
 */
router.get('/health', async (req, res) => {
    try {
        const health = await metaWhatsAppService.healthCheck();
        res.json(health);
    } catch (error) {
        res.status(500).json({ 
            healthy: false, 
            error: error.message 
        });
    }
});

/**
 * Obter analytics
 */
router.get('/analytics', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const analytics = await metaWhatsAppService.getAnalytics(startDate, endDate);
        res.json({ success: true, analytics });
    } catch (error) {
        res.status(500).json({ 
            error: 'Erro ao obter analytics', 
            details: error.message 
        });
    }
});

/**
 * Obter configurações Meta API
 */
router.get('/config', async (req, res) => {
    try {
        const db = require('../config/database');
        const userId = req.session?.userId || 1;

        const [configs] = await db.execute(
            'SELECT * FROM meta_api_configs WHERE user_id = ?',
            [userId]
        );

        if (configs.length === 0) {
            return res.json({ config: null });
        }

        res.json({ config: configs[0] });
    } catch (error) {
        console.error('Erro ao obter config Meta:', error);
        res.status(500).json({ error: 'Erro ao obter configuração' });
    }
});

/**
 * Salvar configurações Meta API
 */
router.post('/config', async (req, res) => {
    try {
        const db = require('../config/database');
        const userId = req.session?.userId || 1;
        const { app_id, access_token, phone_number_id, business_account_id, webhook_verify_token } = req.body;

        // Converter undefined para null
        const appId = app_id || null;
        const accessToken = access_token || null;
        const phoneNumberId = phone_number_id || null;
        const businessAccountId = business_account_id || null;
        const webhookVerifyToken = webhook_verify_token || null;

        const [existing] = await db.execute(
            'SELECT id FROM meta_api_configs WHERE user_id = ?',
            [userId]
        );

        if (existing.length === 0) {
            // Criar nova configuração
            await db.execute(
                `INSERT INTO meta_api_configs (user_id, app_id, access_token, phone_number_id, business_account_id, webhook_verify_token) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, appId, accessToken, phoneNumberId, businessAccountId, webhookVerifyToken]
            );
        } else {
            // Atualizar configuração existente
            await db.execute(
                `UPDATE meta_api_configs 
                 SET app_id = ?, access_token = ?, phone_number_id = ?, business_account_id = ?, webhook_verify_token = ?
                 WHERE user_id = ?`,
                [appId, accessToken, phoneNumberId, businessAccountId, webhookVerifyToken, userId]
            );
        }

        res.json({ success: true, message: 'Configuração salva com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar config Meta:', error);
        res.status(500).json({ error: 'Erro ao salvar configuração' });
    }
});

module.exports = router;
