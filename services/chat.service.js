const db = require('../config/database');

class ChatService {
    /**
     * Buscar todas as conversas de um usuário
     */
    async getConversations(userId, filters = {}) {
        try {
            // Verificar se o usuário é admin ou vendedor
            const authService = require('./auth.service');
            const isAdmin = await authService.isAdmin(userId);
            const user = await authService.getUserById(userId);

            let query = `
                SELECT * FROM vw_conversations_full
                WHERE 1=1
            `;
            const params = [];

            // Se for admin, buscar conversas da conta dele
            if (isAdmin) {
                query += ` AND user_id = ?`;
                params.push(userId);
            } 
            // Se for vendedor, buscar conversas da conta do admin pai, mas filtrar por assigned_to
            else {
                // Buscar conversas da conta do admin (parent_user_id ou user_id 1)
                const adminUserId = user.parent_user_id || 1;
                query += ` AND user_id = ? AND assigned_to = ?`;
                params.push(adminUserId, userId);
            }

            // Filtros opcionais
            if (filters.status) {
                query += ` AND status = ?`;
                params.push(filters.status);
            }

            if (filters.assignedTo) {
                query += ` AND assigned_to = ?`;
                params.push(filters.assignedTo);
            }

            if (filters.search) {
                query += ` AND (contact_name LIKE ? OR phone LIKE ?)`;
                params.push(`%${filters.search}%`, `%${filters.search}%`);
            }

            query += ` ORDER BY last_message_at DESC`;

            console.log('🔍 Query conversas:', { query, params, isAdmin, userId });

            const [conversations] = await db.query(query, params);
            console.log(`📋 Conversas encontradas: ${conversations.length}`);
            return conversations;
        } catch (error) {
            console.error('❌ Erro ao buscar conversas:', error);
            throw error;
        }
    }

    /**
     * Buscar ou criar uma conversa
     */
    async getOrCreateConversation(userId, phone, leadId = null) {
        try {
            // Buscar informações do lead se existir
            let contactName = null;
            let assignedTo = null;

            if (leadId) {
                const [lead] = await db.query(
                    'SELECT name, assigned_to FROM crm_leads WHERE id = ?',
                    [leadId]
                );
                if (lead.length > 0) {
                    contactName = lead[0].name;
                    assignedTo = lead[0].assigned_to;
                }
            } else {
                // Tentar buscar lead pelo telefone
                const [leads] = await db.query(
                    'SELECT id, name, assigned_to FROM crm_leads WHERE user_id = ? AND phone = ?',
                    [userId, phone]
                );
                if (leads.length > 0) {
                    leadId = leads[0].id;
                    contactName = leads[0].name;
                    assignedTo = leads[0].assigned_to;
                }
            }

            // Verificar se já existe
            const [existing] = await db.query(
                'SELECT * FROM crm_conversations WHERE user_id = ? AND phone = ?',
                [userId, phone]
            );

            if (existing.length > 0) {
                // Sincronizar assigned_to com o lead
                if (assignedTo !== existing[0].assigned_to || contactName !== existing[0].contact_name) {
                    await db.query(
                        `UPDATE crm_conversations 
                         SET assigned_to = ?, contact_name = ?, lead_id = ?
                         WHERE id = ?`,
                        [assignedTo, contactName, leadId, existing[0].id]
                    );
                    console.log(`📋 Conversa ${existing[0].id} sincronizada: assigned_to=${assignedTo}, lead_id=${leadId}`);
                }
                
                // Retornar conversa atualizada
                const [updated] = await db.query(
                    'SELECT * FROM crm_conversations WHERE id = ?',
                    [existing[0].id]
                );
                return updated[0];
            }

            // Criar nova conversa
            const [result] = await db.query(
                `INSERT INTO crm_conversations 
                (user_id, phone, lead_id, contact_name, assigned_to, status)
                VALUES (?, ?, ?, ?, ?, 'active')`,
                [userId, phone, leadId, contactName, assignedTo]
            );

            const [newConversation] = await db.query(
                'SELECT * FROM crm_conversations WHERE id = ?',
                [result.insertId]
            );

            return newConversation[0];
        } catch (error) {
            console.error('❌ Erro ao buscar/criar conversa:', error);
            throw error;
        }
    }

