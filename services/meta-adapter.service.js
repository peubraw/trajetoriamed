/**
 * Adaptador para usar Meta WhatsApp API no lugar do wppconnect
 * Mantém compatibilidade com o código existente do chatbot-flow.service
 */

const metaWhatsAppService = require('./meta-whatsapp.service');

class MetaWhatsAppAdapter {
    constructor(userId) {
        this.userId = userId;
        this.isMetaAPI = true;
    }

    /**
     * Enviar mensagem de texto
     * Compatível com: client.sendText(to, message)
     */
    async sendText(to, message) {
        try {
            // Remover @c.us se existir
            const cleanPhone = to.replace('@c.us', '').replace(/\D/g, '');
            
            const result = await metaWhatsAppService.sendTextMessage(cleanPhone, message);
            
            return {
                id: result.messages[0].id,
                ack: 1,
                from: `${cleanPhone}@c.us`,
                to: `${cleanPhone}@c.us`,
                body: message,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('❌ Erro no adaptador sendText:', error);
            throw error;
        }
    }

    /**
     * Enviar imagem
     * Compatível com: client.sendImage(to, url, filename, caption)
     */
    async sendImage(to, imageUrl, filename = 'image.jpg', caption = '') {
        try {
            const cleanPhone = to.replace('@c.us', '').replace(/\D/g, '');
            const result = await metaWhatsAppService.sendMedia(cleanPhone, 'image', imageUrl, caption);
            
            return {
                id: result.messages[0].id,
                ack: 1
            };
        } catch (error) {
            console.error('❌ Erro no adaptador sendImage:', error);
            throw error;
        }
    }

    /**
     * Enviar arquivo/documento
     * Compatível com: client.sendFile(to, url, filename, caption)
     */
    async sendFile(to, fileUrl, filename = 'document.pdf', caption = '') {
        try {
            const cleanPhone = to.replace('@c.us', '').replace(/\D/g, '');
            const result = await metaWhatsAppService.sendMedia(cleanPhone, 'document', fileUrl, caption);
            
            return {
                id: result.messages[0].id,
                ack: 1
            };
        } catch (error) {
            console.error('❌ Erro no adaptador sendFile:', error);
            throw error;
        }
    }

    /**
     * Enviar botões (usando botões interativos da Meta)
     * Compatível com o fluxo de botões do chatbot
     */
    async sendButtons(to, bodyText, buttons) {
        try {
            const cleanPhone = to.replace('@c.us', '').replace(/\D/g, '');
            
            // Converter formato de botões para Meta API
            const metaButtons = buttons.map((btn, idx) => ({
                id: `btn_${idx}`,
                title: btn.buttonText || btn.title || btn
            }));

            const result = await metaWhatsAppService.sendInteractiveButtons(
                cleanPhone,
                bodyText,
                metaButtons
            );
            
            return {
                id: result.messages[0].id,
                ack: 1
            };
        } catch (error) {
            console.error('❌ Erro no adaptador sendButtons:', error);
            // Fallback para mensagem de texto se botões falharem
            return this.sendText(to, bodyText + '\n\n' + buttons.map((b, i) => `${i+1}. ${b.buttonText || b}`).join('\n'));
        }
    }

    /**
     * Enviar lista (usando lista interativa da Meta)
     */
    async sendList(to, bodyText, buttonText, sections) {
        try {
            const cleanPhone = to.replace('@c.us', '').replace(/\D/g, '');
            
            const result = await metaWhatsAppService.sendInteractiveList(
                cleanPhone,
                bodyText,
                buttonText,
                sections
            );
            
            return {
                id: result.messages[0].id,
                ack: 1
            };
        } catch (error) {
            console.error('❌ Erro no adaptador sendList:', error);
            // Fallback para mensagem de texto
            return this.sendText(to, bodyText);
        }
    }

    /**
     * Obter informações do dispositivo (simulado para compatibilidade)
     */
    async getHostDevice() {
        return {
            id: { user: process.env.META_PHONE_NUMBER_ID },
            _serialized: process.env.META_PHONE_NUMBER_ID
        };
    }

    /**
     * Verificar se está conectado
     */
    async getConnectionState() {
        const health = await metaWhatsAppService.healthCheck();
        return health.healthy ? 'CONNECTED' : 'DISCONNECTED';
    }

    /**
     * Listener de mensagens (não usado na Meta API - usa webhook)
     */
    onMessage(callback) {
        console.log('⚠️ onMessage não é usado na Meta API - mensagens vêm via webhook');
        // Armazenar callback se necessário no futuro
        this.messageCallback = callback;
    }

    /**
     * Listener de ACK (não usado na Meta API)
     */
    onAck(callback) {
        console.log('⚠️ onAck não é usado na Meta API');
        this.ackCallback = callback;
    }
}

/**
 * Factory para criar cliente Meta ou wppconnect
 */
function createWhatsAppClient(userId, useMetaAPI = true) {
    if (useMetaAPI) {
        console.log(`📱 Criando cliente Meta API para userId ${userId}`);
        return new MetaWhatsAppAdapter(userId);
    } else {
        console.log(`📱 Usando wppconnect para userId ${userId}`);
        // Retornar cliente wppconnect existente
        const whatsappService = require('./whatsapp.service');
        return whatsappService.getClient(userId);
    }
}

module.exports = {
    MetaWhatsAppAdapter,
    createWhatsAppClient
};
