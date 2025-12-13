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

        // 💬 SALVAR MENSAGEM NO CHAT
        const chatService = require('../services/chat.service');
        const cleanPhone = messageData.from.replace('@c.us', '');
        
        try {
            await chatService.processIncomingMessage(userId, cleanPhone, {
                messageId: messageData.messageId,
                type: messageData.type || 'text',
                content: messageData.text,
                metadata: {
                    profileName: messageData.profileName,
                    timestamp: messageData.timestamp
                }
            });
            console.log(`💬 Mensagem salva no chat para ${cleanPhone}`);
        } catch (chatError) {
            console.error('⚠️ Erro ao salvar mensagem no chat (não bloqueante):', chatError);
        }

        // VERIFICAR SE O LEAD JÁ EXISTE NO CRM E SE O BOT ESTÁ ATIVO
        const crmService = require('../services/crm.service');
        const existingLead = await crmService.getLeadByPhone(cleanPhone, userId);

        if (existingLead && existingLead.bot_active === 0) {
            console.log(`🚫 Lead ${existingLead.name} (${cleanPhone}) existe no CRM com bot DESATIVADO - bot não responderá`);
            return;
        }

        if (existingLead && existingLead.bot_active === 1) {
            console.log(`✅ Lead ${existingLead.name} (${cleanPhone}) existe no CRM com bot ATIVO - bot responderá normalmente`);
        } else if (!existingLead) {
            console.log(`✅ Lead ${cleanPhone} não existe no CRM - bot responderá normalmente`);
        }

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

        // Verificar se o bot está ativo para este lead (redundante agora, mas mantendo por segurança)
        const [leads] = await require('../config/database').execute(
            'SELECT bot_active FROM crm_leads WHERE phone = ? AND user_id = ?',
            [messageData.from, userId]
        );

        if (leads.length > 0 && !leads[0].bot_active) {
            console.log(`⏸️ Bot pausado para ${messageData.from} - ignorando mensagem`);
            return;
        }

        // Usar serviço Meta API direto (não precisa de adapter aqui)

        // Configuração padrão do flow (pode ser expandido depois)
        const flowConfig = {};

        // Processar com o chatbot flow
        const leadId = leads.length > 0 ? leads[0].id : null;
        const flowResponse = await chatbotFlowService.processMessage(
            userId, 
            messageData.from + '@c.us', 
            messageData.text, 
            flowConfig, 
            leadId
        );

        // Enviar resposta se houver
        if (flowResponse) {
            let messageToSend = null;
            
            // Verificar se deve usar IA (modo híbrido)
            if (typeof flowResponse === 'object' && flowResponse.useAI) {
                console.log('🔄 MODO HÍBRIDO: Passando controle para IA...');
                
                const whatsappService = require('../services/whatsapp.service');
                const sessionInfo = chatbotFlowService.getSessionInfo(userId, messageData.from + '@c.us');
                
                // Buscar configuração do bot do usuário
                const db = require('../config/database');
                const [configs] = await db.execute(
                    'SELECT * FROM bot_configs WHERE user_id = ?',
                    [userId]
                );
                
                const botConfig = configs.length > 0 ? configs[0] : {
                    bot_name: 'Mia',
                    system_prompt: 'Você é Mia, consultora de carreira da Trajetória Med.',
                    temperature: 0.7,
                    max_tokens: 300
                };
                
                // Se flowResponse.message é null (primeira mensagem do curso), usar flag especial
                const userMessage = (flowResponse.message === null || flowResponse.message === undefined) 
                    ? '_PRIMEIRA_MENSAGEM_' 
                    : flowResponse.message;
                
                const aiResponse = await whatsappService.processWithAI(
                    userId,
                    messageData.from + '@c.us',
                    userMessage,
                    botConfig,
                    sessionInfo
                );
                
                messageToSend = aiResponse;
                
                // Sincronizar com CRM após resposta da IA
                try {
                    const conversationHistory = whatsappService.conversationHistory.get(`${userId}-${messageData.from}@c.us`) || [];
                    await chatbotFlowService.syncSessionToCRM(userId, messageData.from + '@c.us', conversationHistory);
                } catch (syncError) {
                    console.error('⚠️ Erro ao sincronizar CRM (não bloqueante):', syncError.message);
                }
            }
            // Se resposta é string, enviar direto
            else if (typeof flowResponse === 'string') {
                messageToSend = flowResponse;
            }
            // Se resposta é objeto com message
            else if (flowResponse.message) {
                messageToSend = flowResponse.message;
            }
            
            // Enviar mensagem via Meta API
            if (messageToSend) {
                // Remover @c.us do número para Meta API
                const cleanPhone = messageData.from.replace('@c.us', '');
                await metaWhatsAppService.sendTextMessage(cleanPhone, messageToSend);
                console.log(`✅ Resposta enviada para ${messageData.from}: "${messageToSend.substring(0, 50)}..."`);
                
                // VERIFICAR SE ENVIOU LINK DE PAGAMENTO E MOVER PARA "LINK ENVIADO"
                if (messageToSend.includes('pay.kiwify.com.br')) {
                    console.log('💳 Link de pagamento detectado na resposta!');
                    
                    try {
                        const crmService = require('../services/crm.service');
                        
                        console.log(`🔍 Buscando lead com telefone: ${cleanPhone}`);
                        const lead = await crmService.getLeadByPhone(cleanPhone, userId);
                        
                        if (lead) {
                            console.log(`✅ Lead encontrado: ${lead.name} (ID: ${lead.id})`);
                            
                            const db = require('../config/database');
                            const [linkStage] = await db.execute(
                                'SELECT id, name FROM crm_stages WHERE user_id = ? AND (name LIKE "%Link Enviado%" OR name LIKE "%link enviado%") LIMIT 1',
                                [userId]
                            );
                            
                            console.log(`🔍 Stages encontrados:`, linkStage);
                            
                            if (linkStage.length > 0) {
                                console.log(`📦 Movendo lead ${lead.id} para stage ${linkStage[0].id} (${linkStage[0].name})`);
                                await crmService.moveLeadToStage(lead.id, linkStage[0].id, userId);
                                console.log(`✅ Lead ${lead.name} movido para coluna "${linkStage[0].name}"`);
                            } else {
                                console.log('⚠️ Coluna "Link Enviado" não encontrada no CRM');
                            }
                        } else {
                            console.log(`⚠️ Lead não encontrado no CRM com telefone: ${cleanPhone}`);
                        }
                    } catch (moveError) {
                        console.error('⚠️ Erro ao mover lead (não bloqueante):', moveError.message);
                    }
                }
            } else {
                console.log('⏸️ Resposta processada mas sem mensagem para enviar (useAI ou null)');
            }
        }
        
        // Sincronizar lead com CRM (sempre que houver mensagem)
        try {
            const sessionInfo = chatbotFlowService.getSessionInfo(userId, messageData.from + '@c.us');
            if (sessionInfo && sessionInfo.nome) {
                const crmService = require('../services/crm.service');
                const cleanPhone = messageData.from.replace('@c.us', '');
                
                await crmService.upsertLead({
                    userId: userId,
                    phone: cleanPhone,
                    name: sessionInfo.nome,
                    interestedCourse: sessionInfo.produto,
                    isFormerStudent: sessionInfo.exAluno,
                    channel: 'whatsapp_meta',
                    source: 'meta_api'
                });
                
                console.log(`✅ Lead sincronizado com CRM: ${sessionInfo.nome} (${cleanPhone})`);
            }
        } catch (crmError) {
            console.error('⚠️ Erro ao sincronizar lead com CRM:', crmError.message);
        }

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
