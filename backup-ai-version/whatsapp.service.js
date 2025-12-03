const wppconnect = require('@wppconnect-team/wppconnect');
const db = require('../config/database');
const openRouterService = require('./openrouter.service');

class WhatsAppService {
    constructor() {
        this.clients = new Map();
        this.conversationHistory = new Map(); // Usado apenas para pausas
        this.configCache = new Map(); // Cache de configurações
        this.cacheExpiry = 60 * 1000; // 1 minuto (máxima atualização)
    }

    // Limpar cache de configuração (chamado quando config é atualizada)
    clearConfigCache(userId) {
        this.configCache.delete(userId);
        console.log(`🗑️ Cache de configuração limpo para usuário ${userId}`);
    }

    async createSession(userId, sessionName) {
        try {
            // Se já existe um cliente, retornar ele
            const existingClient = this.clients.get(userId);
            if (existingClient) {
                console.log(`Cliente já existe para userId ${userId}`);
                return existingClient;
            }

            const client = await wppconnect.create({
                session: sessionName,
                catchQR: (base64Qr, asciiQR, attempts) => {
                    console.log(`QR Code gerado para sessão ${sessionName}`);
                    this.saveQRCode(userId, base64Qr);
                },
                statusFind: (statusSession, session) => {
                    console.log(`Status da sessão ${session}: ${statusSession}`);
                    this.updateSessionStatus(userId, statusSession);
                },
                headless: true,
                devtools: false,
                useChrome: true,
                debug: false,
                logQR: false,
                disableWelcome: true,
                updatesLog: false,
                autoClose: 300000,
                folderNameToken: 'tokens',
                puppeteerOptions: {
                    executablePath: '/root/.cache/puppeteer/chrome/linux-142.0.7444.175/chrome-linux64/chrome',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
                }
            });

            this.clients.set(userId, client);

            // Listener para mensagens recebidas
            client.onMessage(async (message) => {
                await this.handleIncomingMessage(userId, message);
            });

            // Atualizar status para conectado
            const phoneNumber = await client.getHostDevice();
            const phoneNumberStr = phoneNumber?.id?.user || phoneNumber?._serialized || null;
            await db.execute(
                'UPDATE whatsapp_sessions SET status = ?, phone_number = ? WHERE user_id = ?',
                ['connected', phoneNumberStr, userId]
            );

            return client;
        } catch (error) {
            console.error('Erro ao criar sessão WhatsApp:', error);
            throw error;
        }
    }

    async saveQRCode(userId, qrCode) {
        try {
            await db.execute(
                'UPDATE whatsapp_sessions SET qr_code = ?, status = ? WHERE user_id = ?',
                [qrCode, 'qrcode', userId]
            );
        } catch (error) {
            console.error('Erro ao salvar QR Code:', error);
        }
    }

