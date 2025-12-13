const db = require('../config/database');

class ChatService {
    /**
     * Buscar todas as conversas de um usuário
     */
    async getConversations(userId, filters = {}) {
        try {
            let query = `
                SELECT * FROM vw_conversations_full
                WHERE user_id = ?
            `;
            const params = [userId];

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

            const [conversations] = await db.query(query, params);
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
            // Verificar se já existe
            const [existing] = await db.query(
                'SELECT * FROM crm_conversations WHERE user_id = ? AND phone = ?',
                [userId, phone]
            );

            if (existing.length > 0) {
                return existing[0];
            }

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
    async getMessages(userId, phone, limit = 100, offset = 0) {
        try {
            const [messages] = await db.query(
                `SELECT * FROM vw_chat_messages_full
                WHERE user_id = ? AND phone = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?`,
                [userId, phone, limit, offset]
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
                media_url, media_mimetype, caption, direction, sender_type, sent_by, 
                status, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    userId, leadId, phone, messageId, messageType, messageContent,
                    mediaUrl, mediaMimetype, caption, direction, senderType, sentBy,
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
    async sendMessage(userId, phone, content, sentBy, messageType = 'text', mediaUrl = null) {
        try {
            const whatsappService = require('./whatsapp.service');
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
                direction: 'outbound',
                senderType: 'admin', // ou 'seller' baseado no role
                sentBy,
                status: 'pending'
            });

            // Tentar enviar via API Meta primeiro
            let sent = false;
            try {
                const metaResult = await metaWhatsAppService.sendMessage(phone, content);
                if (metaResult && metaResult.success) {
                    sent = true;
                    // Atualizar status da mensagem
                    await db.query(
                        `UPDATE crm_chat_messages 
                        SET status = 'sent', message_id = ?, delivered_at = NOW()
                        WHERE id = ?`,
                        [metaResult.messageId, savedMessage.id]
                    );
                    savedMessage.status = 'sent';
                    savedMessage.message_id = metaResult.messageId;
                }
            } catch (metaError) {
                console.log('⚠️ Meta API falhou, tentando wppconnect...');
            }

            // Se Meta falhou, tentar wppconnect
            if (!sent) {
                const client = whatsappService.clients.get(userId);
                if (client) {
                    try {
                        const formattedPhone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
                        
                        if (messageType === 'text') {
                            await client.sendText(formattedPhone, content);
                        } else if (messageType === 'image' && mediaUrl) {
                            await client.sendImage(formattedPhone, mediaUrl, 'image', content);
                        }

                        sent = true;
                        await db.query(
                            `UPDATE crm_chat_messages 
                            SET status = 'sent', delivered_at = NOW()
                            WHERE id = ?`,
                            [savedMessage.id]
                        );
                        savedMessage.status = 'sent';
                    } catch (wppError) {
                        console.error('❌ Erro ao enviar via wppconnect:', wppError);
                    }
                }
            }

            // Se tudo falhou
            if (!sent) {
                await db.query(
                    `UPDATE crm_chat_messages 
                    SET status = 'failed', error_message = ?
                    WHERE id = ?`,
                    ['Nenhum serviço de WhatsApp disponível', savedMessage.id]
                );
                savedMessage.status = 'failed';
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
                    const [leadResult] = await db.query(
                        `INSERT INTO crm_leads 
                        (user_id, phone, stage_id, channel, bot_active)
                        VALUES (?, ?, ?, 'whatsapp', TRUE)`,
                        [userId, phone, stageResult[0].id]
                    );
                    leadId = leadResult.insertId;
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
                global.io.to(`user-${userId}`).emit('new-message', savedMessage);
                
                // Notificação de nova mensagem
                global.io.to(`user-${userId}`).emit('new-message-notification', {
                    phone,
                    content: content.substring(0, 100),
                    leadId,
                    timestamp: new Date()
                });
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
