/**
 * Lead Distribution Service
 * Gerencia distribuição de leads entre vendedores (Round Robin e Shark Tank)
 */

const pool = require('../config/database');
const EventEmitter = require('events');

class LeadDistributionService extends EventEmitter {
    constructor() {
        super();
        this.sharkTankQueue = new Map(); // leadId => { timestamp, notifiedSellers }
        this.roundRobinCounters = new Map(); // userId => lastSellerIndex
    }

    /**
     * Distribui um lead para um vendedor baseado no modo configurado
     * @param {number} leadId - ID do lead
     * @param {number} ownerId - ID do proprietário do sistema
     * @returns {Promise<object>}
     */
    async distributeLead(leadId, ownerId) {
        try {
            // Busca configurações de distribuição
            const settings = await this.getDistributionSettings(ownerId);
            
            switch (settings.distribution_mode) {
                case 'round_robin':
                    return await this.distributeRoundRobin(leadId, ownerId);
                
                case 'shark_tank':
                    return await this.distributeSharkTank(leadId, ownerId);
                
                case 'manual':
                default:
                    return { mode: 'manual', assigned: false, message: 'Distribuição manual - aguardando atribuição' };
            }

        } catch (error) {
            console.error('❌ Erro ao distribuir lead:', error);
            throw error;
        }
    }

    /**
     * Distribui lead no modo Round Robin (Roleta)
     * @param {number} leadId - ID do lead
     * @param {number} ownerId - ID do proprietário
     * @returns {Promise<object>}
     */
    async distributeRoundRobin(leadId, ownerId) {
        try {
            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();

                // Busca vendedores ativos do time
                const [sellers] = await connection.query(
                    `SELECT id, name FROM users 
                     WHERE role IN ('seller', 'admin') 
                     AND is_active = TRUE 
                     AND (team_owner = ? OR id = ?)
                     ORDER BY id`,
                    [ownerId, ownerId]
                );

                if (sellers.length === 0) {
                    throw new Error('Nenhum vendedor ativo disponível');
                }

                // Obtém o índice atual do round robin
                let currentIndex = this.roundRobinCounters.get(ownerId) || 0;
                
                // Próximo vendedor na fila
                const nextIndex = (currentIndex + 1) % sellers.length;
                const selectedSeller = sellers[nextIndex];

                // Atualiza contador para próxima vez
                this.roundRobinCounters.set(ownerId, nextIndex);

                // Atribui lead ao vendedor
                await connection.query(
                    `UPDATE crm_leads 
                     SET assigned_to = ?,
                         updated_at = NOW()
                     WHERE id = ?`,
                    [selectedSeller.id, leadId]
                );

                // Registra atividade
                await connection.query(
                    `INSERT INTO crm_activities (lead_id, user_id, activity_type, description, metadata)
                     VALUES (?, ?, 'assigned', ?, ?)`,
                    [
                        leadId,
                        selectedSeller.id,
                        `Lead atribuído automaticamente via Round Robin`,
                        JSON.stringify({ 
                            distribution_mode: 'round_robin',
                            seller_id: selectedSeller.id,
                            seller_name: selectedSeller.name,
                            position_in_queue: nextIndex
                        })
                    ]
                );

                await connection.commit();

                // Emite evento para notificações
                this.emit('lead:assigned', {
                    leadId,
                    sellerId: selectedSeller.id,
                    sellerName: selectedSeller.name,
                    mode: 'round_robin'
                });

                console.log(`✅ Lead ${leadId} atribuído para ${selectedSeller.name} (Round Robin)`);

                return {
                    mode: 'round_robin',
                    assigned: true,
                    seller: selectedSeller,
                    message: `Lead atribuído para ${selectedSeller.name}`
                };

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            console.error('❌ Erro no Round Robin:', error);
            throw error;
        }
    }

