const db = require('../config/database');
const authService = require('./auth.service');

/**
 * CRM Service - Lógica de Negócio do Kanban
 * Gestão de Leads, Scoring, Distribuição, SLA
 */
class CRMService {
    
    // ===================================
    // GESTÃO DE LEADS
    // ===================================
    
    /**
     * Criar ou atualizar lead automaticamente
     */
    async upsertLead(data) {
        try {
            const { 
                userId, phone, name, email, state, rqe, specialty,
                interestedCourse, channel, source, isFormerStudent, assignedTo
            } = data;

            // Buscar estágio inicial
            const [stages] = await db.query(
                'SELECT id FROM crm_stages WHERE user_id = ? ORDER BY position LIMIT 1',
                [userId]
            );

            if (stages.length === 0) {
                // Criar estágios padrão se não existirem
                await this.createDefaultStages(userId);
                return this.upsertLead(data); // Retry
            }

            const initialStageId = stages[0].id;

            // Verificar se lead já existe
            const [existing] = await db.query(
                'SELECT id, stage_id FROM crm_leads WHERE phone = ? AND user_id = ?',
                [phone, userId]
            );

            let leadId;

            if (existing.length > 0) {
                // Atualizar lead existente
                leadId = existing[0].id;
                await db.query(`
                    UPDATE crm_leads SET
                        name = COALESCE(?, name),
                        email = COALESCE(?, email),
                        state = COALESCE(?, state),
                        rqe = COALESCE(?, rqe),
                        specialty = COALESCE(?, specialty),
                        interested_course = COALESCE(?, interested_course),
                        is_former_student = COALESCE(?, is_former_student),
                        assigned_to = COALESCE(?, assigned_to),
                        last_contact_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [name, email, state, rqe, specialty, interestedCourse, isFormerStudent, assignedTo, leadId]);

                // Log de atividade
                await this.logActivity(leadId, userId, 'message_received', 'Nova mensagem recebida');
            } else {
                // Criar novo lead
                const [result] = await db.query(`
                    INSERT INTO crm_leads (
                        user_id, phone, name, email, state, rqe, specialty,
                        stage_id, channel, source, interested_course, is_former_student,
                        assigned_to, bot_active, last_contact_at, temperature
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP, 'warm')
                `, [userId, phone, name, email, state, rqe, specialty, initialStageId, 
                    channel || 'whatsapp', source, interestedCourse, isFormerStudent || false, assignedTo]);

                leadId = result.insertId;

                // Distribuir lead se configurado (apenas se assignedTo não foi especificado)
                if (!assignedTo) {
                    await this.distributeLeadIfNeeded(leadId, userId);
                }

                // Log de criação
                await this.logActivity(leadId, userId, 'message_received', 'Novo lead criado');
            }

            // Atualizar scoring e temperatura
            await this.updateLeadScore(leadId);
            await this.updateLeadTemperature(leadId);

            return leadId;
        } catch (error) {
            console.error('❌ Erro ao criar/atualizar lead:', error);
            throw error;
        }
    }

    /**
     * Deletar lead permanentemente
     */
    async deleteLead(leadId, userId) {
        try {
            // Verificar se o lead pertence ao usuário
            const [lead] = await db.query(
                'SELECT id FROM crm_leads WHERE id = ? AND user_id = ?',
                [leadId, userId]
            );

            if (lead.length === 0) {
                throw new Error('Lead não encontrado ou sem permissão');
            }

            // Deletar atividades relacionadas
            await db.query('DELETE FROM crm_activities WHERE lead_id = ?', [leadId]);

            // Deletar o lead
            await db.query('DELETE FROM crm_leads WHERE id = ?', [leadId]);

            console.log(`✅ Lead ${leadId} deletado com sucesso`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao deletar lead:', error);
            throw error;
        }
    }

    /**
     * Buscar lead por telefone
     */
    async getLeadByPhone(phone, userId) {
        const [leads] = await db.query(`
            SELECT l.*, s.name as stage_name, s.color as stage_color,
                   u.name as assigned_name
            FROM crm_leads l
            INNER JOIN crm_stages s ON l.stage_id = s.id
            LEFT JOIN users u ON l.assigned_to = u.id
            WHERE l.phone = ? AND l.user_id = ?
        `, [phone, userId]);

        return leads[0] || null;
    }

    /**
     * Buscar todos os leads do Kanban (com filtro de permissão)
     */
    async getLeadsByStage(userId, filters = {}) {
        // Obter filtro de acesso baseado no role
        const accessFilter = await authService.getLeadAccessFilter(userId);
        
        let query = `
            SELECT l.*, s.name as stage_name, s.color as stage_color,
                   u.name as assigned_name,
                   TIMESTAMPDIFF(MINUTE, l.last_response_at, NOW()) as minutes_since_response
            FROM crm_leads l
            INNER JOIN crm_stages s ON l.stage_id = s.id
            LEFT JOIN users u ON l.assigned_to = u.id
            WHERE ${accessFilter.condition}
        `;
        
        const params = [...accessFilter.params];

        // Filtros adicionais
        if (filters.leadId) {
            query += ' AND l.id = ?';
            params.push(filters.leadId);
        }
        if (filters.stageId) {
            query += ' AND l.stage_id = ?';
            params.push(filters.stageId);
        }
        if (filters.assignedTo) {
            query += ' AND l.assigned_to = ?';
            params.push(filters.assignedTo);
        }
        if (filters.temperature) {
            query += ' AND l.temperature = ?';
            params.push(filters.temperature);
        }
        if (filters.search) {
            query += ' AND (l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY l.score DESC, l.last_activity_at DESC';

        const [leads] = await db.query(query, params);
        return leads;
    }

    /**
     * Mover lead para outro estágio
     */
    async moveLeadToStage(leadId, newStageId, userId) {
        try {
            const [lead] = await db.query('SELECT stage_id FROM crm_leads WHERE id = ?', [leadId]);
            if (lead.length === 0) throw new Error('Lead não encontrado');

            const oldStageId = lead[0].stage_id;

            // Verificar se o novo estágio tem bot ativo
            const [stage] = await db.query('SELECT bot_enabled FROM crm_stages WHERE id = ?', [newStageId]);
            const botActive = stage[0].bot_enabled;

            await db.query(`
                UPDATE crm_leads SET
                    stage_id = ?,
                    bot_active = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [newStageId, botActive, leadId]);

            // Log automático via trigger, mas vamos adicionar detalhes
            await this.logActivity(leadId, userId, 'stage_changed', 
                'Movido de estágio', { oldStageId, newStageId });

            // 🔌 Emitir evento Socket.IO
            this.emitCRMEvent(userId, 'lead-moved', { leadId, oldStageId, newStageId });

            return true;
        } catch (error) {
            console.error('❌ Erro ao mover lead:', error);
            throw error;
        }
    }

    /**
     * Pausar/Reativar Bot
     */
    async toggleBot(leadId, active, userId) {
        try {
            const status = active ? 'resumed' : 'paused';
            
            await db.query(`
                UPDATE crm_leads SET
                    bot_active = ?,
                    bot_paused_at = ${active ? 'NULL' : 'CURRENT_TIMESTAMP'},
                    bot_paused_by = ${active ? 'NULL' : '?'}
                WHERE id = ?
            `, active ? [active, leadId] : [active, userId, leadId]);

            await this.logActivity(leadId, userId, `bot_${status}`, 
                active ? 'Bot reativado' : 'Bot pausado manualmente');

            // 🔌 Emitir evento Socket.IO
            this.emitCRMEvent(userId, 'bot-toggled', { leadId, active });

            return true;
        } catch (error) {
            console.error('❌ Erro ao alternar bot:', error);
            throw error;
        }
    }

    /**
     * Atribuir lead a vendedor
     */
    async assignLead(leadId, sellerId, userId) {
        try {
            await db.query('UPDATE crm_leads SET assigned_to = ? WHERE id = ?', [sellerId, leadId]);
            await this.logActivity(leadId, userId, 'assigned', 
                `Lead atribuído ao vendedor ID ${sellerId}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao atribuir lead:', error);
            throw error;
        }
    }

    // ===================================
    // DISTRIBUIÇÃO DE LEADS
    // ===================================

    async distributeLeadIfNeeded(leadId, userId) {
        try {
            const [settings] = await db.query(
                'SELECT distribution_mode FROM crm_settings WHERE user_id = ?',
                [userId]
            );

            if (settings.length === 0 || settings[0].distribution_mode === 'manual') {
                return; // Distribuição manual, não fazer nada
            }

            const mode = settings[0].distribution_mode;

            if (mode === 'round_robin') {
                await this.distributeRoundRobin(leadId, userId);
            } else if (mode === 'shark_tank') {
                await this.notifySharkTank(leadId, userId);
            }
        } catch (error) {
            console.error('❌ Erro na distribuição:', error);
        }
    }

    async distributeRoundRobin(leadId, userId) {
        // Buscar vendedores ativos (excluindo o admin principal)
        const [sellers] = await db.query(`
            SELECT id FROM users 
            WHERE id != ? AND is_active = TRUE
            ORDER BY id
        `, [userId]);

        if (sellers.length === 0) {
            // Atribuir ao próprio dono do sistema
            await this.assignLead(leadId, userId, userId);
            return;
        }

        // Buscar último vendedor que recebeu lead
        const [lastAssignment] = await db.query(`
            SELECT assigned_to FROM crm_leads 
            WHERE user_id = ? AND assigned_to IS NOT NULL 
            ORDER BY created_at DESC LIMIT 1
        `, [userId]);

        let nextSellerIndex = 0;
        if (lastAssignment.length > 0) {
            const lastSellerId = lastAssignment[0].assigned_to;
            const currentIndex = sellers.findIndex(s => s.id === lastSellerId);
            nextSellerIndex = (currentIndex + 1) % sellers.length;
        }

        const nextSeller = sellers[nextSellerIndex].id;
        await this.assignLead(leadId, nextSeller, userId);
        
        console.log(`🎯 Lead ${leadId} distribuído (Round Robin) para vendedor ${nextSeller}`);
    }

    async notifySharkTank(leadId, userId) {
        // TODO: Implementar notificação WebSocket para todos os vendedores
        // Por enquanto, apenas marca como não atribuído
        console.log(`🦈 Lead ${leadId} disponível no Shark Tank`);
    }

    // ===================================
    // LEAD SCORING E TEMPERATURA
    // ===================================

    async updateLeadScore(leadId) {
        try {
            const [lead] = await db.query(`
                SELECT 
                    name, email, rqe, interested_course,
                    TIMESTAMPDIFF(MINUTE, last_response_at, NOW()) as minutes_since_response,
                    (SELECT COUNT(*) FROM crm_activities WHERE lead_id = ? AND activity_type = 'message_received') as message_count
                FROM crm_leads WHERE id = ?
            `, [leadId, leadId]);

            if (lead.length === 0) return;

            let score = 0;
            const l = lead[0];

            // Dados preenchidos
            if (l.name) score += 10;
            if (l.email) score += 10;
            if (l.rqe) score += 15;
            if (l.interested_course) score += 20;

            // Engajamento
            if (l.message_count > 5) score += 15;
            if (l.message_count > 10) score += 10;

            // Recência
            if (l.minutes_since_response < 60) score += 20; // Última resposta há menos de 1h
            else if (l.minutes_since_response < 1440) score += 10; // Menos de 24h

            // Limitar entre 0-100
            score = Math.min(100, Math.max(0, score));

            await db.query('UPDATE crm_leads SET score = ? WHERE id = ?', [score, leadId]);
            
            return score;
        } catch (error) {
            console.error('❌ Erro ao atualizar score:', error);
        }
    }

    async updateLeadTemperature(leadId) {
        try {
            const [lead] = await db.query(`
                SELECT 
                    score,
                    TIMESTAMPDIFF(HOUR, last_response_at, NOW()) as hours_since_response
                FROM crm_leads WHERE id = ?
            `, [leadId]);

            if (lead.length === 0) return;

            const { score, hours_since_response } = lead[0];
            let temperature = 'warm';

            // Lógica de temperatura
            if (score >= 70 && hours_since_response < 24) {
                temperature = 'hot';
            } else if (score < 30 || hours_since_response > 72) {
                temperature = 'cold';
            }

            await db.query(`
                UPDATE crm_leads SET 
                    temperature = ?,
                    temperature_updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [temperature, leadId]);

            return temperature;
        } catch (error) {
            console.error('❌ Erro ao atualizar temperatura:', error);
        }
    }

    // ===================================
    // SLA TRACKING
    // ===================================

    async checkSLA(leadId) {
        try {
            const [lead] = await db.query(`
                SELECT l.*, s.sla_response_time, s.sla_enabled
                FROM crm_leads l
                INNER JOIN crm_settings s ON l.user_id = s.user_id
                WHERE l.id = ? AND s.sla_enabled = TRUE
            `, [leadId]);

            if (lead.length === 0) return;

            const { last_response_at, sla_response_time } = lead[0];
            const minutesSinceResponse = Math.floor((Date.now() - new Date(last_response_at)) / 1000 / 60);

            if (minutesSinceResponse > (sla_response_time / 60)) {
                // SLA violado
                await db.query('UPDATE crm_leads SET sla_alert = TRUE WHERE id = ?', [leadId]);
                // TODO: Notificar gestor
                console.log(`⚠️ SLA violado para lead ${leadId}`);
            }
        } catch (error) {
            console.error('❌ Erro ao verificar SLA:', error);
        }
    }

    // ===================================
    // NOTAS E ATIVIDADES
    // ===================================

    async addNote(leadId, userId, noteText, isPinned = false) {
        const [result] = await db.query(`
            INSERT INTO crm_notes (lead_id, user_id, note, is_pinned)
            VALUES (?, ?, ?, ?)
        `, [leadId, userId, noteText, isPinned]);

        await this.logActivity(leadId, userId, 'note_added', 'Nova nota adicionada');
        return result.insertId;
    }

    async getNotes(leadId) {
        const [notes] = await db.query(`
            SELECT n.*, u.name as author_name
            FROM crm_notes n
            INNER JOIN users u ON n.user_id = u.id
            WHERE n.lead_id = ?
            ORDER BY n.is_pinned DESC, n.created_at DESC
        `, [leadId]);
        return notes;
    }

    async logActivity(leadId, userId, activityType, description, metadata = null) {
        await db.query(`
            INSERT INTO crm_activities (lead_id, user_id, activity_type, description, metadata)
            VALUES (?, ?, ?, ?, ?)
        `, [leadId, userId, activityType, description, metadata ? JSON.stringify(metadata) : null]);
    }

    // Alias para logActivity (para compatibilidade com routes)
    async addActivity(leadId, userId, activityType, description, metadata = null) {
        return this.logActivity(leadId, userId, activityType, description, metadata);
    }

    async getActivities(leadId, limit = 50) {
        const [activities] = await db.query(`
            SELECT a.*, u.name as user_name
            FROM crm_activities a
            INNER JOIN users u ON a.user_id = u.id
            WHERE a.lead_id = ?
            ORDER BY a.created_at DESC
            LIMIT ?
        `, [leadId, limit]);
        return activities;
    }

    // ===================================
    // ESTÁGIOS
    // ===================================

    async getStages(userId) {
        const [stages] = await db.query(`
            SELECT s.*, 
                   COUNT(l.id) as lead_count,
                   SUM(l.potential_value) as total_value
            FROM crm_stages s
            LEFT JOIN crm_leads l ON s.id = l.stage_id
            WHERE s.user_id = ?
            GROUP BY s.id
            ORDER BY s.position
        `, [userId]);
        return stages;
    }

    async createDefaultStages(userId) {
        // Verificar se já existem estágios para este usuário
        const [existing] = await db.query(
            'SELECT COUNT(*) as count FROM crm_stages WHERE user_id = ?',
            [userId]
        );
        
        if (existing[0].count > 0) {
            console.log(`⚠️ Estágios já existem para usuário ${userId} - pulando criação`);
            return;
        }

        const stages = [
            { name: 'Novos / Triagem', color: '#6366F1', bot: 1, prob: 5 },
            { name: 'Nutrição / Apresentação', color: '#3B82F6', bot: 1, prob: 15 },
            { name: 'Quente / Link Enviado', color: '#F59E0B', bot: 0, prob: 60 },
            { name: 'Em Negociação', color: '#EF4444', bot: 0, prob: 80 },
            { name: 'Aguardando Pagamento', color: '#8B5CF6', bot: 0, prob: 90 },
            { name: 'Venda Confirmada', color: '#10B981', bot: 0, prob: 100 },
            { name: 'Perdido / Arquivado', color: '#6B7280', bot: 0, prob: 0 }
        ];

        for (let i = 0; i < stages.length; i++) {
            const s = stages[i];
            await db.query(`
                INSERT INTO crm_stages (user_id, name, position, color, bot_enabled, conversion_probability)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [userId, s.name, i + 1, s.color, s.bot, s.prob]);
        }

        // Marcar estágios especiais
        await db.query(`
            UPDATE crm_stages SET is_success = TRUE 
            WHERE user_id = ? AND name = 'Venda Confirmada'
        `, [userId]);

        await db.query(`
            UPDATE crm_stages SET is_lost = TRUE 
            WHERE user_id = ? AND name = 'Perdido / Arquivado'
        `, [userId]);

        console.log(`✅ Estágios padrão criados para usuário ${userId}`);
    }

    // ===================================
    // DASHBOARD E RELATÓRIOS
    // ===================================

    async getDashboardStats(userId) {
        // Faturamento realizado (total de vendas ganhas)
        const [revenue] = await db.query(`
            SELECT COALESCE(SUM(l.potential_value), 0) as total
            FROM crm_leads l
            INNER JOIN crm_stages s ON l.stage_id = s.id
            WHERE l.user_id = ? AND s.is_success = TRUE
        `, [userId]);

        // Pipeline ponderado
        const [pipeline] = await db.query(`
            SELECT COALESCE(SUM(l.potential_value * s.conversion_probability / 100), 0) as weighted
            FROM crm_leads l
            INNER JOIN crm_stages s ON l.stage_id = s.id
            WHERE l.user_id = ? AND s.is_lost = FALSE AND s.is_success = FALSE
        `, [userId]);

        // Aguardando pagamento (busca por nome que contenha "Aguardando")
        const [waiting] = await db.query(`
            SELECT COALESCE(SUM(l.potential_value), 0) as total
            FROM crm_leads l
            INNER JOIN crm_stages s ON l.stage_id = s.id
            WHERE l.user_id = ? AND s.name LIKE '%Aguardando%'
        `, [userId]);

        // Dinheiro na mesa (perdido)
        const [lost] = await db.query(`
            SELECT COALESCE(SUM(l.potential_value), 0) as total
            FROM crm_leads l
            INNER JOIN crm_stages s ON l.stage_id = s.id
            WHERE l.user_id = ? AND s.is_lost = TRUE
        `, [userId]);

        // Motivos de perda
        const [lostReasons] = await db.query(`
            SELECT lost_reason as reason, COUNT(*) as count, 
                   SUM(potential_value) as total_value
            FROM crm_leads l
            INNER JOIN crm_stages s ON l.stage_id = s.id
            WHERE l.user_id = ? AND s.is_lost = TRUE AND lost_reason IS NOT NULL
            GROUP BY lost_reason
            ORDER BY count DESC
        `, [userId]);

        return {
            revenue_realized: parseFloat(revenue[0].total || 0),
            pipeline_weighted: parseFloat(pipeline[0].weighted || 0),
            awaiting_payment: parseFloat(waiting[0].total || 0),
            money_lost: parseFloat(lost[0].total || 0),
            lost_reasons: lostReasons
        };
    }

    async getLostReasons(userId) {
        const [reasons] = await db.query(`
            SELECT lost_reason as reason, COUNT(*) as count, 
                   SUM(potential_value) as total_value
            FROM crm_leads l
            INNER JOIN crm_stages s ON l.stage_id = s.id
            WHERE l.user_id = ? AND s.is_lost = TRUE AND lost_reason IS NOT NULL
            GROUP BY lost_reason
            ORDER BY count DESC
        `, [userId]);
        return reasons;
    }

    async getSellerRanking(userId) {
        const [ranking] = await db.query(`
            SELECT 
                u.id, u.name,
                COUNT(DISTINCT l.id) as total_leads,
                COUNT(DISTINCT CASE WHEN s.is_success THEN l.id END) as won_leads,
                COALESCE(SUM(CASE WHEN s.is_success THEN l.potential_value END), 0) as total_revenue,
                ROUND(COUNT(CASE WHEN s.is_success THEN 1 END) * 100.0 / NULLIF(COUNT(l.id), 0), 2) as conversion_rate
            FROM users u
            LEFT JOIN crm_leads l ON l.assigned_to = u.id AND l.user_id = ?
            LEFT JOIN crm_stages s ON l.stage_id = s.id
            WHERE u.id != ?
            GROUP BY u.id, u.name
            HAVING total_leads > 0
            ORDER BY total_revenue DESC
        `, [userId, userId]);
        return ranking;
    }

    // ===================================
    // EXPORTAÇÃO
    // ===================================

    async exportLeads(userId, filters = {}) {
        let query = `
            SELECT 
                l.id,
                CASE WHEN l.is_former_student THEN 'Sim' ELSE 'Não' END as ex_aluno,
                l.name as nome,
                l.state as estado,
                l.email,
                l.phone as telefone,
                l.interested_course as interesse,
                l.course_selected as curso,
                CASE l.channel 
                    WHEN 'whatsapp' THEN 'WhatsApp'
                    WHEN 'instagram' THEN 'Instagram'
                    ELSE l.channel
                END as canal,
                DATE_FORMAT(l.created_at, '%d/%m/%Y') as data_entrada,
                DATE_FORMAT(l.created_at, '%H:%i') as hora_entrada,
                s.name as ultima_situacao,
                (SELECT description FROM crm_activities WHERE lead_id = l.id ORDER BY created_at DESC LIMIT 1) as ultima_mensagem,
                u.name as vendedor,
                l.notes as observacao,
                l.lost_reason as motivo_perda,
                l.potential_value as valor
            FROM crm_leads l
            INNER JOIN crm_stages s ON l.stage_id = s.id
            LEFT JOIN users u ON l.assigned_to = u.id
            WHERE l.user_id = ?
        `;

        const params = [userId];

        if (filters.stageId) {
            query += ' AND l.stage_id = ?';
            params.push(filters.stageId);
        }

        query += ' ORDER BY l.created_at DESC';

        const [leads] = await db.query(query, params);
        return leads;
    }

    // ===================================
    // SOCKET.IO - EVENTOS EM TEMPO REAL
    // ===================================

    emitCRMEvent(userId, eventName, data) {
        try {
            if (global.io) {
                global.io.to(`crm-${userId}`).emit(eventName, data);
                console.log(`🔌 Evento Socket.IO emitido: ${eventName} para user ${userId}`);
            }
        } catch (error) {
            console.error('⚠️ Erro ao emitir evento Socket.IO:', error.message);
        }
    }

    async notifyNewLead(userId, leadId) {
        this.emitCRMEvent(userId, 'new-lead', { leadId });
    }

    async notifyHotLead(userId, leadId) {
        this.emitCRMEvent(userId, 'hot-lead', { leadId });
    }

    async notifySLABreach(userId, leadId) {
        this.emitCRMEvent(userId, 'sla-breach', { leadId });
    }

    // ===================================
    // GERENCIAMENTO DE ESTÁGIOS
    // ===================================

    async createStage(userId, { name, color = '#6366F1', position }) {
        // Se não informou posição, colocar no final
        if (!position) {
            const [stages] = await db.query(
                'SELECT MAX(position) as maxPos FROM crm_stages WHERE user_id = ?',
                [userId]
            );
            position = (stages[0].maxPos || 0) + 1;
        }

        const [result] = await db.query(`
            INSERT INTO crm_stages 
            (user_id, name, position, color, bot_enabled, conversion_probability) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [userId, name, position, color, false, 50]);

        return { id: result.insertId, name, color, position };
    }

    async updateStage(userId, stageId, updates) {
        const allowedFields = ['name', 'color', 'bot_enabled', 'conversion_probability', 'is_success', 'is_lost'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new Error('Nenhum campo válido para atualizar');
        }

        values.push(userId, stageId);

        await db.query(`
            UPDATE crm_stages 
            SET ${fields.join(', ')}
            WHERE user_id = ? AND id = ?
        `, values);

        console.log(`✅ Estágio ${stageId} atualizado`);
    }

    async deleteStage(userId, stageId, moveLeadsToStageId) {
        // Verificar se o estágio existe e pertence ao usuário
        const [stages] = await db.query(
            'SELECT id FROM crm_stages WHERE id = ? AND user_id = ?',
            [stageId, userId]
        );

        if (stages.length === 0) {
            throw new Error('Estágio não encontrado');
        }

        // Verificar se o estágio de destino existe
        const [targetStages] = await db.query(
            'SELECT id FROM crm_stages WHERE id = ? AND user_id = ?',
            [moveLeadsToStageId, userId]
        );

        if (targetStages.length === 0) {
            throw new Error('Estágio de destino não encontrado');
        }

        // Mover todos os leads para o novo estágio
        await db.query(`
            UPDATE crm_leads 
            SET stage_id = ? 
            WHERE stage_id = ? AND user_id = ?
        `, [moveLeadsToStageId, stageId, userId]);

        // Deletar o estágio
        await db.query(
            'DELETE FROM crm_stages WHERE id = ? AND user_id = ?',
            [stageId, userId]
        );

        // Reordenar posições
        await db.query(`
            SET @pos = 0;
            UPDATE crm_stages 
            SET position = (@pos := @pos + 1) 
            WHERE user_id = ? 
            ORDER BY position
        `, [userId]);

        console.log(`✅ Estágio ${stageId} deletado, leads movidos para ${moveLeadsToStageId}`);
    }

    async reorderStages(userId, stageIds) {
        // Atualizar posição de cada estágio
        for (let i = 0; i < stageIds.length; i++) {
            await db.query(`
                UPDATE crm_stages 
                SET position = ? 
                WHERE id = ? AND user_id = ?
            `, [i + 1, stageIds[i], userId]);
        }

        console.log(`✅ ${stageIds.length} estágios reordenados`);
    }
}

module.exports = new CRMService();
