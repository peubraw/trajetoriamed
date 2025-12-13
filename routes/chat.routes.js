const express = require('express');
const router = express.Router();
const chatService = require('../services/chat.service');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * GET /api/chat/conversations
 * Buscar todas as conversas do usuário
 */
router.get('/conversations', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { status, assignedTo, search } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (assignedTo) filters.assignedTo = assignedTo;
        if (search) filters.search = search;

        const conversations = await chatService.getConversations(userId, filters);

        res.json({
            success: true,
            conversations
        });
    } catch (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar conversas'
        });
    }
});

/**
 * GET /api/chat/messages/:phone
 * Buscar mensagens de uma conversa específica
 */
router.get('/messages/:phone', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { phone } = req.params;
        const { limit = 100, offset = 0 } = req.query;

        const messages = await chatService.getMessages(
            userId,
            phone,
            parseInt(limit),
            parseInt(offset)
        );

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('❌ Erro ao buscar mensagens:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar mensagens'
        });
    }
});

/**
 * POST /api/chat/send
 * Enviar mensagem
 */
router.post('/send', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const sentBy = req.session.userId;
        const { phone, content, messageType = 'text', mediaUrl = null } = req.body;

        if (!phone || !content) {
            return res.status(400).json({
                success: false,
                error: 'Telefone e conteúdo são obrigatórios'
            });
        }

        const message = await chatService.sendMessage(
            userId,
            phone,
            content,
            sentBy,
            messageType,
            mediaUrl
        );

        res.json({
            success: true,
            message
        });
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao enviar mensagem'
        });
    }
});

/**
 * POST /api/chat/mark-read/:phone
 * Marcar mensagens como lidas
 */
router.post('/mark-read/:phone', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { phone } = req.params;

        await chatService.markAsRead(userId, phone);

        res.json({
            success: true
        });
    } catch (error) {
        console.error('❌ Erro ao marcar como lido:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao marcar como lido'
        });
    }
});

/**
 * POST /api/chat/archive/:phone
 * Arquivar conversa
 */
router.post('/archive/:phone', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { phone } = req.params;

        await chatService.archiveConversation(userId, phone);

        res.json({
            success: true
        });
    } catch (error) {
        console.error('❌ Erro ao arquivar conversa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao arquivar conversa'
        });
    }
});

/**
 * GET /api/chat/stats
 * Buscar estatísticas de chat
 */
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const stats = await chatService.getChatStats(userId);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas'
        });
    }
});

/**
 * POST /api/chat/typing
 * Atualizar indicador de digitação
 */
router.post('/typing', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { conversationId, phone, isTyping } = req.body;

        await chatService.updateTypingIndicator(conversationId, userId, phone, isTyping);

        res.json({
            success: true
        });
    } catch (error) {
        console.error('❌ Erro ao atualizar digitação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar digitação'
        });
    }
});

/**
 * GET /api/chat/conversation/:phone
 * Buscar ou criar conversa específica
 */
router.get('/conversation/:phone', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { phone } = req.params;
        const { leadId = null } = req.query;

        const conversation = await chatService.getOrCreateConversation(
            userId,
            phone,
            leadId
        );

        res.json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error('❌ Erro ao buscar/criar conversa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar/criar conversa'
        });
    }
});

module.exports = router;