    /**
     * Distribui lead no modo Shark Tank (primeiro que pegar)
     * @param {number} leadId - ID do lead
     * @param {number} ownerId - ID do proprietário
     * @returns {Promise<object>}
     */
    async distributeSharkTank(leadId, ownerId) {
        try {
            // Busca vendedores ativos
            const [sellers] = await pool.query(
                `SELECT id, name FROM users 
                 WHERE role IN ('seller', 'admin') 
                 AND is_active = TRUE 
                 AND (team_owner = ? OR id = ?)`,
                [ownerId, ownerId]
            );

            if (sellers.length === 0) {
                throw new Error('Nenhum vendedor ativo disponível');
            }

            // Busca configurações para timeout
            const settings = await this.getDistributionSettings(ownerId);
            const timeout = settings.shark_tank_timeout || 300; // 5 minutos padrão

            // Adiciona à fila do Shark Tank
            this.sharkTankQueue.set(leadId, {
                timestamp: Date.now(),
                timeout: timeout * 1000,
                notifiedSellers: sellers.map(s => s.id),
                ownerId
            });

            // Emite evento para notificar vendedores
            this.emit('shark_tank:new_lead', {
                leadId,
                sellers: sellers.map(s => ({ id: s.id, name: s.name })),
                timeout
            });

            console.log(`🦈 Lead ${leadId} disponível no Shark Tank para ${sellers.length} vendedores`);

            // Agenda auto-atribuição se ninguém pegar
            setTimeout(() => {
                this.autoAssignSharkTankLead(leadId, ownerId);
            }, timeout * 1000);

            return {
                mode: 'shark_tank',
                assigned: false,
                availableFor: sellers,
                timeout,
                message: `Lead disponível no Shark Tank - ${sellers.length} vendedores notificados`
            };

        } catch (error) {
            console.error('❌ Erro no Shark Tank:', error);
            throw error;
        }
    }

    /**
     * Permite que vendedor "pegue" um lead do Shark Tank
     * @param {number} leadId - ID do lead
     * @param {number} sellerId - ID do vendedor
     * @returns {Promise<object>}
     */
    async claimSharkTankLead(leadId, sellerId) {
        try {
            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();

                // Verifica se lead ainda está disponível (não foi pego)
                const [leads] = await connection.query(
                    'SELECT assigned_to FROM crm_leads WHERE id = ?',
                    [leadId]
                );

                if (leads.length === 0) {
                    throw new Error('Lead não encontrado');
                }

                if (leads[0].assigned_to !== null) {
                    return {
                        success: false,
                        message: 'Lead já foi pego por outro vendedor',
                        assigned: false
                    };
                }

                // Atribui lead ao vendedor
                await connection.query(
                    `UPDATE crm_leads 
                     SET assigned_to = ?,
                         updated_at = NOW()
                     WHERE id = ? AND assigned_to IS NULL`,
                    [sellerId, leadId]
                );

                // Verifica se conseguiu atribuir (pode ter sido race condition)
                const [updated] = await connection.query(
                    'SELECT assigned_to FROM crm_leads WHERE id = ?',
                    [leadId]
                );

                if (updated[0].assigned_to !== sellerId) {
                    await connection.rollback();
                    return {
                        success: false,
                        message: 'Outro vendedor pegou este lead primeiro',
                        assigned: false
                    };
                }

                // Busca nome do vendedor
                const [seller] = await connection.query(
                    'SELECT name FROM users WHERE id = ?',
                    [sellerId]
                );

                // Registra atividade
                await connection.query(
                    `INSERT INTO crm_activities (lead_id, user_id, activity_type, description, metadata)
                     VALUES (?, ?, 'assigned', ?, ?)`,
                    [
                        leadId,
                        sellerId,
                        `Lead capturado no Shark Tank`,
                        JSON.stringify({ 
                            distribution_mode: 'shark_tank',
                            claimed_at: new Date().toISOString()
                        })
                    ]
                );

                await connection.commit();

                // Remove da fila do Shark Tank
                this.sharkTankQueue.delete(leadId);

                // Emite evento
                this.emit('shark_tank:lead_claimed', {
                    leadId,
                    sellerId,
                    sellerName: seller[0].name
                });

                console.log(`✅ Lead ${leadId} capturado por ${seller[0].name} no Shark Tank`);

                return {
                    success: true,
                    assigned: true,
                    seller: seller[0],
                    message: `Lead capturado com sucesso!`
                };

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            console.error('❌ Erro ao capturar lead do Shark Tank:', error);
            throw error;
        }
    }

