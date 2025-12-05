/**
 * Bot Control Service
 * Gerencia o estado do bot (ativo/pausado) e transições automáticas
 */

const pool = require('../config/database');

class BotControlService {
    /**
     * Pausa o bot para um lead específico
     * @param {number} leadId - ID do lead
     * @param {string} reason - Motivo da pausa
     * @param {number|null} userId - ID do usuário que pausou (null para automático)
     * @returns {Promise<boolean>}
     */
    async pauseBot(leadId, reason = 'manual', userId = null) {
        try {
            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();

                // Atualiza status do bot no lead
                await connection.query(
                    `UPDATE crm_leads 
                     SET bot_active = FALSE, 
                         bot_paused_at = NOW(), 
                         bot_paused_by = ?,
                         bot_last_action = ?
                     WHERE id = ?`,
                    [userId, `Pausado: ${reason}`, leadId]
                );

                // Registra atividade
                await connection.query(
                    `INSERT INTO crm_activities (lead_id, user_id, activity_type, description, metadata)
                     VALUES (?, ?, 'bot_paused', ?, ?)`,
                    [
                        leadId,
                        userId || 1, // Usa ID 1 (sistema) se não houver usuário
                        reason,
                        JSON.stringify({ reason, paused_by: userId ? 'user' : 'automatic' })
                    ]
                );

                await connection.commit();
                console.log(`✅ Bot pausado para lead ${leadId}. Motivo: ${reason}`);
                return true;

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            console.error('❌ Erro ao pausar bot:', error);
            throw error;
        }
    }

    /**
     * Retoma o bot para um lead específico
     * @param {number} leadId - ID do lead
     * @param {number|null} userId - ID do usuário que retomou
     * @returns {Promise<boolean>}
     */
    async resumeBot(leadId, userId = null) {
        try {
            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();

                // Atualiza status do bot no lead
                await connection.query(
                    `UPDATE crm_leads 
                     SET bot_active = TRUE, 
                         bot_paused_at = NULL, 
                         bot_paused_by = NULL,
                         bot_last_action = 'Bot retomado'
                     WHERE id = ?`,
                    [leadId]
                );

                // Registra atividade
                await connection.query(
                    `INSERT INTO crm_activities (lead_id, user_id, activity_type, description, metadata)
                     VALUES (?, ?, 'bot_resumed', 'Bot retomado manualmente', ?)`,
                    [
                        leadId,
                        userId || 1,
                        JSON.stringify({ resumed_by: userId ? 'user' : 'automatic' })
                    ]
                );

                await connection.commit();
                console.log(`✅ Bot retomado para lead ${leadId}`);
                return true;

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            console.error('❌ Erro ao retomar bot:', error);
            throw error;
        }
    }

    /**
     * Verifica o status atual do bot para um lead
     * @param {number} leadId - ID do lead
     * @returns {Promise<object>}
     */
    async checkBotStatus(leadId) {
        try {
            const [rows] = await pool.query(
                `SELECT bot_active, bot_paused_at, bot_paused_by, bot_last_action
                 FROM crm_leads
                 WHERE id = ?`,
                [leadId]
            );

            if (rows.length === 0) {
                throw new Error(`Lead ${leadId} não encontrado`);
            }

            return {
                isActive: rows[0].bot_active === 1,
                pausedAt: rows[0].bot_paused_at,
                pausedBy: rows[0].bot_paused_by,
                lastAction: rows[0].bot_last_action
            };

        } catch (error) {
            console.error('❌ Erro ao verificar status do bot:', error);
            throw error;
        }
    }

    /**
     * Pausa bot automaticamente quando vendedor digita
     * @param {number} leadId - ID do lead
     * @param {number} userId - ID do vendedor
     * @returns {Promise<boolean>}
     */
    async autoPauseOnHumanMessage(leadId, userId) {
        const status = await this.checkBotStatus(leadId);
        
        // Só pausa se o bot estiver ativo
        if (status.isActive) {
            return await this.pauseBot(leadId, 'Vendedor iniciou atendimento manual', userId);
        }
        
        return false;
    }

    /**
     * Pausa bot automaticamente quando lead muda para etapa "humana"
     * @param {number} leadId - ID do lead
     * @param {number} stageId - ID da nova etapa
     * @returns {Promise<boolean>}
     */
    async autoPauseOnStageChange(leadId, stageId) {
        try {
            // Verifica se a etapa tem bot_enabled = FALSE
            const [stages] = await pool.query(
                'SELECT bot_enabled FROM crm_stages WHERE id = ?',
                [stageId]
            );

            if (stages.length > 0 && stages[0].bot_enabled === 0) {
                return await this.pauseBot(leadId, 'Movido para etapa de atendimento humano');
            }

            return false;

        } catch (error) {
            console.error('❌ Erro ao verificar etapa:', error);
            return false;
        }
    }

    /**
     * Retoma bot automaticamente quando lead volta para etapa de automação
     * @param {number} leadId - ID do lead
     * @param {number} stageId - ID da nova etapa
     * @returns {Promise<boolean>}
     */
    async autoResumeOnStageChange(leadId, stageId) {
        try {
            // Verifica se a etapa tem bot_enabled = TRUE
            const [stages] = await pool.query(
                'SELECT bot_enabled FROM crm_stages WHERE id = ?',
                [stageId]
            );

            if (stages.length > 0 && stages[0].bot_enabled === 1) {
                const status = await this.checkBotStatus(leadId);
                
                // Só retoma se estiver pausado
                if (!status.isActive) {
                    return await this.resumeBot(leadId);
                }
            }

            return false;

        } catch (error) {
            console.error('❌ Erro ao verificar etapa para retomar:', error);
            return false;
        }
    }

    /**
     * Verifica se o bot pode processar mensagens para este lead
     * @param {number} leadId - ID do lead
     * @returns {Promise<boolean>}
     */
    async canProcessMessage(leadId) {
        try {
            const status = await this.checkBotStatus(leadId);
            return status.isActive;
        } catch (error) {
            console.error('❌ Erro ao verificar se bot pode processar:', error);
            return false; // Fail-safe: não processa se houver erro
        }
    }

    /**
     * Obtém estatísticas de bots ativos/pausados
     * @param {number} userId - ID do proprietário
     * @returns {Promise<object>}
     */
    async getBotStatistics(userId) {
        try {
            const [stats] = await pool.query(
                `SELECT 
                    COUNT(*) as total_leads,
                    SUM(CASE WHEN bot_active = TRUE THEN 1 ELSE 0 END) as bots_active,
                    SUM(CASE WHEN bot_active = FALSE THEN 1 ELSE 0 END) as bots_paused,
                    AVG(CASE WHEN bot_active = TRUE THEN 1 ELSE 0 END) * 100 as percent_active
                 FROM crm_leads
                 WHERE user_id = ?`,
                [userId]
            );

            return stats[0];

        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            throw error;
        }
    }
}

module.exports = new BotControlService();