    async updateSessionStatus(userId, status) {
        try {
            let dbStatus = 'disconnected';
            if (status === 'isLogged' || status === 'qrReadSuccess') {
                dbStatus = 'connected';
            } else if (status === 'inChat') {
                dbStatus = 'connecting';
            }

            await db.execute(
                'UPDATE whatsapp_sessions SET status = ? WHERE user_id = ?',
                [dbStatus, userId]
            );
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    }

    async handleIncomingMessage(userId, message) {
        try {
            // Ignorar mensagens enviadas pelo próprio bot
            if (message.isGroupMsg || message.from === 'status@broadcast') {
                return;
            }

            const client = this.clients.get(userId);
            if (!client) return;

            // Verificar se o bot está pausado para este contato
            const pauseKey = `pause-${message.from}`;
            if (this.conversationHistory.get(pauseKey)) {
                console.log(`⏸️ Bot pausado para ${message.from} - aguardando intervenção humana`);
                return;
            }

            // Buscar configuração do bot (com cache)
            let config = this.configCache.get(userId);
            const now = Date.now();
            
            if (!config || now - config.timestamp > this.cacheExpiry) {
                const [configs] = await db.execute(
                    'SELECT * FROM bot_configs WHERE user_id = ? AND is_active = TRUE',
                    [userId]
                );

                if (configs.length === 0) {
                    console.log('Nenhuma configuração ativa encontrada');
                    return;
                }

                config = { data: configs[0], timestamp: now };
                this.configCache.set(userId, config);
            }

            const botConfig = config.data;

            // Criar chave única para histórico (userId-phoneNumber)
            const historyKey = `${userId}-${message.from}`;
            
            // Obter histórico mínimo (últimas 2 interações = 4 mensagens)
            let history = this.conversationHistory.get(historyKey) || [];
            
            // Processar mensagem com IA incluindo histórico
            const aiResponse = await openRouterService.processMessage(
                botConfig.system_prompt,
                message.body,
                history
            );

            // Atualizar histórico
            history.push({ role: 'user', content: message.body });
            history.push({ role: 'assistant', content: aiResponse });
            
            // Manter apenas últimas 2 interações (4 mensagens) - equilíbrio velocidade/contexto
            if (history.length > 4) {
                history = history.slice(-4);
            }
            
            this.conversationHistory.set(historyKey, history);

            // Enviar resposta
            await client.sendText(message.from, aiResponse);

            // Detectar se enviou link de pagamento e pausar bot (não aguardar - async)
            this.checkPaymentLinkAndPause(client, message, aiResponse, userId).catch(err => 
                console.error('Erro ao verificar link de pagamento:', err)
            );

            // Salvar no banco de dados (não aguardar - async)
            db.execute(
                'INSERT INTO messages (user_id, sender, message, response) VALUES (?, ?, ?, ?)',
                [userId, message.from || 'unknown', message.body || '', aiResponse || '']
            ).catch(err => console.error('Erro ao salvar mensagem:', err));

            // Atualizar estatísticas (não aguardar - async)
            this.updateStatistics(userId).catch(err => 
                console.error('Erro ao atualizar estatísticas:', err)
            );

        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    }

    async checkPaymentLinkAndPause(client, message, aiResponse, userId) {
        try {
            // Detectar se o bot enviou link de pagamento
            const paymentLinkPatterns = [
                'pay.kiwify.com.br',
                'hotmart.com',
                'eduzz.com',
                'pagseguro.uol.com.br',
                'mercadopago.com'
            ];

            const sentPaymentLink = paymentLinkPatterns.some(pattern => 
                aiResponse.includes(pattern)
            );

            // Detectar se é ex-aluno (bot finalizou o atendimento)
            const isExStudent = aiResponse.includes('Obrigado pelas informações') && 
                               (aiResponse.includes('😊') || aiResponse.toLowerCase().includes('ex-aluno'));

            if (sentPaymentLink || isExStudent) {
                console.log('💳 Link de pagamento detectado na resposta!');

                // Buscar vendedores do banco de dados
                const [configs] = await db.execute(
                    `SELECT vendor1_name, vendor1_phone, vendor2_name, vendor2_phone,
                            vendor3_name, vendor3_phone, vendor4_name, vendor4_phone
                     FROM bot_configs WHERE user_id = ?`,
                    [userId]
                );

                let vendors = [];
                if (configs.length > 0) {
                    const config = configs[0];
                    vendors = [
                        { name: config.vendor1_name, phone: config.vendor1_phone },
                        { name: config.vendor2_name, phone: config.vendor2_phone },
                        { name: config.vendor3_name, phone: config.vendor3_phone },
                        { name: config.vendor4_name, phone: config.vendor4_phone }
                    ].filter(v => v.phone && v.phone.trim() !== '');
                }

                // Se não encontrou no banco, usar valores padrão
                if (vendors.length === 0) {
                    vendors = [
                        { name: 'Nathalia', phone: '5531971102701' },
                        { name: 'Vitória', phone: '5531985757508' },
                        { name: 'João', phone: '5531973088916' },
                        { name: 'Leandro', phone: '553187369717' }
                    ];
                }

                // Extrair nome do contato
                const contactName = message.sender.pushname || message.from;
                const contactPhone = message.from.replace('@c.us', '');

                // Mensagem de notificação
                const notificationType = isExStudent ? 'EX-ALUNO IDENTIFICADO' : 'LINK DE PAGAMENTO ENVIADO';
                const notificationIcon = isExStudent ? '🎓' : '💳';
                const notificationMessage = `${notificationIcon} *${notificationType}*\n\n` +
                    `👤 *Cliente:* ${contactName}\n` +
                    `📱 *Telefone:* ${contactPhone}\n` +
                    `💬 *Última mensagem:* ${message.body}\n\n` +
                    (isExStudent ? `🎓 Cliente confirmou ser EX-ALUNO\n⚠️ Bot desligado - Vendedor precisa assumir o atendimento.` : `✅ Link enviado com sucesso!\n⚠️ Bot pausado - Vendedor precisa acompanhar o pagamento.`) +
                    `\n\nPara despausar: /despausar ${contactPhone}`;

                // Enviar notificação para todos os vendedores (em paralelo)
                const notificationPromises = vendors.map(vendor => 
                    client.sendText(`${vendor.phone}@c.us`, notificationMessage)
                        .then(() => console.log(`✅ Notificação enviada para ${vendor.name} (${vendor.phone})`))
                        .catch(error => console.error(`❌ Erro ao notificar ${vendor.name}:`, error.message))
                );

                await Promise.all(notificationPromises);

                // Pausar o bot para este contato
                this.conversationHistory.set(`pause-${message.from}`, true);
                console.log(`⏸️ Bot pausado para o contato ${contactPhone} (link de pagamento enviado)`);
            }
        } catch (error) {
            console.error('Erro ao verificar link de pagamento:', error);
        }
    }

    async updateStatistics(userId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            await db.execute(
                `INSERT INTO statistics (user_id, date, messages_received, messages_sent) 
                VALUES (?, ?, 1, 1) 
                ON DUPLICATE KEY UPDATE 
                messages_received = messages_received + 1,
                messages_sent = messages_sent + 1`,
                [userId, today]
            );
        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
        }
    }

    async closeSession(userId) {
        try {
            const client = this.clients.get(userId);
            if (client) {
                await client.close();
                this.clients.delete(userId);
                
                await db.execute(
                    'UPDATE whatsapp_sessions SET status = ? WHERE user_id = ?',
                    ['disconnected', userId]
                );
            }
        } catch (error) {
            console.error('Erro ao fechar sessão:', error);
        }
    }

    getClient(userId) {
        return this.clients.get(userId);
    }

    // Método para despausar o bot (quando vendedor assumir)
    unpauseBot(phoneNumber) {
        const pauseKey = `pause-${phoneNumber}@c.us`;
        this.conversationHistory.delete(pauseKey);
        console.log(`▶️ Bot despausado para ${phoneNumber}`);
    }

    // Método para limpar histórico de um contato
    clearHistory(phoneNumber) {
        const keys = Array.from(this.conversationHistory.keys());
        keys.forEach(key => {
            if (key.includes(phoneNumber)) {
                this.conversationHistory.delete(key);
            }
        });
        console.log(`🗑️ Histórico limpo para ${phoneNumber}`);
    }

    async reconnectExistingSessions() {
        try {
            console.log('🔄 Reconectando sessões existentes...');
            
            const [sessions] = await db.execute(
                'SELECT user_id, session_name FROM whatsapp_sessions WHERE status = ?',
                ['connected']
            );

            for (const session of sessions) {
                console.log(`🔌 Reconectando sessão ${session.session_name} para usuário ${session.user_id}`);
                
                try {
                    const client = await wppconnect.create({
                        session: session.session_name,
                        catchQR: (base64Qr, asciiQR) => {},
                        statusFind: (statusSession, sessionName) => {
                            console.log(`Status da sessão ${sessionName}: ${statusSession}`);
                        },
                        headless: true,
                        devtools: false,
                        useChrome: false,
                        debug: false,
                        logQR: false,
                        disableWelcome: true,
                        updatesLog: false,
                        autoClose: 180000,
                        folderNameToken: 'tokens'
                    });

                    this.clients.set(session.user_id, client);

                    // Registrar listener para mensagens
                    client.onMessage(async (message) => {
                        console.log(`📩 Mensagem recebida para usuário ${session.user_id}`);
                        await this.handleIncomingMessage(session.user_id, message);
                    });

                    console.log(`✅ Sessão ${session.session_name} reconectada com sucesso`);
                } catch (error) {
                    console.error(`❌ Erro ao reconectar sessão ${session.session_name}:`, error.message);
                }
            }
            
            console.log(`✅ Total de ${sessions.length} sessão(ões) processada(s)`);
        } catch (error) {
            console.error('Erro ao reconectar sessões:', error);
        }
    }
}

module.exports = new WhatsAppService();