    /**
     * Buscar mensagens de uma conversa
     */
    async getMessages(userId, phone, limit = 500, offset = 0) {
        try {
            // Verificar se o usuário é admin ou vendedor
            const authService = require('./auth.service');
            const isAdmin = await authService.isAdmin(userId);
            const user = await authService.getUserById(userId);

            let queryUserId = userId;
            
            // Verificar permissão: admin vê tudo, vendedor só vê seus leads
            if (!isAdmin) {
                // Buscar no contexto do admin pai
                const adminUserId = user.parent_user_id || 1;
                queryUserId = adminUserId;

                // Verificar se o lead está atribuído ao vendedor
                const [leads] = await db.query(
                    `SELECT id FROM crm_leads 
                     WHERE user_id = ? AND phone = ? 
                     AND assigned_to = ?`,
                    [adminUserId, phone, userId]
                );

                if (leads.length === 0) {
                    // Verificar se existe uma conversa atribuída a ele
                    const [convs] = await db.query(
                        `SELECT id FROM crm_conversations 
                         WHERE user_id = ? AND phone = ? 
                         AND assigned_to = ?`,
                        [adminUserId, phone, userId]
                    );

                    if (convs.length === 0) {
                        throw new Error('Você não tem permissão para acessar esta conversa');
                    }
                }
            }

            const [messages] = await db.query(
                `SELECT * FROM vw_chat_messages_full
                WHERE phone = ? 
                AND (user_id = ? OR sent_by = ?)
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?`,
                [phone, queryUserId, userId, limit, offset]
            );

            return messages.reverse(); // Retornar em ordem cronológica
        } catch (error) {
            console.error('❌ Erro ao buscar mensagens:', error);
            throw error;
        }
    }

