const db = require('../config/database');
const bcrypt = require('bcrypt');

console.log('✅ [AUTH SERVICE] Módulo carregado - Versão com prefixo l. no filtro SQL - ' + new Date().toISOString());

/**
 * Auth Service - Gerenciamento de Autenticação e Autorização
 */
class AuthService {
    
    /**
     * Obter dados completos do usuário incluindo role
     */
    async getUserById(userId) {
        try {
            const [users] = await db.query(
                `SELECT id, name, email, phone, role, parent_user_id, 
                        is_active, subscription_status, created_at
                 FROM users WHERE id = ?`,
                [userId]
            );
            return users[0] || null;
        } catch (error) {
            console.error('❌ Erro ao buscar usuário:', error);
            throw error;
        }
    }

    /**
     * Verificar se usuário é admin
     */
    async isAdmin(userId) {
        try {
            const user = await this.getUserById(userId);
            return user && user.role === 'admin';
        } catch (error) {
            console.error('❌ Erro ao verificar admin:', error);
            return false;
        }
    }

    /**
     * Verificar se usuário é vendedor
     */
    async isSeller(userId) {
        try {
            const user = await this.getUserById(userId);
            return user && user.role === 'seller';
        } catch (error) {
            console.error('❌ Erro ao verificar vendedor:', error);
            return false;
        }
    }

    /**
     * Obter o admin principal (dono) de um vendedor
     */
    async getParentAdmin(userId) {
        try {
            const user = await this.getUserById(userId);
            if (!user) return null;
            
            // Se já é admin sem pai, retorna ele mesmo
            if (user.role === 'admin' && !user.parent_user_id) {
                return user;
            }
            
            // Se tem pai, retorna o pai
            if (user.parent_user_id) {
                return await this.getUserById(user.parent_user_id);
            }
            
            return user;
        } catch (error) {
            console.error('❌ Erro ao buscar admin pai:', error);
            throw error;
        }
    }

    /**
     * Listar todos os vendedores de um admin
     */
    async getSellers(adminId) {
        try {
            const [sellers] = await db.query(
                `SELECT id, name, email, phone, created_at, is_active
                 FROM users 
                 WHERE parent_user_id = ? AND role = 'seller'
                 ORDER BY name`,
                [adminId]
            );
            return sellers;
        } catch (error) {
            console.error('❌ Erro ao listar vendedores:', error);
            throw error;
        }
    }

    /**
     * Criar vendedor (apenas admin pode)
     */
    async createSeller(adminId, sellerData) {
        try {
            const { name, email, password, phone } = sellerData;
            
            // Verificar se admin
            const isAdminUser = await this.isAdmin(adminId);
            if (!isAdminUser) {
                throw new Error('Apenas administradores podem criar vendedores');
            }

            // Verificar se email já existe
            const [existing] = await db.query(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existing.length > 0) {
                throw new Error('Email já cadastrado');
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 10);

            // Criar vendedor
            const [result] = await db.query(
                `INSERT INTO users (name, email, password, phone, role, parent_user_id, is_active)
                 VALUES (?, ?, ?, ?, 'seller', ?, TRUE)`,
                [name, email, hashedPassword, phone, adminId]
            );

            return result.insertId;
        } catch (error) {
            console.error('❌ Erro ao criar vendedor:', error);
            throw error;
        }
    }

    /**
     * Atualizar vendedor
     */
    async updateSeller(adminId, sellerId, updates) {
        try {
            // Verificar se admin
            const isAdminUser = await this.isAdmin(adminId);
            if (!isAdminUser) {
                throw new Error('Apenas administradores podem atualizar vendedores');
            }

            // Verificar se vendedor pertence ao admin
            const [seller] = await db.query(
                'SELECT id FROM users WHERE id = ? AND parent_user_id = ?',
                [sellerId, adminId]
            );

            if (seller.length === 0) {
                throw new Error('Vendedor não encontrado ou não pertence a este admin');
            }

            const { name, email, phone, is_active } = updates;
            const fields = [];
            const values = [];

            if (name) {
                fields.push('name = ?');
                values.push(name);
            }
            if (email) {
                fields.push('email = ?');
                values.push(email);
            }
            if (phone) {
                fields.push('phone = ?');
                values.push(phone);
            }
            if (is_active !== undefined) {
                fields.push('is_active = ?');
                values.push(is_active);
            }

            if (fields.length === 0) {
                throw new Error('Nenhum campo para atualizar');
            }

            values.push(sellerId);
            await db.query(
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar vendedor:', error);
            throw error;
        }
    }

    /**
     * Deletar vendedor (apenas admin pode)
     */
    async deleteSeller(adminId, sellerId) {
        try {
            // Verificar se admin
            const isAdminUser = await this.isAdmin(adminId);
            if (!isAdminUser) {
                throw new Error('Apenas administradores podem deletar vendedores');
            }

            // Verificar se vendedor pertence ao admin
            const [seller] = await db.query(
                'SELECT id FROM users WHERE id = ? AND parent_user_id = ?',
                [sellerId, adminId]
            );

            if (seller.length === 0) {
                throw new Error('Vendedor não encontrado ou não pertence a este admin');
            }

            // Reatribuir leads do vendedor para o admin
            await db.query(
                'UPDATE crm_leads SET assigned_to = NULL WHERE assigned_to = ?',
                [sellerId]
            );

            // Deletar vendedor
            await db.query('DELETE FROM users WHERE id = ?', [sellerId]);

            return true;
        } catch (error) {
            console.error('❌ Erro ao deletar vendedor:', error);
            throw error;
        }
    }

    /**
     * Verificar se usuário tem permissão para acessar um lead
     */
    async canAccessLead(userId, leadId) {
        try {
            const user = await this.getUserById(userId);
            if (!user) return false;

            // Admin pode acessar tudo
            if (user.role === 'admin') return true;

            // Vendedor só pode acessar leads atribuídos a ele
            const [leads] = await db.query(
                'SELECT id FROM crm_leads WHERE id = ? AND assigned_to = ?',
                [leadId, userId]
            );

            return leads.length > 0;
        } catch (error) {
            console.error('❌ Erro ao verificar acesso ao lead:', error);
            return false;
        }
    }

    /**
     * Obter filtro SQL baseado no role do usuário
     */
    async getLeadAccessFilter(userId) {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                console.log('🔍 getLeadAccessFilter: Usuário não encontrado');
                return { condition: '1 = 0', params: [] }; // Nenhum acesso
            }

            console.log('🔍 getLeadAccessFilter: userId=', userId, 'role=', user.role);

            // Admin vê tudo da conta dele
            if (user.role === 'admin') {
                const filter = { 
                    condition: 'l.user_id = ?', 
                    params: [userId] 
                };
                console.log('🔍 Admin filter:', filter);
                return filter;
            }

            // Vendedor só vê leads atribuídos a ele
            if (user.role === 'seller') {
                // Buscar o admin pai para garantir que só vê leads da conta correta
                const parentAdmin = await this.getParentAdmin(userId);
                const filter = { 
                    condition: 'l.user_id = ? AND l.assigned_to = ?', 
                    params: [parentAdmin.id, userId] 
                };
                console.log('🔍 Seller filter:', filter);
                return filter;
            }

            console.log('🔍 getLeadAccessFilter: Role desconhecido, sem acesso');
            return { condition: '1 = 0', params: [] };
        } catch (error) {
            console.error('❌ Erro ao obter filtro de acesso:', error);
            return { condition: '1 = 0', params: [] };
        }
    }
}

module.exports = new AuthService();
