const wppconnect = require('@wppconnect-team/wppconnect');
const db = require('../config/database');
const openRouterService = require('./openrouter.service');
const chatbotFlowService = require('./chatbot-flow.service');
const promptBuilder = require('./prompt-builder.service');

class WhatsAppService {
    constructor() {
        this.clients = new Map();
        this.conversationHistory = new Map(); // Usado apenas para pausas
        this.configCache = new Map(); // Cache de configurações
        this.cacheExpiry = 60 * 1000; // 1 minuto (máxima atualização)
        this.processedMessages = new Map(); // Anti-duplicação
        this.useFlowMode = true; // ⚡ MODO FLUXO ATIVADO (ultra-rápido)
        this.messageBuffer = new Map(); // Buffer para aguardar múltiplas linhas
        this.messageTimers = new Map(); // Timers para processar mensagens agrupadas
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
                // Anti-duplicação: verificar se já processamos esta mensagem
                const msgKey = `${message.from}_${message.id}_${message.timestamp}`;
                if (this.processedMessages.has(msgKey)) {
                    console.log(`⚠️ Mensagem duplicada ignorada: ${message.body}`);
                    return;
                }
                
                // Marcar como processada (limpar após 5 minutos)
                this.processedMessages.set(msgKey, Date.now());
                setTimeout(() => this.processedMessages.delete(msgKey), 300000);
                
                console.log(`📨 Recebendo mensagem de ${message.from}: "${message.body}"`);
                
                // Aguardar múltiplas linhas (buffer de 3 segundos)
                const bufferKey = `${userId}-${message.from}`;
                
                // Adicionar mensagem ao buffer
                if (!this.messageBuffer.has(bufferKey)) {
                    this.messageBuffer.set(bufferKey, []);
                }
                this.messageBuffer.get(bufferKey).push(message.body);
                
                // Limpar timer anterior se existir
                if (this.messageTimers.has(bufferKey)) {
                    clearTimeout(this.messageTimers.get(bufferKey));
                }
                
                // Criar novo timer para processar após 3 segundos de silêncio
                const timer = setTimeout(async () => {
                    const bufferedMessages = this.messageBuffer.get(bufferKey) || [];
                    this.messageBuffer.delete(bufferKey);
                    this.messageTimers.delete(bufferKey);
                    
                    // Combinar todas as mensagens em uma só
                    const combinedMessage = bufferedMessages.join('\n');
                    console.log(`📨 Processando ${bufferedMessages.length} mensagem(ns) combinada(s): "${combinedMessage}"`);
                    
                    // Criar mensagem combinada
                    const processMessage = { ...message, body: combinedMessage };
                    await this.handleIncomingMessage(userId, processMessage);
                }, 3000); // 3 segundos de espera para mensagens múltiplas
                
                this.messageTimers.set(bufferKey, timer);
            });

            // ===================================
            // 🎯 LISTENER DE MENSAGENS ENVIADAS (Vendedor manual)
            // Detectar quando vendedor responde manualmente e pausar bot
            // ===================================
            client.onAck(async (ack) => {
                try {
                    // Verificar se é mensagem enviada (não broadcast, não status)
                    if (ack && ack.to && !ack.to.includes('status@broadcast') && !ack.isGroupMsg) {
                        const recipientPhone = ack.to.replace('@c.us', '');
                        
                        // Buscar se destinatário é um lead no CRM
                        const crmService = require('./crm.service');
                        const lead = await crmService.getLeadByPhone(recipientPhone, userId);
                        
                        if (lead && lead.bot_active) {
                            // Vendedor enviou mensagem manual - pausar bot automaticamente
                            console.log(`👤 Vendedor respondeu ${recipientPhone} - Pausando bot automaticamente`);
                            await crmService.toggleBot(lead.id, false, userId);
                            await crmService.logActivity(lead.id, userId, 'bot_paused', 
                                'Bot pausado automaticamente - vendedor assumiu conversa');
                        }
                    }
                } catch (error) {
                    console.error('⚠️ Erro ao processar ACK (não bloqueante):', error.message);
                }
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

            // ===================================
            // 🎯 INTEGRAÇÃO CRM: Criar/Atualizar Lead
            // ===================================
            try {
                const crmService = require('./crm.service');
                const sessionInfo = chatbotFlowService.getSessionInfo(userId, message.from);
                
                await crmService.upsertLead({
                    userId: userId,
                    phone: message.from.replace('@c.us', ''),
                    name: sessionInfo?.name || null,
                    rqe: sessionInfo?.rqe || null,
                    specialty: sessionInfo?.specialty || null,
                    interestedCourse: sessionInfo?.selectedCourse || null,
                    isFormerStudent: sessionInfo?.isFormerStudent || false,
                    channel: 'whatsapp',
                    source: 'chatbot'
                });
                console.log('✅ Lead atualizado no CRM');
            } catch (crmError) {
                console.error('⚠️ Erro ao atualizar CRM (não bloqueante):', crmError.message);
            }
            // ===================================

            // Buscar lista de vendedores do banco
            const [configs] = await db.execute(
                `SELECT vendor1_phone, vendor2_phone, vendor3_phone, vendor4_phone
                 FROM bot_configs WHERE user_id = ?`,
                [userId]
            );

            // Criar lista de telefones dos vendedores
            let vendorPhones = [];
            if (configs.length > 0) {
                const config = configs[0];
                vendorPhones = [
                    config.vendor1_phone,
                    config.vendor2_phone,
                    config.vendor3_phone,
                    config.vendor4_phone
                ].filter(phone => phone && phone.trim() !== '').map(phone => phone.replace(/\D/g, ''));
            }

            // Ignorar mensagens dos vendedores (para evitar ativar bot para eles)
            const senderPhone = message.from.replace('@c.us', '').replace(/\D/g, '');
            const isVendor = vendorPhones.some(vendorPhone => senderPhone.includes(vendorPhone) || vendorPhone.includes(senderPhone));
            
            // COMANDO DE DESPAUSAR (apenas vendedores podem usar)
            if (isVendor && message.body.trim().startsWith('/despausar')) {
                const phoneToUnpause = message.body.trim().split(' ')[1];
                if (phoneToUnpause) {
                    this.unpauseBot(phoneToUnpause);
                    await client.sendText(message.from, `✅ Bot despausado para o cliente ${phoneToUnpause}!\n\nO bot voltará a responder automaticamente.`);
                    // Limpar sessão do chatbot flow também
                    chatbotFlowService.clearSession(userId, `${phoneToUnpause}@c.us`);
                } else {
                    await client.sendText(message.from, `❌ Formato inválido!\n\nUse: /despausar 5584999999999`);
                }
                return;
            }
            
            if (isVendor) {
                console.log(`🚫 Mensagem ignorada - remetente é vendedor: ${message.from}`);
                return;
            }

            // Verificar se o bot está pausado para este contato
            const pauseKey = `pause-${message.from}`;
            if (this.conversationHistory.get(pauseKey)) {
                console.log(`⏸️ Bot pausado para ${message.from} - aguardando intervenção humana`);
                return;
            }

            // Buscar configuração do bot para passar ao fluxo
            const [botConfigs] = await db.execute(
                'SELECT * FROM bot_configs WHERE user_id = ? LIMIT 1',
                [userId]
            );
            const botConfig = botConfigs[0] || {};

            let aiResponse;

            // ⚡ MODO FLUXO: Ultra-rápido (sem chamada IA)
            if (this.useFlowMode) {
                console.log(`⚡ Processando com FLUXO (ultra-rápido)`);
                const startTime = Date.now();
                
                // Extrair menu_text da courses_config
                let flowConfig = {};
                if (botConfig.courses_config) {
                    try {
                        const coursesConfig = typeof botConfig.courses_config === 'string' 
                            ? JSON.parse(botConfig.courses_config) 
                            : botConfig.courses_config;
                        flowConfig.menu_text = coursesConfig.menu_text;
                        // Adicionar links do Instagram se existirem
                        if (coursesConfig.courses) {
                            coursesConfig.courses.forEach(course => {
                                if (course.instagram_link) {
                                    flowConfig[`link_${course.id}`] = course.instagram_link;
                                }
                            });
                        }
                    } catch (e) {
                        console.log('⚠️ Erro ao parsear courses_config:', e.message);
                    }
                }
                
                const flowResponse = await chatbotFlowService.processMessage(
                    userId,
                    message.from,
                    message.body,
                    flowConfig
                );

                const elapsedTime = Date.now() - startTime;
                console.log(`⚡ Tempo de resposta FLUXO: ${elapsedTime}ms`);

                // Se não conseguiu processar (null), não responder
                if (!flowResponse) {
                    console.log('⏸️ Bot pausado - aguardando ação do usuário');
                    return;
                }

                // NOVO: Verificar se deve usar IA (modo híbrido)
                if (typeof flowResponse === 'object' && flowResponse.useAI) {
                    console.log('🔄 MODO HÍBRIDO: Passando controle para IA...');
                    
                    // Processar com IA a partir daqui
                    const sessionInfo = chatbotFlowService.getSessionInfo(userId, message.from);
                    
                    // Se mudou de curso, limpar histórico da IA
                    if (flowResponse.clearHistory) {
                        const historyKey = `${userId}-${message.from}`;
                        this.conversationHistory.delete(historyKey);
                        console.log('🧹 [HISTÓRICO LIMPO] Curso alterado - histórico resetado');
                    }
                    
                    // Se flowResponse.message é null (primeira mensagem do curso), usar flag especial
                    // Se flowResponse.message tem conteúdo (conversação), usar mensagem real
                    const userMessage = (flowResponse.message === null || flowResponse.message === undefined) 
                        ? '_PRIMEIRA_MENSAGEM_' 
                        : flowResponse.message;
                    
                    aiResponse = await this.processWithAI(
                        userId,
                        message.from,
                        userMessage,
                        botConfig,
                        sessionInfo
                    );
                } else if (typeof flowResponse === 'object' && flowResponse.showMenu) {
                    // Reset completo - mostrar menu e limpar histórico
                    console.log('🔄 RESET COMPLETO: Mostrando menu novamente');
                    
                    if (flowResponse.clearHistory) {
                        const historyKey = `${userId}-${message.from}`;
                        this.conversationHistory.delete(historyKey);
                        console.log('🧹 [HISTÓRICO LIMPO] Reset completo do atendimento');
                    }
                    
                    aiResponse = flowResponse.message;
                } else {
                    // Resposta normal do fluxo
                    aiResponse = flowResponse;
                }

                // Verificar se precisa notificar vendedor
                const sessionInfo = chatbotFlowService.getSessionInfo(userId, message.from);
                if (sessionInfo?.notificarVendedor) {
                    await this.checkPaymentLinkAndPause(
                        client, 
                        message, 
                        aiResponse, 
                        userId,
                        sessionInfo
                    );
                }
            } 
            // MODO IA: Backup (se fluxo desativado)
            else {
                console.log(`🤖 Processando com IA (modo backup)`);
                const startTime = Date.now();

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
                aiResponse = await openRouterService.processMessage(
                    botConfig.system_prompt,
                    message.body,
                    history
                );

                // Atualizar histórico
                history.push({ role: 'user', content: message.body });
                history.push({ role: 'assistant', content: aiResponse });
                
                // Manter apenas últimas 2 interações (4 mensagens)
                if (history.length > 4) {
                    history = history.slice(-4);
                }
                
                this.conversationHistory.set(historyKey, history);

                const elapsedTime = Date.now() - startTime;
                console.log(`🤖 Tempo de resposta IA: ${elapsedTime}ms`);

                // Detectar link de pagamento (modo IA)
                await this.checkPaymentLinkAndPause(client, message, aiResponse, userId);
            }

            // 🔒 VALIDAÇÃO DE SEGURANÇA: Bloquear links incorretos
            // Obter sessionInfo se não estiver definido (modo IA backup)
            let sessionInfo = null;
            try {
                sessionInfo = chatbotFlowService.getSessionInfo(userId, message.from);
            } catch (e) {
                console.log('⚠️ SessionInfo não disponível (modo IA sem fluxo)');
            }
            
            // Log da resposta ANTES da validação
            console.log('🔍 [ANTES VALIDAÇÃO] Resposta IA:', aiResponse.substring(0, 500));
            
            aiResponse = await this.validateAndFixLinks(aiResponse, sessionInfo, botConfig);

            // Enviar resposta (a IA já envia no formato correto do WhatsApp)
            await client.sendText(message.from, aiResponse);

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

    async checkPaymentLinkAndPause(client, message, aiResponse, userId, sessionInfo = null) {
        try {
            // Se tem sessionInfo (modo FLUXO), usar flag direta
            let sentPaymentLink = false;
            let isExStudent = false;

            if (sessionInfo) {
                // Modo FLUXO: usa flag da sessão
                sentPaymentLink = sessionInfo.notificarVendedor === 'link_enviado';
                isExStudent = sessionInfo.notificarVendedor === 'ex_aluno';
            } else {
                // Modo IA: detectar apenas links Kiwify (único sistema de pagamento usado)
                sentPaymentLink = aiResponse.includes('pay.kiwify.com.br');

                isExStudent = aiResponse.includes('Obrigado pelas informações') && 
                             (aiResponse.includes('😊') || aiResponse.toLowerCase().includes('ex-aluno'));
            }

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

                // Extrair informações do contato
                const contactName = message.sender?.pushname || message.from;
                const contactPhone = message.from.replace('@c.us', '');

                // Informações adicionais do modo FLUXO
                let additionalInfo = '';
                if (sessionInfo) {
                    additionalInfo = `\n📦 *Produto:* ${sessionInfo.produto || 'N/A'}`;
                    if (sessionInfo.nome) additionalInfo += `\n👤 *Nome:* ${sessionInfo.nome}`;
                    if (sessionInfo.exAluno) additionalInfo += `\n🎓 *Ex-aluno:* ${sessionInfo.exAluno ? 'Sim' : 'Não'}`;
                    if (sessionInfo.cursoAnterior) additionalInfo += `\n📚 *Curso anterior:* ${sessionInfo.cursoAnterior}`;
                }

                // Mensagem de notificação
                const notificationType = isExStudent ? 'EX-ALUNO IDENTIFICADO' : 'LINK DE PAGAMENTO ENVIADO';
                const notificationIcon = isExStudent ? '🎓' : '💳';
                const notificationMessage = `${notificationIcon} *${notificationType}*\n\n` +
                    `👤 *Cliente:* ${contactName}\n` +
                    `📱 *Telefone:* ${contactPhone}\n` +
                    `💬 *Última mensagem:* ${message.body}` +
                    additionalInfo + `\n\n` +
                    (isExStudent ? `🎓 Cliente confirmou ser EX-ALUNO\n⚠️ Bot desligado - Vendedor precisa assumir o atendimento.` : `✅ Link enviado com sucesso!\n🤖 Bot continua ativo respondendo dúvidas.`);

                // Comando separado para facilitar copy/paste
                const commandMessage = `/despausar ${contactPhone}`;

                // Enviar notificação para todos os vendedores (em paralelo)
                const notificationPromises = vendors.map(vendor => 
                    client.sendText(`${vendor.phone}@c.us`, notificationMessage)
                        .then(() => client.sendText(`${vendor.phone}@c.us`, commandMessage))
                        .then(() => console.log(`✅ Notificação enviada para ${vendor.name} (${vendor.phone})`))
                        .catch(error => console.error(`❌ Erro ao notificar ${vendor.name}:`, error.message))
                );

                await Promise.all(notificationPromises);

                // NÃO pausar mais - Mia continua ativa para responder dúvidas
                console.log(`🔗 Link de pagamento enviado - Mia continua ativa para ${contactPhone}`);
            }
        } catch (error) {
            console.error('Erro ao verificar link de pagamento:', error);
        }
    }

    async validateAndFixLinks(aiResponse, sessionInfo, botConfig) {
        try {
            // Verificar se a resposta contém links problemáticos
            const hasHotmart = /hotmart\.com/i.test(aiResponse);
            const hasEduzz = /eduzz\.com/i.test(aiResponse);
            const hasWaMe = /wa\.me/i.test(aiResponse);
            const hasInvalidLink = hasHotmart || hasEduzz || hasWaMe;

            if (hasInvalidLink) {
                console.log('🚨 [SEGURANÇA] Link inválido detectado! Bloqueando e substituindo...');
                console.log('   - Hotmart:', hasHotmart);
                console.log('   - Eduzz:', hasEduzz);
                console.log('   - wa.me:', hasWaMe);

                // Obter o link correto do banco
                const coursesConfig = typeof botConfig.courses_config === 'string' 
                    ? JSON.parse(botConfig.courses_config) 
                    : botConfig.courses_config;

                console.log('🔍 [VALIDAÇÃO] Produto da sessão:', sessionInfo?.produto);
                console.log('🔍 [VALIDAÇÃO] Ex-aluno:', sessionInfo?.exAluno);
                
                const selectedCourse = coursesConfig.courses.find(c => c.id === sessionInfo.produto);

                if (selectedCourse) {
                    console.log('✅ [VALIDAÇÃO] Curso encontrado:', selectedCourse.name, '(ID:', selectedCourse.id + ')');
                    
                    // Determinar qual link usar
                    const isCaixaOrTce = selectedCourse.id === 'caixa' || selectedCourse.id === 'tcemg';
                    let correctLink;

                    if (isCaixaOrTce) {
                        const hoje = new Date();
                        const dataLimiteBlack = new Date('2025-12-05T23:59:59');
                        const isBlackFriday = hoje <= dataLimiteBlack;
                        correctLink = isBlackFriday ? selectedCourse.payment_link_new : selectedCourse.payment_link_alumni;
                        console.log('🎯 [VALIDAÇÃO] Usando lógica CAIXA/TCE - Black Friday:', isBlackFriday);
                    } else {
                        const isAlumni = sessionInfo.exAluno === true;
                        correctLink = isAlumni ? selectedCourse.payment_link_alumni : selectedCourse.payment_link_new;
                        console.log('🎯 [VALIDAÇÃO] Usando lógica EX-ALUNO - É ex-aluno:', isAlumni);
                    }

                    console.log('✅ [SEGURANÇA] Link correto selecionado:', correctLink);
                    console.log('💰 [SEGURANÇA] Preços do curso:', selectedCourse.installment, '/', selectedCourse.cash);

                    // Remover todos os links inválidos e substituir por mensagem correta
                    aiResponse = `Perfeito, Dr(a)! 😊

Aqui está seu link de acesso ao ${selectedCourse.name}:

${correctLink}

Pode pagar no cartão ou PIX. Assim que finalizar, envie o comprovante aqui! 😊`;
                    
                    console.log('✅ [SEGURANÇA] Resposta corrigida e link substituído');
                }
            }

            // Validar que links pay.kiwify.com.br estão intactos
            const kiwifyLinks = aiResponse.match(/https:\/\/pay\.kiwify\.com\.br\/\w+/g);
            if (kiwifyLinks) {
                console.log('✅ [VALIDAÇÃO] Links Kiwify válidos encontrados:', kiwifyLinks.length);
            }

            return aiResponse;

        } catch (error) {
            console.error('❌ Erro na validação de links:', error);
            return aiResponse; // Retornar resposta original em caso de erro
        }
    }

    formatWhatsAppMessage(text) {
        if (!text) return text;
        
        try {
            // Converter formatação Markdown para WhatsApp
            let formatted = text;
            
            // Negrito: **texto** ou __texto__ -> *texto*
            formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '*$1*');
            formatted = formatted.replace(/__([^_]+)__/g, '*$1*');
            
            // Itálico: *texto* (quando não for negrito) ou _texto_ -> _texto_
            // Já está no formato correto do WhatsApp
            
            // Tachado: ~~texto~~ -> ~texto~
            formatted = formatted.replace(/~~([^~]+)~~/g, '~$1~');
            
            // Monospace: `texto` já está correto
            
            // Remover formatação de código em bloco ```
            formatted = formatted.replace(/```[\s\S]*?```/g, (match) => {
                return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
            });
            
            // Garantir que emojis e símbolos especiais estejam preservados
            // Links devem permanecer intactos
            
            console.log('✍️ [FORMATAÇÃO] Mensagem formatada para WhatsApp');
            return formatted;
            
        } catch (error) {
            console.error('❌ Erro ao formatar mensagem:', error);
            return text; // Retornar texto original em caso de erro
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

    async logoutSession(userId) {
        try {
            const client = this.clients.get(userId);
            if (client) {
                // Fazer logout do WhatsApp (limpa tokens)
                await client.logout();
                this.clients.delete(userId);
                
                await db.execute(
                    'UPDATE whatsapp_sessions SET status = ? WHERE user_id = ?',
                    ['disconnected', userId]
                );
                
                // Limpar pasta de tokens
                const fs = require('fs');
                const path = require('path');
                const tokenPath = path.join(__dirname, '..', 'tokens', `session_${userId}`);
                
                if (fs.existsSync(tokenPath)) {
                    fs.rmSync(tokenPath, { recursive: true, force: true });
                    console.log(`🗑️ Tokens deletados para userId ${userId}`);
                }
            }
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            throw error;
        }
    }

    getClient(userId) {
        return this.clients.get(userId);
    }

    // NOVO: Processar mensagem com IA (Grok via OpenRouter)
    async processWithAI(userId, phoneNumber, message, botConfig, sessionInfo) {
        console.log(`🤖 [AI] Iniciando processamento para ${phoneNumber}`);
        console.log(`🤖 [AI] Mensagem: "${message}"`);
        console.log(`🤖 [AI] Produto: ${sessionInfo.produto}`);
        console.log(`🤖 [AI] Ex-Aluno: ${sessionInfo.exAluno}`);
        console.log(`🤖 [AI] Nome: ${sessionInfo.nome}`);
        
        const openRouterService = require('./openrouter.service');
        
        // Criar chave única para histórico
        const historyKey = `${userId}-${phoneNumber}`;
        let history = this.conversationHistory.get(historyKey) || [];
        
        console.log(`🤖 [AI] Tamanho do histórico: ${history.length} mensagens`);
        
        // Verificar se é primeira mensagem (IA deve se apresentar)
        const isPrimeiraMsg = message === '_PRIMEIRA_MENSAGEM_';
        let userMessageForHistory = message;
        
        if (isPrimeiraMsg) {
            message = `O lead acabou de escolher o curso ${sessionInfo.produto}. Você deve se apresentar como Mia e apresentar o curso de forma resumida e atrativa, depois perguntar o nome dele.`;
            userMessageForHistory = `[Lead escolheu o curso: ${sessionInfo.produto}]`;
        }
        
        // ⚙️ CONSTRUIR PROMPT DINÂMICO A PARTIR DA CONFIGURAÇÃO DO BANCO
        let systemPrompt;
        
        // Verificar se botConfig tem courses_config (modo dinâmico)
        if (botConfig.courses_config) {
            try {
                const coursesConfig = typeof botConfig.courses_config === 'string' 
                    ? JSON.parse(botConfig.courses_config) 
                    : botConfig.courses_config;
                
                console.log(`⚙️ [AI] Usando configuração dinâmica (courses_config)`);
                systemPrompt = promptBuilder.buildSystemPrompt(coursesConfig, sessionInfo);
            } catch (e) {
                console.error('❌ Erro ao parsear courses_config:', e);
                // Fallback para system_prompt estático
                systemPrompt = botConfig.system_prompt || `Você é ${botConfig.bot_name || 'Mia'}, consultora de carreira da Trajetória Med.

**INFORMAÇÕES DO LEAD:**
- Produto de interesse: ${sessionInfo.produto || 'não identificado'}
- Nome: ${sessionInfo.nome || 'não coletado ainda'}
- Ex-aluno: ${sessionInfo.exAluno === true ? 'SIM' : sessionInfo.exAluno === false ? 'NÃO' : 'não perguntado'}
- Curso anterior: ${sessionInfo.cursoAnterior || 'N/A'}

**FLUXO DE ATENDIMENTO:**

1. **PRIMEIRA MENSAGEM (quando lead escolhe o curso):**
   Se apresente E apresente o curso de forma resumida e atrativa:
   
   Exemplo para CAIXA:
   "Olá, Dr(a)! 👋 Sou a Mia, consultora de carreira da Trajetória Med.
   
   Excelente escolha no *CAIXA - Médico do Trabalho*!
   
   💼 Salário: R$ 12.371,00 + Benefícios
   📅 Prova: 01/02/2026
   ⏰ Inscrições até: 08/12
   
   Temos preparação completa com a metodologia da Profa. Germana (1º Lugar Perícia Federal).
   
   Qual o seu nome completo, Dr(a)?"
   
   Exemplo para TCE MG:
   "Olá, Dr(a)! 👋 Sou a Mia, consultora de carreira da Trajetória Med.
   
   Excelente escolha no *TCE MG - Tribunal de Contas*!
   
   💼 Salário: R$ 15.000,00 + Benefícios
   📅 Prova: 25/01/2026
   ⏰ Inscrições até: 09/12/2025
   
   Uma carreira estável e rentável para se livrar do plantão!
   
   Qual o seu nome completo, Dr(a)?"
   
   ADAPTE para o curso escolhido: ${sessionInfo.produto}

2. **IDENTIFICAÇÃO:**
   - Sempre saudar como "Dr(a)"
   - Coletar nome completo primeiro
   - Perguntar se é ex-aluno da Trajetória Med

2. **QUALIFICAÇÃO E ESPECIALIDADE (para CAIXA):**
   
   Perguntar: "O Dr(a) tem alguma especialidade?"
   
   **Se NÃO tem especialidade:**
   - "Tranquilo! Este concurso é para médico do trabalho. Felizmente nós temos a solução!"
   - "O Dr(a) pode fazer nossa Pós-Graduação em Medicina do Trabalho. Existem muitas boas oportunidades nessa área para deixar o plantão e ter uma carreira mais estável."
   - "O Dr(a) tem interesse em atuar nessa área?"
   - Se SIM: Mostrar informações da Pós em Medicina do Trabalho
   
   **Se tem especialidade diferente (ex: Endócrino, Pediatria, etc):**
   - "Legal, mas esse concurso é somente para médico do trabalho."
   - "Felizmente nós temos a solução! O Dr(a) pode fazer nossa Pós-Graduação em Medicina do Trabalho, pois existem muitas boas oportunidades nessa área para deixar o plantão e ter uma carreira mais estável."
   - "O Dr(a) tem interesse em atuar nessa área?"
   - Se SIM: Mostrar informações da Pós em Medicina do Trabalho
   - Se NÃO: Oferecer TCE MG ou outros preparatórios
   
   **Se tem especialidade em Medicina do Trabalho:**
   - "Ótimo! O Dr(a) possui RQE?"
   
   **Se SIM tem RQE:**
   - "Excelente! Este concurso foi feito exatamente para o Dr(a)."
   - Mostrar valores da CAIXA e pedir para correr com a compra e inscrição
   
   **Se NÃO tem RQE:**
   - "Quanto tempo o Dr(a) tem de experiência na área?"
   
   **Se MENOS de 3 anos:**
   - Indicar concurso TCE MG e mostrar informações
   
   **Se MAIS de 3 anos:**
   - "Legal! Os Concursos Federais levam tempo para fazer o chamamento dos candidatos, portanto faça a prova e garanta a sua nomeação."
   - "O erro seria perder o concurso agora. Você garante a vaga (aprovação) agora, pois a Caixa permite que o Dr(a) apresente o título depois na posse."
   - "Temos o Preparatório da Prova de Títulos. Você estuda para o concurso e garante o título antes de ser nomeado. Quer ver a opção?"

2C. **FLUXO ESPECÍFICO TCE MG (quando escolher opção 9):**

   Após coletar o nome completo:
   
   "Ótimo! Dr(a) [Nome]!"
   
   **NÃO apresente informações detalhadas do curso agora!** Já foram apresentadas na primeira mensagem.
   
   **Perguntar: "O Dr(a) tem alguma especialidade?"**
   
   **Se SIM (qualquer especialidade - Endócrino, Pediatria, etc):**
   - "Excelente! O Dr(a) está pronto para se livrar do plantão e assumir uma carreira mais estável e rentável!"
   
   **Se NÃO:**
   - "Excelente! O Dr(a) está pronto para se livrar do plantão e assumir uma carreira mais estável e rentável!"
   
   ⚠️ IMPORTANTE: No TCE MG, QUALQUER especialidade ou SEM especialidade é aceita! Diferente da CAIXA, não tem restrição.

3. **BLOCO FAQ - INFORMAÇÕES GERAIS:**
   
   Pergunte: "Posso ajudar com mais alguma informação? Preço, condições de pagamento? Datas, Materiais ou outra pergunta?"
   
   **Se perguntar sobre DATA:**
   - CAIXA: "A data da prova é 01/02/2026 e inscrições até 08/12/2025"
   - TCE MG: "A data da prova é 25/01/2026 e inscrições até 09/12/2025"
   
   **Se perguntar sobre MATÉRIAS DA PROVA (TCE MG):**
   - "As matérias são divididas em 3 provas:"
   - "P1 - Conhecimentos Gerais: Português, Direito Administrativo, Direito Constitucional, Controle Externo e Direitos Humanos"
   - "P2 - Conhecimentos Específicos: Medicina completa (Clínica Médica, cardiovascular, pulmonar, gastrointestinal, renal, endócrina, reumatologia, infectologia, emergências, ética médica e bioética)"
   - "P3 - Prova Discursiva: Uma questão de conhecimentos gerais e uma de Medicina"
   
   **Se perguntar sobre MATERIAIS DO CURSO:**
   - Explicar o material (videoaulas, mapas mentais, questões comentadas, cronograma)
   
   ⚠️ **IMPORTANTE:** Só apresente informações completas do curso (salário, datas, matérias) SE O DR(A) PERGUNTAR! Não repita automaticamente.

4. **BLOCO PREÇO / NEGOCIAÇÃO:**

   **Quando perguntar "Quanto custa?" ou "Preço":**
   - Mostrar preços e condições (NÃO enviar link ainda!)
   - "12x de R$ 227,22 ou R$ 2.197,00 à vista com cupom TRAJETORIA40"
   
   **Se disser "Está caro" ou "Fora do orçamento":**
   - PARA CAIXA: "Dr(a), o salário inicial é +12k com benefícios. O valor do curso é menor que um único plantão de 24h. É um investimento para sair dos plantões, não um custo."
   - PARA TCE MG: "Dr(a), o salário inicial é +15k com benefícios. O valor do curso é menor que um único plantão de 24h. É um investimento para sair dos plantões, não um custo."
   - Perguntar: "O senhor gostaria de outra forma de pagamento? Posso indicar parcelamento ou assinatura."
   
   **Se escolher PARCELAMENTO:**
   - Explicar: "12x de R$ 227,22 no cartão com cupom TRAJETORIA40"
   
   **Se disser "Não tenho limite no cartão" ou "Ainda está caro":**
   - Oferecer ASSINATURA:
   - "Não podemos perder tempo de estudo! Podemos pagar uma pequena taxa de assinatura de R$ 39,90 (tal como Netflix) + parcelamento de 12x de R$ 227,22 + taxa do cartão, para liberar seu acesso com o mesmo desconto e a parcela só cai na próxima fatura."
   - "Posso sugerir então assinatura? Para isso preciso dos seus dados para cadastrá-lo."
   
   **Se aceitar ASSINATURA:**
   - Coletar dados: "Nome Completo, CPF, Email, Telefone, CRM, Endereço Completo"
   - Após coletar: "Vou transferi-lo para um colega para cadastrá-lo. Assim que meu colega registrar o Dr(a) receberá um email solicitando o pagamento via assinatura."
   - PAUSAR BOT (humano assume)
   
   **Se CONCORDAR com valor:**
   - "Perfeito, Dr(a)! Vou enviar o link de pagamento agora."
   - SOMENTE AGORA enviar o link

5. **BLOCO ESTUDO - OBJEÇÕES PEDAGÓGICAS:**

   **"Não terei tempo para estudar":**
   - "O curso foi feito para quem dá plantão. Aulas curtas, mapas mentais e cronograma para quem tem 1h a 2h por dia. Você precisa de direção, não de tempo sobrando."

   **"Vou ter que estudar sozinho?":**
   - "O problema não é estudar, é filtrar. Sozinho você perde tempo com o que não cai. A Prova é Cesgranrio, tem estilo próprio. Entregamos tudo mastigado para você não estudar errado."

6. **BLOCO QUALIFICAÇÃO:**

   **"Mas não tenho título":**
   - "A Caixa permite apresentar título depois na posse. A falta de título hoje não é impedimento para fazer a prova."
   - "Temos o Preparatório da Prova de Títulos. Você estuda para o concurso e garante o título antes de ser nomeado."

7. **BLOCO VAGAS:**

   **"Mas são poucas vagas" (CAIXA):**
   - "O déficit na Caixa é enorme. Órgãos federais colocam poucas vagas no papel para evitar obrigação judicial, mas historicamente chamam muito mais. Não deixe de fazer olhando apenas o número do edital."
   
   **"Mas são poucas vagas" (TCE MG):**
   - "O déficit no TCE MG é enorme. Órgãos estaduais colocam poucas vagas no papel para evitar obrigação judicial, mas historicamente chamam muito mais. Não deixe de fazer olhando apenas o número do edital."

8. **BLOCO OUTRAS OPORTUNIDADES:**

   **"Não tenho a qualificação suficiente" (contexto CAIXA):**
   - "Se a Caixa não dá agora, o TCE MG é carreira de Estado e paga super bem. Ou recomendo nosso Preparatório para Concursos Federais Médicos. Ele te dá a base sólida (INSS, Ebserh, Perito Médico Federal) para quando sair o seu edital ideal. O importante é não parar."
   
   **"Não tenho a qualificação suficiente" (contexto TCE MG):**
   - "Se o TCE MG não dá agora, recomendo nosso Preparatório para Concursos Federais Médicos. Ele te dá a base sólida (INSS, Ebserh, Perito Médico Federal) para quando sair o seu edital ideal. O importante é não parar."
   
   **Se interessar por TCE MG:**
   - Mostrar informações do TCE MG
   
   **Se interessar por Preparatório:**
   - Mostrar informações do Preparatório geral

9. **ENVIO DE LINK DE PAGAMENTO:**
   - ⚠️ SOMENTE envie o link APÓS o cliente CONCORDAR com o valor
   - Após enviar: "Dr(a), assim que finalizar o pagamento, envie o comprovante aqui para agilizar a liberação do seu acesso!"
   - ❌ NÃO ofereça boleto (apenas PIX e cartão)
   - ❌ NÃO ofereça combo CAIXA + TCE MG (incompatibilidade de datas das provas)
   - Se ex-aluno: Informar que vendedor vai aplicar desconto adicional

10. **PÓS-LINK (Continue ativa!):**
   - Responda dúvidas sobre formas de pagamento (PIX, cartão - SEM BOLETO)
   - Explique como usar o cupom TRAJETORIA40
   - Esclareça sobre liberação de acesso (até 24h após pagamento)
   - Ajude com problemas no checkout
   - ✅ SEMPRE solicite o comprovante de pagamento
   - Se disse "não" 2 vezes: Encerrar educadamente com "Fico à disposição, Dr(a)! Sucesso na sua carreira! 🩺"

**INFORMAÇÕES DOS CURSOS:**

**TCE MG - Tribunal de Contas do Estado de Minas Gerais:**
- 💰 Salário: R$ 15.000,00+ com benefícios
- 📅 Data da Prova: 25 de janeiro de 2026
- 📝 Inscrições: 10/11/2025 (10h) até 09/12/2025 (18h) - Horário de Brasília
- 💳 Taxa de Inscrição: R$ 180,00 - Vencimento: 11/12/2025
- 📚 Matérias da Prova:
  * P1 - Conhecimentos Gerais: Português, Direito Administrativo, Direito Constitucional, Controle Externo, Noções de Direitos Humanos
  * P2 - Conhecimentos Específicos: Medicina (Clínica Médica, cardiovascular, pulmonar, gastrointestinal, renal, endócrina, reumatologia, infectologia, emergências, ética médica e bioética)
  * P3 - Prova Discursiva: Uma questão de conhecimentos gerais e uma de Medicina

**CAIXA - Médico do Trabalho:**
- 💰 Salário: R$ 12.371,00+ com benefícios
- 📅 Data da Prova: 01/02/2026
- 📝 Inscrições até: 08/12/2025

**PREÇOS BLACK NOVEMBER (Cupom: TRAJETORIA40):**
- Pós-Graduações: 12x de R$ 227,22 ou R$ 2.197,00 à vista
- Preparatórios: 12x de R$ 227,22 ou R$ 2.197,00 à vista
- Prova Títulos: Link https://pay.kiwify.com.br/9SypgNo

**LINKS DE PAGAMENTO:**
- Auditoria (ex-aluno): https://pay.kiwify.com.br/bFgzCa8 | (novo): https://pay.kiwify.com.br/t6QQ5rx
- Medicina (ex-aluno): https://pay.kiwify.com.br/hHEjxP1 | (novo): https://pay.kiwify.com.br/W9eDBqJ
- Perícia (ex-aluno): https://pay.kiwify.com.br/T46pMDR | (novo): https://pay.kiwify.com.br/qvNdt4F
- SOS (ex-aluno): https://pay.kiwify.com.br/aEvlQ68 | (novo): https://pay.kiwify.com.br/qvNdt4F
- CAIXA (ex-aluno): https://pay.kiwify.com.br/SgP49yW | (novo): https://pay.kiwify.com.br/q0TTdIR
- TCE MG (ex-aluno): https://pay.kiwify.com.br/p33EuRI | (novo): https://pay.kiwify.com.br/MquUu7Y
- Prova Títulos: https://pay.kiwify.com.br/9SypgNo

**UPSELL/CROSS-SELL:**
Se lead não tem qualificação: "Se a Caixa não dá agora, o TCE MG é carreira de Estado e paga super bem. O importante é não parar."

**TOM DE VOZ:**
- Consultiva e empática como "Mia"
- Use "Dr(a)" sempre
- Emojis moderados: 😊 ✅ 🎉 💰 📚
- Mensagens curtas e diretas (máximo 4 linhas)
- Crie senso de urgência com Black November
- Seja solucionadora de problemas, não apenas vendedora

**IMPORTANTE - FORMATAÇÃO DE LINKS:**
- NUNCA use ** (asteriscos) ao redor dos links
- Envie o link puro, limpo, sem formatação Markdown
- Exemplo CORRETO: "Link: https://pay.kiwify.com.br/t6QQ5rx"
- Exemplo ERRADO: "**Link: https://pay.kiwify.com.br/t6QQ5rx**"

Você ajuda médicos a tomarem a melhor decisão para suas carreiras.`;
            }
        } else {
            // Fallback caso não tenha courses_config (usar system_prompt antigo)
            console.log(`⚠️ [AI] Usando system_prompt estático (sem courses_config)`);
            systemPrompt = botConfig.system_prompt || `Você é ${botConfig.bot_name || 'Mia'}, consultora de carreira da Trajetória Med.

Ajude o cliente com informações sobre o curso ${sessionInfo.produto}.

**INFORMAÇÕES DO LEAD:**
- Produto de interesse: ${sessionInfo.produto || 'não identificado'}
- Nome: ${sessionInfo.nome || 'não coletado ainda'}
- Ex-aluno: ${sessionInfo.exAluno === true ? 'SIM' : sessionInfo.exAluno === false ? 'NÃO' : 'não perguntado'}
- Curso anterior: ${sessionInfo.cursoAnterior || 'N/A'}`;
        }

        try {
            const response = await openRouterService.processMessage(systemPrompt, message, history);
            
            // Atualizar histórico (manter últimas 6 mensagens = 3 interações)
            history.push({ role: 'user', content: userMessageForHistory });
            history.push({ role: 'assistant', content: response });
            
            if (history.length > 6) {
                history = history.slice(-6);
            }
            
            this.conversationHistory.set(historyKey, history);
            
            // Detectar se enviou link de pagamento (apenas notificar, NÃO pausar)
            if (response.includes('pay.kiwify.com.br')) {
                sessionInfo.notificarVendedor = 'link_enviado';
                console.log('🔗 Link de pagamento enviado - Mia continua ativa para responder dúvidas');
            }
            
            // Detectar se está coletando dados para ASSINATURA (pausar bot para humano assumir)
            if (response.toLowerCase().includes('transferir você para nosso time') || 
                response.toLowerCase().includes('finalizar o cadastro da assinatura')) {
                sessionInfo.pausado = true;
                sessionInfo.notificarVendedor = 'assinatura_solicitada';
                this.conversationHistory.set(`pause-${phoneNumber}`, true);
                console.log('💳 Assinatura solicitada - Bot pausado para atendimento humano');
            }
            
            return response;
        } catch (error) {
            console.error('Erro ao processar com IA:', error);
            
            // Se for timeout, não resetar sessão - pedir pra repetir
            if (error.message && error.message.includes('timeout')) {
                return 'Desculpe Dr(a), tive um pequeno atraso. Pode repetir sua última mensagem? 😊';
            }
            
            return 'Desculpe, tive um problema técnico. Pode repetir sua mensagem?';
        }
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
