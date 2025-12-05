const express = require('express');
const router = express.Router();
const crmService = require('../services/crm.service');

// Middleware de autenticação (reutilizar o existente)
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
    }
    next();
};

// ===================================
// LEADS - CRUD
// ===================================

/**
 * GET /api/crm/leads - Buscar todos os leads (Kanban)
 */
router.get('/leads', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const filters = {
            stageId: req.query.stage,
            assignedTo: req.query.seller,
            temperature: req.query.temperature,
            search: req.query.search
        };

        const leads = await crmService.getLeadsByStage(userId, filters);
        res.json({ success: true, leads });
    } catch (error) {
        console.error('❌ Erro ao buscar leads:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/crm/leads/:id - Buscar lead específico
 */
router.get('/leads/:id', requireAuth, async (req, res) => {
    try {
        const leadId = req.params.id;
        const [lead] = await crmService.getLeadsByStage(req.session.userId, { leadId });
        
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead não encontrado' });
        }

        // Buscar atividades e notas
        const activities = await crmService.getActivities(leadId);
        const notes = await crmService.getNotes(leadId);

        res.json({ success: true, lead, activities, notes });
    } catch (error) {
        console.error('❌ Erro ao buscar lead:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/crm/leads - Criar lead manualmente
 */
router.post('/leads', requireAuth, async (req, res) => {
    try {
        const { phone, name, email, state, interestedCourse, source } = req.body;
        
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Telefone é obrigatório' });
        }

        const leadId = await crmService.upsertLead({
            userId: req.session.userId,
            phone,
            name,
            email,
            state,
            interestedCourse,
            channel: 'manual',
            source
        });

        res.json({ success: true, leadId, message: 'Lead criado com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao criar lead:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PUT /api/crm/leads/:id - Atualizar lead
 */
router.put('/leads/:id', requireAuth, async (req, res) => {
    try {
        const leadId = req.params.id;
        const updates = req.body;

        // TODO: Implementar update específico
        // Por enquanto, usar upsertLead para atualizar

        res.json({ success: true, message: 'Lead atualizado' });
    } catch (error) {
        console.error('❌ Erro ao atualizar lead:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/crm/leads/:id/move - Mover lead para outro estágio
 */
router.post('/leads/:id/move', requireAuth, async (req, res) => {
    try {
        const leadId = req.params.id;
        const { stageId } = req.body;

        if (!stageId) {
            return res.status(400).json({ success: false, message: 'stageId é obrigatório' });
        }

        await crmService.moveLeadToStage(leadId, stageId, req.session.userId);
        res.json({ success: true, message: 'Lead movido com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao mover lead:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/crm/leads/:id/assign - Atribuir lead a vendedor
 */
router.post('/leads/:id/assign', requireAuth, async (req, res) => {
    try {
        const leadId = req.params.id;
        const { sellerId } = req.body;

        await crmService.assignLead(leadId, sellerId, req.session.userId);
        res.json({ success: true, message: 'Lead atribuído com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao atribuir lead:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/crm/leads/:id/bot-toggle - Pausar/Reativar Bot
 */
router.post('/leads/:id/bot-toggle', requireAuth, async (req, res) => {
    try {
        const leadId = req.params.id;
        const { active } = req.body;

        await crmService.toggleBot(leadId, active, req.session.userId);
        res.json({ 
            success: true, 
            message: active ? 'Bot reativado' : 'Bot pausado',
            botActive: active
        });
    } catch (error) {
        console.error('❌ Erro ao alternar bot:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/crm/leads/:id/shark-grab - Pegar lead do Shark Tank
 */
router.post('/leads/:id/shark-grab', requireAuth, async (req, res) => {
    try {
        const leadId = req.params.id;
        const userId = req.session.userId;

        // Verificar se lead está disponível (não atribuído)
        const lead = await crmService.getLeadByPhone(req.body.phone, userId);
        
        if (lead && lead.assigned_to) {
            return res.status(400).json({ 
                success: false, 
                message: 'Lead já foi pego por outro vendedor' 
            });
        }

        await crmService.assignLead(leadId, userId, userId);
        res.json({ success: true, message: 'Lead capturado com sucesso!' });
    } catch (error) {
        console.error('❌ Erro ao capturar lead:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===================================
// NOTAS E ATIVIDADES
// ===================================

/**
 * POST /api/crm/leads/:id/notes - Adicionar nota
 */
router.post('/leads/:id/notes', requireAuth, async (req, res) => {
    try {
        const leadId = req.params.id;
        const { note, isPinned } = req.body;

        if (!note) {
            return res.status(400).json({ success: false, message: 'Nota não pode ser vazia' });
        }

        const noteId = await crmService.addNote(leadId, req.session.userId, note, isPinned);
        res.json({ success: true, noteId, message: 'Nota adicionada' });
    } catch (error) {
        console.error('❌ Erro ao adicionar nota:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/crm/leads/:id/activities - Buscar atividades do lead
 */
router.get('/leads/:id/activities', requireAuth, async (req, res) => {
    try {
        const leadId = req.params.id;
        const activities = await crmService.getActivities(leadId, 100);
        res.json({ success: true, activities });
    } catch (error) {
        console.error('❌ Erro ao buscar atividades:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===================================
// ESTÁGIOS
// ===================================

/**
 * GET /api/crm/stages - Buscar todos os estágios
 */
router.get('/stages', requireAuth, async (req, res) => {
    try {
        const stages = await crmService.getStages(req.session.userId);
        res.json({ success: true, stages });
    } catch (error) {
        console.error('❌ Erro ao buscar estágios:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/crm/stages/init - Criar estágios padrão
 */
router.post('/stages/init', requireAuth, async (req, res) => {
    try {
        await crmService.createDefaultStages(req.session.userId);
        res.json({ success: true, message: 'Estágios criados com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao criar estágios:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/crm/stages - Criar novo estágio
 */
router.post('/stages', requireAuth, async (req, res) => {
    try {
        const { name, color, position } = req.body;
        const userId = req.session.userId;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Nome do estágio é obrigatório' });
        }

        const stage = await crmService.createStage(userId, { name, color, position });
        res.json({ success: true, message: 'Estágio criado com sucesso', stage });
    } catch (error) {
        console.error('❌ Erro ao criar estágio:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PUT /api/crm/stages/:id - Atualizar estágio
 */
router.put('/stages/:id', requireAuth, async (req, res) => {
    try {
        const stageId = req.params.id;
        const userId = req.session.userId;
        const updates = req.body;

        await crmService.updateStage(userId, stageId, updates);
        res.json({ success: true, message: 'Estágio atualizado com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao atualizar estágio:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * DELETE /api/crm/stages/:id - Deletar estágio
 */
router.delete('/stages/:id', requireAuth, async (req, res) => {
    try {
        const stageId = req.params.id;
        const userId = req.session.userId;
        const { moveLeadsToStageId } = req.query;

        if (!moveLeadsToStageId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Informe o ID do estágio para onde mover os leads' 
            });
        }

        await crmService.deleteStage(userId, stageId, moveLeadsToStageId);
        res.json({ success: true, message: 'Estágio deletado com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao deletar estágio:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PUT /api/crm/stages/reorder - Reordenar estágios
 */
router.put('/stages/reorder', requireAuth, async (req, res) => {
    try {
        const { stageIds } = req.body; // Array com IDs na ordem desejada
        const userId = req.session.userId;

        if (!Array.isArray(stageIds)) {
            return res.status(400).json({ success: false, message: 'stageIds deve ser um array' });
        }

        await crmService.reorderStages(userId, stageIds);
        res.json({ success: true, message: 'Estágios reordenados com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao reordenar estágios:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===================================
// DASHBOARD E RELATÓRIOS
// ===================================

/**
 * GET /api/crm/dashboard/stats - Estatísticas financeiras
 */
router.get('/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const stats = await crmService.getDashboardStats(req.session.userId);
        res.json({ success: true, stats });
    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/crm/dashboard/lost-reasons - Motivos de perda
 */
router.get('/dashboard/lost-reasons', requireAuth, async (req, res) => {
    try {
        const reasons = await crmService.getLostReasons(req.session.userId);
        res.json({ success: true, reasons });
    } catch (error) {
        console.error('❌ Erro ao buscar motivos de perda:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/crm/dashboard/sellers - Ranking de vendedores
 */
router.get('/dashboard/sellers', requireAuth, async (req, res) => {
    try {
        const ranking = await crmService.getSellerRanking(req.session.userId);
        res.json({ success: true, ranking });
    } catch (error) {
        console.error('❌ Erro ao buscar ranking:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===================================
// EXPORTAÇÃO
// ===================================

/**
 * GET /api/crm/export - Exportar leads para CSV
 */
router.get('/export', requireAuth, async (req, res) => {
    try {
        const filters = {
            stageId: req.query.stage
        };

        const leads = await crmService.exportLeads(req.session.userId, filters);

        // Converter para CSV
        if (leads.length === 0) {
            return res.status(404).json({ success: false, message: 'Nenhum lead para exportar' });
        }

        const headers = Object.keys(leads[0]);
        const csvRows = [
            headers.join(','), // Cabeçalho
            ...leads.map(lead => 
                headers.map(header => {
                    const value = lead[header];
                    // Escapar valores com vírgula ou quebra de linha
                    if (value === null || value === undefined) return '';
                    const escaped = String(value).replace(/"/g, '""');
                    return `"${escaped}"`;
                }).join(',')
            )
        ];

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="leads_${Date.now()}.csv"`);
        res.send('\uFEFF' + csv); // BOM para UTF-8
    } catch (error) {
        console.error('❌ Erro ao exportar leads:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/crm/export/json - Exportar em JSON (para importação futura)
 */
router.get('/export/json', requireAuth, async (req, res) => {
    try {
        const leads = await crmService.exportLeads(req.session.userId);
        res.json({ success: true, leads, count: leads.length });
    } catch (error) {
        console.error('❌ Erro ao exportar JSON:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===================================
// WEBHOOKS (Para integração com gateways)
// ===================================

/**
 * POST /api/crm/webhook/payment - Receber notificação de pagamento
 * (Kiwify, Hotmart, etc)
 */
router.post('/webhook/payment', async (req, res) => {
    try {
        const payload = req.body;
        console.log('📥 Webhook de pagamento recebido:', payload);

        // TODO: Validar assinatura do webhook
        // TODO: Identificar lead pelo email/telefone
        // TODO: Mover lead para "Venda Confirmada"
        // TODO: Registrar valor final

        res.json({ success: true, message: 'Webhook processado' });
    } catch (error) {
        console.error('❌ Erro ao processar webhook:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