    /**
     * Auto-atribui lead se ninguém pegar no Shark Tank (timeout)
     * @param {number} leadId - ID do lead
     * @param {number} ownerId - ID do proprietário
     */
    async autoAssignSharkTankLead(leadId, ownerId) {
        try {
            // Verifica se ainda está na fila
            if (!this.sharkTankQueue.has(leadId)) {
                return; // Já foi pego
            }

            // Verifica se já foi atribuído
            const [leads] = await pool.query(
                'SELECT assigned_to FROM crm_leads WHERE id = ?',
                [leadId]
            );

            if (leads[0].assigned_to !== null) {
                this.sharkTankQueue.delete(leadId);
                return; // Já foi atribuído
            }

            console.log(`⏰ Timeout do Shark Tank - atribuindo lead ${leadId} automaticamente`);

            // Atribui via Round Robin
            const result = await this.distributeRoundRobin(leadId, ownerId);
            
            // Remove da fila
            this.sharkTankQueue.delete(leadId);

            return result;

        } catch (error) {
            console.error('❌ Erro ao auto-atribuir lead do Shark Tank:', error);
        }
    }

    /**
     * Busca configurações de distribuição
     * @param {number} userId - ID do usuário
     * @returns {Promise<object>}
     */
    async getDistributionSettings(userId) {
        try {
            const [settings] = await pool.query(
                `SELECT distribution_mode, shark_tank_timeout
                 FROM crm_settings
                 WHERE user_id = ?`,
                [userId]
            );

            if (settings.length === 0) {
                // Retorna configuração padrão
                return {
                    distribution_mode: 'round_robin',
                    shark_tank_timeout: 300
                };
            }

            return settings[0];

        } catch (error) {
            console.error('❌ Erro ao buscar configurações:', error);
            return {
                distribution_mode: 'round_robin',
                shark_tank_timeout: 300
            };
        }
    }

    /**
     * Atualiza configurações de distribuição
     * @param {number} userId - ID do usuário
     * @param {object} settings - Novas configurações
     * @returns {Promise<boolean>}
     */
    async updateDistributionSettings(userId, settings) {
        try {
            await pool.query(
                `INSERT INTO crm_settings (user_id, distribution_mode, shark_tank_timeout)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    distribution_mode = VALUES(distribution_mode),
                    shark_tank_timeout = VALUES(shark_tank_timeout)`,
                [userId, settings.distribution_mode, settings.shark_tank_timeout]
            );

            console.log(`✅ Configurações de distribuição atualizadas para usuário ${userId}`);
            return true;

        } catch (error) {
            console.error('❌ Erro ao atualizar configurações:', error);
            throw error;
        }
    }

    /**
     * Lista leads disponíveis no Shark Tank
     * @param {number} ownerId - ID do proprietário
     * @returns {Promise<array>}
     */
    async getSharkTankLeads(ownerId) {
        try {
            const leads = [];
            
            for (const [leadId, data] of this.sharkTankQueue.entries()) {
                if (data.ownerId === ownerId) {
                    const [leadData] = await pool.query(
                        `SELECT l.id, l.name, l.phone, l.interested_course, l.created_at,
                                s.name as stage_name
                         FROM crm_leads l
                         LEFT JOIN crm_stages s ON l.stage_id = s.id
                         WHERE l.id = ? AND l.assigned_to IS NULL`,
                        [leadId]
                    );

                    if (leadData.length > 0) {
                        leads.push({
                            ...leadData[0],
                            timeRemaining: Math.max(0, data.timeout - (Date.now() - data.timestamp))
                        });
                    }
                }
            }

            return leads;

        } catch (error) {
            console.error('❌ Erro ao listar leads do Shark Tank:', error);
            return [];
        }
    }
}

module.exports = new LeadDistributionService();
