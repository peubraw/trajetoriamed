const axios = require('axios');
const db = require('../config/database');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
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
     * Formatar texto para WhatsApp (converter Markdown para formato WhatsApp)
     */
    formatWhatsAppText(text) {
        if (!text) return text;
        
        // WhatsApp Cloud API suporta:
        // *texto* para negrito
        // _texto_ para itálico
        // ~texto~ para tachado
        // ```texto``` para monoespaçado
        
        let formatted = text;
        
        // Converter **texto** (Markdown) para *texto* (WhatsApp)
        formatted = formatted.replace(/\*\*([^\*]+)\*\*/g, '*$1*');
        
        // Converter __texto__ (Markdown) para _texto_ (WhatsApp)
        formatted = formatted.replace(/__([^_]+)__/g, '_$1_');
        
        // Garantir quebras de linha adequadas
        // Substituir múltiplas quebras de linha por apenas uma
        formatted = formatted.replace(/\n{3,}/g, '\n\n');
        
        return formatted;
    }

    /**
     * Enviar mensagem de texto simples
     */
    async sendTextMessage(to, text) {
        try {
            const cleanPhone = to.replace(/\D/g, '');
            const formattedText = this.formatWhatsAppText(text);
            
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'text',
                text: { body: formattedText }
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
    /**
     * Upload de mídia para Meta API
     * Retorna o media_id que pode ser usado para enviar mensagens
     */
    async uploadMedia(filePath, mimeType) {
        try {
            const fileStream = fs.createReadStream(filePath);
            const fileName = path.basename(filePath);

            const formData = new FormData();
            formData.append('file', fileStream, {
                filename: fileName,
                contentType: mimeType
            });
            formData.append('messaging_product', 'whatsapp');

            const response = await axios.post(
                `${this.baseURL}/${this.phoneNumberId}/media`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        ...formData.getHeaders()
                    }
                }
            );

            console.log(`✅ Upload de mídia concluído: ${response.data.id}`);
            return response.data.id; // Retorna o media_id
        } catch (error) {
            console.error('❌ Erro ao fazer upload de mídia:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Enviar mídia via WhatsApp
     * Aceita tanto URL pública quanto caminho local de arquivo
     */
    async sendMedia(to, mediaType, mediaUrl, caption = null) {
        try {
            const cleanPhone = to.replace(/\D/g, '');
            
            let mediaId = null;
            
            // Se for um caminho local (começa com /uploads/), fazer upload primeiro
            if (mediaUrl.startsWith('/uploads/')) {
                const filePath = path.join(__dirname, '../public', mediaUrl);
                
                // Determinar MIME type
                const ext = path.extname(filePath).toLowerCase();
                const mimeTypes = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp',
                    '.mp4': 'video/mp4',
                    '.mp3': 'audio/mpeg',
                    '.ogg': 'audio/ogg',
                    '.pdf': 'application/pdf',
                    '.doc': 'application/msword',
                    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                };
                
                const mimeType = mimeTypes[ext] || 'application/octet-stream';
                
                // Upload para Meta API
                mediaId = await this.uploadMedia(filePath, mimeType);
            }
            
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: mediaType
            };

            // Usar ID se foi feito upload, senão usar link direto
            if (mediaId) {
                payload[mediaType] = { id: mediaId };
            } else {
                payload[mediaType] = { link: mediaUrl };
            }

            // Adicionar caption se aplicável
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
    /**
     * Download de mídia da Meta API
     */
    async downloadMedia(mediaId) {
        try {
            // 1. Obter URL da mídia
            const mediaInfo = await this.api.get(`/${mediaId}`);
            const mediaUrl = mediaInfo.data.url;
            const mimeType = mediaInfo.data.mime_type;

            // 2. Download da mídia
            const mediaResponse = await axios.get(mediaUrl, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                responseType: 'arraybuffer'
            });

            // 3. Salvar arquivo localmente
            const ext = this.getFileExtension(mimeType);
            const timestamp = Date.now();
            const fileName = `${timestamp}-${mediaId}${ext}`;
            const uploadsDir = path.join(__dirname, '../public/uploads');
            const filePath = path.join(uploadsDir, fileName);

            // Criar diretório se não existir
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Salvar arquivo
            fs.writeFileSync(filePath, mediaResponse.data);
            console.log(`✅ Mídia salva localmente: ${fileName}`);

            return {
                data: mediaResponse.data,
                mimeType: mimeType,
                url: `/uploads/${fileName}`,
                fileName: fileName
            };
        } catch (error) {
            console.error('❌ Erro ao fazer download de mídia:', error.response?.data || error.message);
            return null;
        }
    }

    getFileExtension(mimeType) {
        const extensions = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'video/mp4': '.mp4',
            'audio/ogg': '.ogg',
            'audio/mpeg': '.mp3',
            'audio/mp4': '.m4a',
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
        };
        return extensions[mimeType] || '.bin';
    }

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

            // Extrair conteúdo da mensagem
            let messageText = '';
            let messageType = message.type;
            let mediaUrl = null;
            let mediaMimetype = null;
            let caption = null;
            let fileName = null;

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

                case 'image':
                    const imageId = message.image.id;
                    caption = message.image.caption || '';
                    messageText = caption || '📷 Imagem';
                    const imageMedia = await this.downloadMedia(imageId);
                    if (imageMedia) {
                        mediaUrl = imageMedia.url;
                        mediaMimetype = imageMedia.mimeType;
                    }
                    break;

                case 'audio':
                    const audioId = message.audio.id;
                    messageText = '🎤 Áudio';
                    const audioMedia = await this.downloadMedia(audioId);
                    if (audioMedia) {
                        mediaUrl = audioMedia.url;
                        mediaMimetype = audioMedia.mimeType;
                    }
                    break;

                case 'video':
                    const videoId = message.video.id;
                    caption = message.video.caption || '';
                    messageText = caption || '🎥 Vídeo';
                    const videoMedia = await this.downloadMedia(videoId);
                    if (videoMedia) {
                        mediaUrl = videoMedia.url;
                        mediaMimetype = videoMedia.mimeType;
                    }
                    break;

                case 'document':
                    const docId = message.document.id;
                    fileName = message.document.filename || 'documento';
                    caption = message.document.caption || '';
                    messageText = `📄 ${fileName}`;
                    const docMedia = await this.downloadMedia(docId);
                    if (docMedia) {
                        mediaUrl = docMedia.url;
                        mediaMimetype = docMedia.mimeType;
                    }
                    break;

                case 'sticker':
                    messageText = '🎨 Figurinha';
                    const stickerId = message.sticker.id;
                    const stickerMedia = await this.downloadMedia(stickerId);
                    if (stickerMedia) {
                        mediaUrl = stickerMedia.url;
                        mediaMimetype = stickerMedia.mimeType;
                    }
                    break;

                case 'location':
                    const location = message.location;
                    messageText = `📍 Localização: ${location.latitude}, ${location.longitude}`;
                    break;

                case 'contacts':
                    const contacts = message.contacts;
                    messageText = `👤 Contato: ${contacts[0]?.name?.formatted_name || 'Contato'}`;
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
                profileName: value.contacts?.[0]?.profile?.name || 'Unknown',
                mediaUrl: mediaUrl,
                mediaMimetype: mediaMimetype,
                caption: caption,
                fileName: fileName
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
