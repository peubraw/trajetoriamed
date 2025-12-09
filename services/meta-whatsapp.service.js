const axios = require('axios');
const db = require('../config/database');
require('dotenv').config();

/**
 * Meta WhatsApp Business API Service
 * Integração oficial com a API do WhatsApp Business da Meta
 */
class MetaWhatsAppService {
    constructor() {
        this.apiVersion = 'v21.0';
        this.baseURL = `https://graph.facebook.com/${this.apiVersion}`;
        this.phoneNumberId = process.env.META_PHONE_NUMBER_ID;
        this.accessToken = process.env.META_ACCESS_TOKEN;
        this.wabaId = process.env.META_WABA_ID;
        
        // Configuração do axios
        this.api = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📱 Meta WhatsApp API Service inicializado');
        console.log(`   Phone Number ID: ${this.phoneNumberId}`);
        console.log(`   WABA ID: ${this.wabaId}`);
    }

    /**
     * Enviar mensagem de texto simples
     */
    async sendTextMessage(to, text) {
        try {
            const cleanPhone = to.replace(/\D/g, '');
            
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'text',
                text: { body: text }
            };

            const response = await this.api.post(`/${this.phoneNumberId}/messages`, payload);
            
            console.log(`✅ Mensagem enviada via Meta API para ${cleanPhone}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem via Meta API:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Enviar template de mensagem (pré-aprovado pela Meta)
     */
    async sendTemplate(to, templateName, languageCode = 'pt_BR', components = []) {
        try {
            const cleanPhone = to.replace(/\D/g, '');
            
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: languageCode },
                    components: components
                }
            };

            const response = await this.api.post(`/${this.phoneNumberId}/messages`, payload);
            
            console.log(`✅ Template "${templateName}" enviado para ${cleanPhone}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao enviar template:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Enviar mensagem com botões interativos
     */
    async sendInteractiveButtons(to, bodyText, buttons, headerText = null) {
        try {
            const cleanPhone = to.replace(/\D/g, '');
            
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: { text: bodyText },
                    action: {
                        buttons: buttons.map((btn, idx) => ({
                            type: 'reply',
                            reply: {
                                id: btn.id || `btn_${idx}`,
                                title: btn.title.substring(0, 20) // Max 20 caracteres
                            }
                        }))
                    }
                }
            };

            if (headerText) {
                payload.interactive.header = { type: 'text', text: headerText };
            }

            const response = await this.api.post(`/${this.phoneNumberId}/messages`, payload);
            
            console.log(`✅ Botões interativos enviados para ${cleanPhone}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao enviar botões:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Enviar lista interativa
     */
    async sendInteractiveList(to, bodyText, buttonText, sections) {
        try {
            const cleanPhone = to.replace(/\D/g, '');
            
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'interactive',
                interactive: {
                    type: 'list',
                    body: { text: bodyText },
                    action: {
                        button: buttonText,
                        sections: sections
                    }
                }
            };

            const response = await this.api.post(`/${this.phoneNumberId}/messages`, payload);
            
            console.log(`✅ Lista interativa enviada para ${cleanPhone}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao enviar lista:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Enviar mídia (imagem, vídeo, documento, áudio)
     */
    async sendMedia(to, mediaType, mediaUrl, caption = null) {
        try {
            const cleanPhone = to.replace(/\D/g, '');
            
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: mediaType, // image, video, document, audio
                [mediaType]: {
                    link: mediaUrl
                }
            };

            if (caption && (mediaType === 'image' || mediaType === 'video' || mediaType === 'document')) {
                payload[mediaType].caption = caption;
            }

            const response = await this.api.post(`/${this.phoneNumberId}/messages`, payload);
            
            console.log(`✅ Mídia (${mediaType}) enviada para ${cleanPhone}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao enviar mídia:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Marcar mensagem como lida
     */
    async markAsRead(messageId) {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            };

            await this.api.post(`/${this.phoneNumberId}/messages`, payload);
            console.log(`✅ Mensagem ${messageId} marcada como lida`);
        } catch (error) {
            console.error('❌ Erro ao marcar como lida:', error.response?.data || error.message);
        }
    }

    /**
     * Obter informações do perfil do contato
     */
    async getContactProfile(phoneNumber) {
        try {
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            const response = await this.api.get(`/${cleanPhone}/profile`);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao obter perfil:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Listar templates aprovados
     */
    async getTemplates() {
        try {
            const response = await this.api.get(`/${this.wabaId}/message_templates`);
            return response.data.data;
        } catch (error) {
            console.error('❌ Erro ao listar templates:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Processar webhook de mensagem recebida
     */
    async processWebhookMessage(webhookData) {
        try {
            const entry = webhookData.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            if (!value?.messages) {
                console.log('⚠️ Webhook sem mensagens');
                return null;
            }

            const message = value.messages[0];
            const from = message.from;
            const messageId = message.id;
            const timestamp = message.timestamp;

            // Extrair texto da mensagem
            let messageText = '';
            let messageType = message.type;

            switch (messageType) {
                case 'text':
                    messageText = message.text.body;
                    break;
                case 'button':
                    messageText = message.button.text;
                    break;
                case 'interactive':
                    if (message.interactive.type === 'button_reply') {
                        messageText = message.interactive.button_reply.title;
                    } else if (message.interactive.type === 'list_reply') {
                        messageText = message.interactive.list_reply.title;
                    }
                    break;
                default:
                    messageText = `[${messageType}]`;
            }

            // Marcar como lida
            await this.markAsRead(messageId);

            // Retornar dados processados
            return {
                from: from,
                messageId: messageId,
                text: messageText,
                type: messageType,
                timestamp: timestamp,
                profileName: value.contacts?.[0]?.profile?.name || 'Unknown'
            };

        } catch (error) {
            console.error('❌ Erro ao processar webhook:', error);
            return null;
        }
    }

    /**
     * Verificar saúde da API
     */
    async healthCheck() {
        try {
            const response = await this.api.get(`/${this.phoneNumberId}`);
            console.log('✅ Meta API: Saudável');
            return { healthy: true, data: response.data };
        } catch (error) {
            console.error('❌ Meta API: Erro de conexão');
            return { healthy: false, error: error.message };
        }
    }

    /**
     * Obter analytics e métricas
     */
    async getAnalytics(startDate, endDate) {
        try {
            const response = await this.api.get(`/${this.wabaId}/analytics`, {
                params: {
                    start: startDate,
                    end: endDate,
                    granularity: 'daily'
                }
            });
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao obter analytics:', error.response?.data || error.message);
            return null;
        }
    }
}

module.exports = new MetaWhatsAppService();