    /**
     * Salvar mensagem no banco
     */
    async saveMessage(messageData) {
        try {
            const {
                userId,
                leadId = null,
                phone,
                messageId = null,
                messageType = 'text',
                messageContent,
                mediaUrl = null,
                mediaMimetype = null,
                fileName = null,
                caption = null,
                direction,
                senderType,
                sentBy = null,
                status = 'sent',
                metadata = null
            } = messageData;

            const [result] = await db.query(
                `INSERT INTO crm_chat_messages 
                (user_id, lead_id, phone, message_id, message_type, message_content, 
                media_url, media_mimetype, file_name, caption, direction, sender_type, sent_by, 
                status, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    userId, leadId, phone, messageId, messageType, messageContent,
                    mediaUrl, mediaMimetype, fileName, caption, direction, senderType, sentBy,
                    status, metadata ? JSON.stringify(metadata) : null
                ]
            );

            // Atualizar conversa
            await this.updateConversationLastMessage(userId, phone, messageContent, direction);

            // Incrementar contador de mensagens não lidas (se for entrada)
            if (direction === 'inbound') {
                await db.query(
                    `UPDATE crm_conversations 
                    SET unread_count = unread_count + 1
                    WHERE user_id = ? AND phone = ?`,
                    [userId, phone]
                );
            }

            const [message] = await db.query(
                'SELECT * FROM vw_chat_messages_full WHERE id = ?',
                [result.insertId]
            );

            return message[0];
        } catch (error) {
            console.error('❌ Erro ao salvar mensagem:', error);
            throw error;
        }
    }

    /**
     * Enviar mensagem via WhatsApp
     */
    async sendMessage(userId, phone, content, sentBy, messageType = 'text', mediaUrl = null, mediaMimetype = null, fileName = null) {
        try {
            const metaWhatsAppService = require('./meta-whatsapp.service');

            // Buscar ou criar conversa
            const [leads] = await db.query(
                'SELECT id FROM crm_leads WHERE user_id = ? AND phone = ?',
                [userId, phone]
            );
            const leadId = leads.length > 0 ? leads[0].id : null;

            await this.getOrCreateConversation(userId, phone, leadId);

            // Salvar mensagem como pendente
            const savedMessage = await this.saveMessage({
                userId,
                leadId,
                phone,
                messageType,
                messageContent: content,
                mediaUrl,
                mediaMimetype,
                fileName,
                direction: 'outbound',
                senderType: 'admin', // ou 'seller' baseado no role
                sentBy,
                status: 'pending'
            });

            // Tentar enviar via API Meta
            let sent = false;
            try {
                let metaResult;
                
                // Enviar baseado no tipo de mensagem
                if (messageType === 'text' || !mediaUrl) {
                    metaResult = await metaWhatsAppService.sendTextMessage(phone, content);
                } else {
                    // Enviar mídia via Meta API
                    metaResult = await metaWhatsAppService.sendMedia(phone, messageType, mediaUrl, content);
                }
                
                if (metaResult && metaResult.messages) {
                    sent = true;
                    const messageId = metaResult.messages[0].id;
                    // Atualizar status da mensagem
                    await db.query(
                        `UPDATE crm_chat_messages 
                        SET status = 'sent', message_id = ?, delivered_at = NOW()
                        WHERE id = ?`,
                        [messageId, savedMessage.id]
                    );
                    savedMessage.status = 'sent';
                    savedMessage.message_id = messageId;
                    console.log(`✅ Mensagem enviada via Meta API: ${messageId}`);
                }
            } catch (metaError) {
                console.error('❌ Erro Meta API:', metaError.response?.data || metaError.message);
                // Marcar como falha
                await db.query(
                    `UPDATE crm_chat_messages 
                    SET status = 'failed', error_message = ?
                    WHERE id = ?`,
                    [metaError.message || 'Erro ao enviar via Meta API', savedMessage.id]
                );
                savedMessage.status = 'failed';
                throw metaError;
            }

            // Emitir via Socket.IO
            if (global.io) {
                global.io.to(`user-${userId}`).emit('new-message', savedMessage);
            }

            return savedMessage;
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    /**
     * Processar mensagem recebida (webhook)
     */
    async processIncomingMessage(userId, phone, messageData) {
        try {
            const {
                messageId,
                type = 'text',
                content,
                mediaUrl = null,
                mediaMimetype = null,
                caption = null,
                metadata = null
            } = messageData;

            // Buscar ou criar lead
            let [leads] = await db.query(
                'SELECT id FROM crm_leads WHERE user_id = ? AND phone = ?',
                [userId, phone]
            );

            let leadId = null;
            if (leads.length === 0) {
                // Criar lead automaticamente
                const [stageResult] = await db.query(
                    'SELECT id FROM crm_stages WHERE user_id = ? ORDER BY position LIMIT 1',
                    [userId]
                );

                if (stageResult.length > 0) {
                    // Buscar vendedor com menos leads atribuídos (distribuição equitativa)
                    const [sellers] = await db.query(
                        `SELECT u.id, COUNT(l.id) as lead_count
                         FROM users u
                         LEFT JOIN crm_leads l ON l.assigned_to = u.id AND l.user_id = ?
                         WHERE u.role = 'seller' AND u.parent_user_id = ?
                         GROUP BY u.id
                         ORDER BY lead_count ASC
                         LIMIT 1`,
                        [userId, userId]
                    );

                    const assignedTo = sellers.length > 0 ? sellers[0].id : null;

                    const [leadResult] = await db.query(
                        `INSERT INTO crm_leads 
                        (user_id, phone, stage_id, channel, bot_active, assigned_to)
                        VALUES (?, ?, ?, 'whatsapp', TRUE, ?)`,
                        [userId, phone, stageResult[0].id, assignedTo]
                    );
                    leadId = leadResult.insertId;

                    if (assignedTo) {
                        console.log(`📋 Novo lead atribuído automaticamente ao vendedor ID ${assignedTo}`);
                    }
                }
            } else {
                leadId = leads[0].id;
            }

            // Buscar ou criar conversa
            await this.getOrCreateConversation(userId, phone, leadId);

            // Salvar mensagem
            const savedMessage = await this.saveMessage({
                userId,
                leadId,
                phone,
                messageId,
                messageType: type,
                messageContent: content,
                mediaUrl,
                mediaMimetype,
                caption,
                direction: 'inbound',
                senderType: 'lead',
                status: 'delivered',
                metadata
            });

            // Emitir via Socket.IO para usuários online
            if (global.io) {
                // Emitir para o admin/parent
                global.io.to(`user-${userId}`).emit('new-message', savedMessage);
                
                // Se a conversa tem assigned_to, emitir também para o vendedor
                const [conv] = await db.query(
                    'SELECT assigned_to FROM crm_conversations WHERE user_id = ? AND phone = ?',
                    [userId, phone]
                );
                
                if (conv.length > 0 && conv[0].assigned_to) {
                    global.io.to(`user-${conv[0].assigned_to}`).emit('new-message', savedMessage);
                    console.log(`📤 Mensagem emitida para vendedor ID ${conv[0].assigned_to}`);
                }
                
                // Notificação de nova mensagem
                global.io.to(`user-${userId}`).emit('new-message-notification', {
                    phone,
                    content: content.substring(0, 100),
                    leadId,
                    timestamp: new Date()
                });
                
                if (conv.length > 0 && conv[0].assigned_to) {
                    global.io.to(`user-${conv[0].assigned_to}`).emit('new-message-notification', {
                        phone,
                        content: content.substring(0, 100),
                        leadId,
                        timestamp: new Date()
                    });
                }
            }

            return savedMessage;
        } catch (error) {
            console.error('❌ Erro ao processar mensagem recebida:', error);
            throw error;
        }
    }

    /**
     * Marcar mensagens como lidas
     */
    async markAsRead(userId, phone) {
        try {
            await db.query(
                `UPDATE crm_chat_messages 
                SET is_read = TRUE, read_at = NOW()
                WHERE user_id = ? AND phone = ? AND direction = 'inbound' AND is_read = FALSE`,
                [userId, phone]
            );

            await db.query(
                `UPDATE crm_conversations 
                SET unread_count = 0
                WHERE user_id = ? AND phone = ?`,
                [userId, phone]
            );

            // Emitir via Socket.IO
            if (global.io) {
                global.io.to(`user-${userId}`).emit('messages-read', { phone });
            }

            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao marcar como lido:', error);
            throw error;
        }
    }

    /**
     * Atualizar última mensagem da conversa
     */
    async updateConversationLastMessage(userId, phone, content, direction) {
        try {
            await db.query(
                `UPDATE crm_conversations 
                SET last_message_content = ?, 
                    last_message_at = NOW(), 
                    last_message_direction = ?,
                    total_messages = total_messages + 1
                WHERE user_id = ? AND phone = ?`,
                [content, direction, userId, phone]
            );
        } catch (error) {
            console.error('❌ Erro ao atualizar última mensagem:', error);
        }
    }

    /**
     * Atualizar indicador de digitação
     */
    async updateTypingIndicator(conversationId, userId, phone, isTyping) {
        try {
            if (isTyping) {
                await db.query(
                    `INSERT INTO crm_chat_typing (conversation_id, user_id, phone, is_typing)
                    VALUES (?, ?, ?, TRUE)
                    ON DUPLICATE KEY UPDATE is_typing = TRUE, started_at = NOW()`,
                    [conversationId, userId, phone]
                );
            } else {
                await db.query(
                    'DELETE FROM crm_chat_typing WHERE conversation_id = ? AND user_id = ?',
                    [conversationId, userId]
                );
            }

            // Emitir via Socket.IO
            if (global.io) {
                global.io.to(`conversation-${conversationId}`).emit('typing', {
                    userId,
                    isTyping
                });
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar indicador de digitação:', error);
        }
    }

    /**
     * Arquivar conversa
     */
    async archiveConversation(userId, phone) {
        try {
            await db.query(
                `UPDATE crm_conversations 
                SET status = 'archived', archived_at = NOW()
                WHERE user_id = ? AND phone = ?`,
                [userId, phone]
            );

            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao arquivar conversa:', error);
            throw error;
        }
    }

    /**
     * Buscar estatísticas de chat
     */
    async getChatStats(userId) {
        try {
            const [stats] = await db.query(
                `SELECT 
                    COUNT(*) as total_conversations,
                    SUM(unread_count) as total_unread,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_conversations,
                    SUM(total_messages) as total_messages_all
                FROM crm_conversations
                WHERE user_id = ?`,
                [userId]
            );

            return stats[0] || {
                total_conversations: 0,
                total_unread: 0,
                active_conversations: 0,
                total_messages_all: 0
            };
        } catch (error) {
            console.error('❌ Erro ao buscar estatísticas:', error);
            throw error;
        }
    }
}

module.exports = new ChatService();
