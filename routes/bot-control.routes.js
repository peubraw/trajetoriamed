/**
 * Bot Control Routes
 * Endpoints para controle do bot e distribuição de leads
 */

const express = require('express');
const router = express.Router();
const botControlService = require('../services/bot-control.service');
const leadDistributionService = require('../services/lead-distribution.service');

// ==========================================
// CONTROLE DO BOT
// ==========================================

/**
 * POST /api/bot/pause/:leadId
 * Pausa o bot manualmente para um lead
 */
router.post('/pause/:leadId', async (req, res) => {
    try {
        const { leadId } = req.params;
        const { reason, userId } = req.body;

        const result = await botControlService.pauseBot(
            parseInt(leadId),
            reason || 'Pausado manualmente',
            userId || null
        );

        res.json({
            success: true,
            message: 'Bot pausado com sucesso',
            data: result
        });

    } catch (error) {
        console.error('Erro ao pausar bot:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao pausar bot',
            error: error.message
        });
    }
});

/**
 * POST /api/bot/resume/:leadId
 * Retoma o bot para um lead
 */
router.post('/resume/:leadId', async (req, res) => {
    try {
        const { leadId } = req.params;
        const { userId } = req.body;

        const result = await botControlService.resumeBot(
            parseInt(leadId),
            userId || null
        );

        res.json({
            success: true,
            message: 'Bot retomado com sucesso',
            data: result
        });

    } catch (error) {
        console.error('Erro ao retomar bot:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao retomar bot',
            error: error.message
        });
    }
});

/**
 * GET /api/bot/status/:leadId
 * Verifica status atual do bot para um lead
 */
router.get('/status/:leadId', async (req, res) => {
    try {
        const { leadId } = req.params;

        const status = await botControlService.checkBotStatus(parseInt(leadId));

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('Erro ao verificar status do bot:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar status',
            error: error.message
        });
    }
});

/**
 * GET /api/bot/statistics/:userId
 * Obtém estatísticas de bots ativos/pausados
 */
router.get('/statistics/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await botControlService.getBotStatistics(parseInt(userId));

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter estatísticas',
            error: error.message
        });
    }
});

// ==========================================
// DISTRIBUIÇÃO DE LEADS
// ==========================================

/**
 * POST /api/distribution/assign/:leadId
 * Distribui um lead automaticamente
 */
router.post('/assign/:leadId', async (req, res) => {
    try {
        const { leadId } = req.params;
        const { ownerId } = req.body;

        if (!ownerId) {
            return res.status(400).json({
                success: false,
                message: 'ownerId é obrigatório'
            });
        }

        const result = await leadDistributionService.distributeLead(
            parseInt(leadId),
            parseInt(ownerId)
        );

        res.json({
            success: true,
            message: 'Lead distribuído',
            data: result
        });

    } catch (error) {
        console.error('Erro ao distribuir lead:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao distribuir lead',
            error: error.message
        });
    }
});

/**
 * POST /api/distribution/shark-tank/:leadId/claim
 * Vendedor "pega" um lead do Shark Tank
 */
router.post('/shark-tank/:leadId/claim', async (req, res) => {
    try {
        const { leadId } = req.params;
        const { sellerId } = req.body;

        if (!sellerId) {
            return res.status(400).json({
                success: false,
                message: 'sellerId é obrigatório'
            });
        }

        const result = await leadDistributionService.claimSharkTankLead(
            parseInt(leadId),
            parseInt(sellerId)
        );

        res.json(result);

    } catch (error) {
        console.error('Erro ao capturar lead:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao capturar lead',
            error: error.message
        });
    }
});

/**
 * GET /api/distribution/shark-tank/:ownerId
 * Lista leads disponíveis no Shark Tank
 */
router.get('/shark-tank/:ownerId', async (req, res) => {
    try {
        const { ownerId } = req.params;

        const leads = await leadDistributionService.getSharkTankLeads(parseInt(ownerId));

        res.json({
            success: true,
            data: leads
        });

    } catch (error) {
        console.error('Erro ao listar leads do Shark Tank:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar leads',
            error: error.message
        });
    }
});

/**
 * GET /api/distribution/settings/:userId
 * Obtém configurações de distribuição
 */
router.get('/settings/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const settings = await leadDistributionService.getDistributionSettings(parseInt(userId));

        res.json({
            success: true,
            data: settings
        });

    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar configurações',
            error: error.message
        });
    }
});

/**
 * PUT /api/distribution/settings/:userId
 * Atualiza configurações de distribuição
 */
router.put('/settings/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { distribution_mode, shark_tank_timeout } = req.body;

        const result = await leadDistributionService.updateDistributionSettings(
            parseInt(userId),
            { distribution_mode, shark_tank_timeout }
        );

        res.json({
            success: true,
            message: 'Configurações atualizadas',
            data: result
        });

    } catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar configurações',
            error: error.message
        });
    }
});

module.exports = router;
