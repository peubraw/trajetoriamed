// Chatbot baseado em fluxo - ULTRA RÁPIDO (sem IA)
class ChatbotFlowService {
    constructor() {
        this.sessions = new Map(); // Armazena estado da conversa por usuário
        this.lastCRMSync = new Map(); // Controle de última sincronização CRM (evita duplicatas)
    }

    // Detectar intent da mensagem
    detectIntent(message, instagramLinks = {}) {
        if (!message || typeof message !== 'string') {
            console.log('⚠️ Mensagem inválida recebida:', message);
            return 'nao_entendido';
        }
        const msg = message.toLowerCase().trim();
        
        // Links do Instagram (detecção de produto)
        if (msg.includes('instagram.com') || msg.includes('instagr.am')) {
            // Extrair código do post para log
            const codeMatch = msg.match(/\/p\/([A-Za-z0-9_-]+)/);
            const postCode = codeMatch ? codeMatch[1] : 'desconhecido';
            
            // Função auxiliar para verificar códigos
            const checkCodes = (linkString) => {
                if (!linkString) return false;
                const codes = linkString.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
                return codes.some(code => msg.includes(code));
            };
            
            // Verificar cada produto usando os links configurados
            if (checkCodes(instagramLinks.link_pericia)) {
                console.log(`📦 Link Instagram detectado: PERÍCIA (${postCode})`);
                return 'produto_pericia';
            }
            if (checkCodes(instagramLinks.link_auditoria)) {
                console.log(`📦 Link Instagram detectado: AUDITORIA (${postCode})`);
                return 'produto_auditoria';
            }
            if (checkCodes(instagramLinks.link_medicina)) {
                console.log(`📦 Link Instagram detectado: MEDICINA (${postCode})`);
                return 'produto_medicina';
            }
            if (checkCodes(instagramLinks.link_combo)) {
                console.log(`📦 Link Instagram detectado: COMBO (${postCode})`);
                return 'produto_combo';
            }
            if (checkCodes(instagramLinks.link_provatitulos)) {
                console.log(`📦 Link Instagram detectado: PROVA TÍTULOS (${postCode})`);
                return 'produto_provatitulos';
            }
            if (checkCodes(instagramLinks.link_missao)) {
                console.log(`📦 Link Instagram detectado: MISSÃO (${postCode})`);
                return 'produto_missao';
            }
            if (checkCodes(instagramLinks.link_sos)) {
                console.log(`📦 Link Instagram detectado: SOS (${postCode})`);
                return 'produto_sos';
            }
            if (checkCodes(instagramLinks.link_caixa)) {
                console.log(`📦 Link Instagram detectado: CAIXA (${postCode})`);
                return 'produto_caixa';
            }
            if (checkCodes(instagramLinks.link_tcemg)) {
                console.log(`📦 Link Instagram detectado: TCEMG (${postCode})`);
                return 'produto_tcemg';
            }
            
            console.log(`⚠️ Link Instagram NÃO mapeado: ${postCode}`);
            return 'menu_geral';
        }

        // Saudações
        if (msg.match(/^(oi|olá|ola|hey|opa|bom dia|boa tarde|boa noite|ola\,|oi\,)/)) return 'saudacao';
        
        // Pedido para ver outros cursos / voltar ao menu
        if (msg.match(/(outros cursos|outro curso|ver outros|voltar|menu|opções|opcoes|mais cursos|qual|quais cursos|cursos disponiveis|cursos disponíveis)/i)) {
            return 'ver_outros_cursos';
        }
        
        // Menu
        if (msg === '1') return 'produto_auditoria';
        if (msg === '2') return 'produto_medicina';
        if (msg === '3') return 'produto_pericia';
        if (msg === '4') return 'produto_combo';
        if (msg === '5') return 'produto_provatitulos';
        if (msg === '6') return 'produto_missao';
        if (msg === '7') return 'produto_sos';
        if (msg === '8') return 'produto_caixa';
        if (msg === '9') return 'produto_tcemg';
        
        // Negações (PRIORIDADE - antes de confirmações)
        if (msg.match(/^(não|nao|n|nã|nope|nunca|jamais|negativo)$/)) return 'negar';
        if (msg.match(/(não|nao)\s+(fiz|fui|sou|tenho)/)) return 'novo_aluno';
        if (msg.match(/nunca\s+(fiz|fui)/)) return 'novo_aluno';
        
        // Confirmações
        if (msg.match(/^(sim|s|yes|quero|manda|pode|enviar|link|garantir|confirmo|ok)$/)) return 'confirmar';
        
        // Ex-aluno
        if (msg.match(/(já fiz|ja fiz|já sou|ja sou|fui aluno|ex-aluno|ex aluno|sou ex)/)) return 'ex_aluno';
        if (msg.match(/(primeira vez|primeiro curso|primeira compra)/)) return 'novo_aluno';
        
        // Nome completo (2+ palavras)
        if (msg.split(' ').length >= 2 && msg.length > 5 && !msg.match(/\d/)) {
            // Não é link, tem pelo menos 2 palavras, não tem números
            if (!msg.includes('http') && !msg.includes('.com')) return 'nome_completo';
        }
        
        // Curso anterior
        if (msg.match(/(perícia|pericia|auditoria|medicina|tcemg|sos|caixa|webinar|webinário|pós|pos)/)) return 'curso_anterior';
        
        // Detecção de NOME dos cursos (quando usuário menciona durante conversa)
        if (msg.includes('auditoria')) return 'produto_auditoria';
        if (msg.includes('medicina do trabalho') || (msg.includes('medicina') && msg.includes('trabalho'))) return 'produto_medicina';
        if (msg.includes('perícia') || msg.includes('pericia')) return 'produto_pericia';
        if (msg.includes('combo')) return 'produto_combo';
        if (msg.includes('prova') && (msg.includes('título') || msg.includes('titulo'))) return 'produto_provatitulos';
        if (msg.includes('missao') || msg.includes('missão') || (msg.includes('medico') && msg.includes('legista'))) return 'produto_missao';
        if (msg.includes('sos')) return 'produto_sos';
        if (msg.includes('caixa')) return 'produto_caixa';
        if (msg.includes('tce') || msg.includes('tribunal')) return 'produto_tcemg';
        
        return 'nao_entendido';
    }

    // Processar mensagem
    async processMessage(userId, phoneNumber, message, flowConfig = {}, leadId = null) {
        const sessionKey = `${userId}-${phoneNumber}`;
        let session = this.sessions.get(sessionKey);
        
        // Nova sessão
        if (!session) {
            session = {
                stage: 'inicial',
                produto: null,
                nome: null,
                exAluno: null,
                cursoAnterior: null,
                pausado: false
            };
            this.sessions.set(sessionKey, session);
        }
        
        // SEMPRE atualizar flowConfig com a configuração mais recente
        session.flowConfig = flowConfig;

        // VERIFICAR STATUS DO BOT NO BANCO (se leadId foi fornecido)
        if (leadId) {
            try {
                const botControlService = require('./bot-control.service');
                const botStatus = await botControlService.checkBotStatus(leadId);
                
                // Se bot está pausado, não processar mensagem
                if (!botStatus.isActive) {
                    console.log(`🤖 Bot pausado para lead ${leadId} - ignorando mensagem`);
                    return null;
                }
            } catch (error) {
                console.error('⚠️ Erro ao verificar status do bot:', error);
                // Em caso de erro, continua processamento (fail-safe)
            }
        }

        // Se bot está pausado na sessão, não responder
        if (session.pausado) {
            return null;
        }

        // Extrair links do Instagram da configuração
        const instagramLinks = {
            link_pericia: flowConfig.link_pericia || 'DRdbFtgDP78, DReKP5DgpBk, DRekG7dgw2J',
            link_auditoria: flowConfig.link_auditoria || 'CzlC6XlIGPp',
            link_medicina: flowConfig.link_medicina || 'CyPqkXlISe8',
            link_combo: flowConfig.link_combo || '',
            link_provatitulos: flowConfig.link_provatitulos || '',
            link_missao: flowConfig.link_missao || '',
            link_sos: flowConfig.link_sos || 'DRJWDjCgqGT, DReN7hRAwpN, DReN2wFgqGN',
            link_caixa: flowConfig.link_caixa || 'DReKLJog0ry, DReJmRjARrW, DRe3xI1AiMv',
            link_tcemg: flowConfig.link_tcemg || 'DRe3y7vAChT, DRb6Nc_ANbj, DRe37Z3gRjg'
        };

        const intent = this.detectIntent(message, instagramLinks);
        
        console.log(`📊 [FLUXO DEBUG] Stage: ${session.stage} | Intent: ${intent} | Msg: "${message}"`);


        // Fluxo de conversa
        switch (session.stage) {
            case 'inicial':
                if (intent === 'saudacao' || intent === 'menu_geral' || intent === 'nao_entendido') {
                    session.stage = 'aguardando_interesse';
                    return this.getMenuPrincipal(session.flowConfig);
                }
                if (intent.startsWith('produto_')) {
                    session.produto = intent.replace('produto_', '');
                    session.stage = 'conversacao_ia';
                    session.useAI = true;
                    console.log(`✅ [FLUXO] Produto detectado: ${session.produto} - passando para IA`);
                    // Passar imediatamente para IA (primeira mensagem do curso)
                    return {
                        useAI: true,
                        message: null // IA vai se apresentar e apresentar o produto
                    };
                }
                // Qualquer primeira mensagem desconhecida: mostrar menu
                session.stage = 'aguardando_interesse';
                return this.getMenuPrincipal(session.flowConfig);

            case 'aguardando_interesse':
                if (intent.startsWith('produto_')) {
                    session.produto = intent.replace('produto_', '');
                    session.stage = 'conversacao_ia';
                    session.useAI = true;
                    // Passar imediatamente para IA SEM mostrar apresentação
                    return {
                        useAI: true,
                        message: null // IA vai se apresentar e apresentar o produto
                    };
                }
                if (intent === 'menu_pos') {
                    return this.getMenuPos();
                }
                if (intent === 'menu_preparatorios') {
                    return this.getMenuPreparatorios();
                }
                return "Por favor, digite o número da opção desejada (1 a 9).";

            case 'conversacao_ia':
                // Detectar ex-aluno ou novo aluno durante conversa com IA
                if (intent === 'ex_aluno') {
                    session.exAluno = true;
                    console.log(`✅ [SESSÃO] Ex-aluno detectado: ${session.exAluno}`);
                } else if (intent === 'novo_aluno') {
                    session.exAluno = false;
                    console.log(`✅ [SESSÃO] Novo aluno detectado: ${session.exAluno}`);
                } else if (intent === 'confirmar' && session.exAluno === null) {
                    // Se respondeu "Sim" e ainda não definiu ex-aluno, assumir que é resposta à pergunta sobre ex-aluno
                    // Verificar histórico: se última mensagem bot continha "ex-aluno" ou "trajetória med"
                    session.exAluno = true; // Por padrão, "Sim" no contexto de perguntas sobre histórico = ex-aluno
                    console.log(`✅ [SESSÃO] Ex-aluno detectado por confirmação: ${session.exAluno}`);
                } else if (intent === 'negar' && session.exAluno === null) {
                    session.exAluno = false;
                    console.log(`✅ [SESSÃO] Novo aluno detectado por negação: ${session.exAluno}`);
                }
                
                // Detectar se usuário está pedindo para VER OUTROS CURSOS (reset completo)
                let clearHistory = false;
                let isFirstMessage = false;
                let showMenu = false;
                
                if (intent === 'ver_outros_cursos') {
                    console.log(`🔄 [RESET COMPLETO] Mostrando menu novamente. Nome preservado: ${session.nome}`);
                    const nomePreservado = session.nome; // Salvar nome
                    // Resetar TUDO exceto nome
                    session.stage = 'aguardando_interesse'; // Stage correto para aguardar escolha
                    session.produto = null;
                    session.exAluno = null;
                    session.cursoAnterior = null;
                    session.useAI = false;
                    session.nome = nomePreservado; // Restaurar nome
                    clearHistory = true;
                    showMenu = true; // Flag para mostrar menu
                }
                
                // Detectar se usuário está pedindo OUTRO curso
                if (intent.startsWith('produto_')) {
                    const novoProduto = intent.replace('produto_', '');
                    if (novoProduto !== session.produto) {
                        console.log(`🔄 [TROCA CURSO] ${session.produto} → ${novoProduto}`);
                        session.produto = novoProduto;
                        // Resetar informações relacionadas ao curso anterior
                        session.exAluno = null;
                        clearHistory = true; // Flag para limpar histórico da IA
                        isFirstMessage = true; // Tratar como primeira mensagem do novo curso
                    }
                }
                
                // Se pediu para ver outros cursos, mostrar menu
                if (showMenu) {
                    return {
                        stage: session.stage,
                        useAI: false,
                        message: this.getMenuPrincipal(session.flowConfig),
                        clearHistory: true,
                        showMenu: true
                    };
                }
                
                // Toda conversa a partir daqui é controlada pela IA
                return {
                    useAI: true,
                    message: isFirstMessage ? null : message, // null = primeira mensagem do curso
                    clearHistory: clearHistory // Sinalizar para limpar histórico se trocou curso
                };

            case 'perguntou_ex_aluno':
                if (intent === 'ex_aluno' || intent === 'confirmar') {
                    session.exAluno = true;
                    session.stage = 'perguntou_curso_anterior';
                    return "Perfeito! Qual curso você já fez conosco?";
                }
                if (intent === 'novo_aluno' || intent === 'negar') {
                    session.exAluno = false;
                    session.stage = 'perguntou_nome';
                    return "Perfeito! Para eu registrar corretamente, pode me confirmar seu nome completo, Dr(a)? 😊";
                }
                // Tentar detectar se é apenas "não" isolado
                if (message.toLowerCase().trim().match(/^(não|nao|n)$/)) {
                    session.exAluno = false;
                    session.stage = 'perguntou_nome';
                    return "Perfeito! Para eu registrar corretamente, pode me confirmar seu nome completo, Dr(a)? 😊";
                }
                session.stage = 'perguntou_nome'; // Forçar próximo stage se não entendeu
                return "Entendi! Para eu registrar corretamente, pode me confirmar seu nome completo, Dr(a)? 😊";

            case 'perguntou_curso_anterior':
                if (intent === 'curso_anterior' || message.length > 3) {
                    session.cursoAnterior = message;
                    session.stage = 'finalizado';
                    session.pausado = true;
                    // Sinalizar notificação de ex-aluno
                    session.notificarVendedor = 'ex_aluno';
                    return "Obrigado pelas informações! 😊";
                }
                return "Qual curso você já fez conosco?";

            case 'perguntou_nome':
                if (intent === 'nome_completo' || message.split(' ').length >= 2) {
                    session.nome = message;
                    session.stage = 'aguardando_confirmacao';
                    return this.getPrecosBlackNovember(session.produto) + 
                           "\n\n*Você gostaria de garantir sua vaga com esse desconto?* 😊";
                }
                return "Por favor, me informe seu nome completo.";

            case 'aguardando_confirmacao':
                if (intent === 'confirmar') {
                    session.stage = 'finalizado';
                    session.pausado = true;
                    session.notificarVendedor = 'link_enviado';
                    return this.getLinkPagamento(session.produto, false);
                }
                if (intent === 'negar') {
                    session.stage = 'finalizado';
                    return "Sem problemas, Dr(a)! Fico à disposição caso mude de ideia. Desejo muito sucesso na sua carreira! 🩺";
                }
                return "Você gostaria de garantir sua vaga? Por favor, responda sim ou não.";

            default:
                return this.getMenuPrincipal(session?.flowConfig);
        }
    }

    getMenuPrincipal(flowConfig = {}) {
        // Se existe menu_text na configuração, usar ele
        if (flowConfig.menu_text && flowConfig.menu_text.trim()) {
            return flowConfig.menu_text;
        }
        
        // Caso contrário, usar menu padrão
        return `Olá, Dr(a)! 👋

Sou o Assistente da *Trajetória Med*!

Digite o número da opção desejada:

*📚 PÓS-GRADUAÇÕES:*
1️⃣ Pós em Auditoria em Saúde
2️⃣ Pós em Medicina do Trabalho
3️⃣ Pós em Perícia Médica Federal e Judicial
4️⃣ Combo Perícia + Medicina do Trabalho

*🎯 PREPARATÓRIOS:*
5️⃣ Prova de Título em Medicina Legal
6️⃣ Missão Médico Legista (PC/PF)
7️⃣ SOS Médico Legista (Reta Final)
8️⃣ CAIXA (Médico do Trabalho)
9️⃣ TCE MG (Tribunal de Contas)`;
    }

    getMenuPos() {
        return `*📚 PÓS-GRADUAÇÕES DISPONÍVEIS:*

1️⃣ Pós em Auditoria em Saúde
2️⃣ Pós em Medicina do Trabalho
3️⃣ Pós em Perícia Médica Federal e Judicial
4️⃣ Combo Perícia + Medicina do Trabalho

Digite o número desejado:`;
    }

    getMenuPreparatorios() {
        return `*🎯 CURSOS PREPARATÓRIOS:*

5️⃣ Prova de Título em Medicina Legal
6️⃣ Missão Médico Legista (PC/PF)
7️⃣ SOS Médico Legista (Reta Final)
8️⃣ CAIXA (Médico do Trabalho)
9️⃣ TCE MG (Tribunal de Contas)

Digite o número desejado:`;
    }

    getApresentacaoProduto(produto) {
        const produtos = {
            pericia: `Olá, Dr(a)! 👋 Excelente escolha na *Pós-Graduação em Perícia Médica*!

Nossa Pós foi TOTALMENTE REFORMULADA seguindo o padrão de excelência da Perícia!

*O que você recebe:*
✅ Foco em prática real: operadoras, hospitais e defesa de glosas
✅ Plantão de dúvidas AO VIVO com a Dra. Germana
✅ Diploma MEC - conclusão em 6 meses
✅ Mentoria de carreira e networking profissional

*Diferencial:* Não é teoria chata! São casos reais que você vai enfrentar no dia a dia do mercado.`,

            auditoria: `Olá, Dr(a)! 👋 Excelente escolha na *Pós-Graduação em Auditoria em Saúde*!

Nossa Pós foi TOTALMENTE REFORMULADA seguindo o padrão de excelência da Perícia!

*O que você recebe:*
✅ Foco em prática real: operadoras, hospitais e defesa de glosas
✅ Plantão de dúvidas AO VIVO com a Dra. Germana
✅ Diploma MEC - conclusão em 6 meses
✅ Mentoria de carreira e networking profissional

*Diferencial:* Não é teoria chata! São casos reais que você vai enfrentar no dia a dia do mercado.`,

            medicina: `Olá, Dr(a)! 👋 Excelente escolha na *Pós-Graduação em Medicina do Trabalho*!

Nossa Pós foi TOTALMENTE REFORMULADA seguindo o padrão de excelência da Perícia!

*O que você recebe:*
✅ Foco em prática real: operadoras, hospitais e defesa de glosas
✅ Plantão de dúvidas AO VIVO com a Dra. Germana
✅ Diploma MEC - conclusão em 6 meses
✅ Mentoria de carreira e networking profissional

*Diferencial:* Não é teoria chata! São casos reais que você vai enfrentar no dia a dia do mercado.`,

            webinario: `Olá, Dr(a)! 👋 Ótima escolha!

Nosso *Webinário GRATUITO* é perfeito para você conhecer a metodologia da Profa. Germana Veloso (1º Lugar Perícia Médica Federal).

*O que você vai aprender:*
✅ Como se destacar na carreira médica
✅ Oportunidades em Perícia e Auditoria
✅ Dicas práticas de quem já passou

É 100% gratuito e online!`,

            combo: `Olá, Dr(a)! 👋 Excelente escolha no *Combo Perícia + Medicina do Trabalho*!

🎓 *Combo:* 2 Pós-Graduações completas
⏱️ *Duração:* 4 a 6 meses cada
📜 *Certificação:* RQE em ambas as áreas

*O que você recebe:*
✅ Pós em Perícia Médica Federal e Judicial
✅ Pós em Medicina do Trabalho
✅ Material completo de ambos os cursos
✅ Certificação para concursos públicos
✅ Flexibilidade para fazer quando quiser

*Metodologia Profa. Germana (1º Lugar Perícia Federal)*

💡 Invista na sua carreira com economia! 2 cursos pelo preço de 1,5!

🔗 Entre em contato para mais informações`,

            provatitulos: `Olá, Dr(a)! 👋 Ótima escolha no *Preparatório Prova de Título (RQE)*!

🏅 *Objetivo:* Obtenção do RQE em Medicina Legal e Perícias Médicas
📋 *Banca:* ABMLPM/AMB
🎯 *Público:* Médicos que já atuam na área ou terminaram pós

*Por que fazer este curso?*
❌ *Dor:* Prova difícil, bibliografia extensa, detalhes de rodapé
✅ *Solução:* Foco na banca com metodologia cirúrgica

*O que você recebe:*
✅ Aulas de revisão específicas ABMLPM
✅ Questões comentadas no estilo da prova
✅ Simulados focados na banca
✅ 100% online (estude entre plantões)
✅ Material mastigado para aprovação

*Coordenação Profa. Germana (referência nacional)*

💡 Não perca tempo com livros densos! Nós filtramos o que a banca cobra.

🔗 Link: https://pay.kiwify.com.br/9SypgNo`,

            missao: `Olá, Dr(a)! 👋 Excelente escolha no *Missão Médico Legista*!

🎯 *Objetivo:* Polícia Civil e Polícia Federal
👮 *Carreiras:* Perito Médico Legista
💰 *Salários:* R$ 15k a R$ 25k iniciais

*O que você recebe:*
✅ Preparação específica para PC/PF
✅ Medicina Legal completa
✅ Legislação e procedimentos periciais
✅ Tanatologia e traumatologia forense
✅ Questões comentadas de provas anteriores
✅ Simulados no estilo das bancas

*Metodologia Profa. Germana (1º Lugar Perícia Federal)*

💡 Curso focado para quem quer carreira de Estado com status e estabilidade!

🔗 Entre em contato para mais informações`,

            sos: `Olá, Dr(a)! 👋 Excelente escolha no *SOS Médico Legista (Reta Final)*!

*O que você recebe:*
✅ Revisão completa para a prova
✅ Questões comentadas
✅ Material exclusivo
✅ Suporte até o dia da prova

*Diferencial:* Método aprovado da Profa. Germana Veloso!`,

            caixa: `Olá, Dr(a)! 👋 Excelente escolha no *CAIXA - Médico do Trabalho*!

💼 *Concurso:* Caixa Econômica Federal
📅 *Prova:* 01/02/2026
⏰ *Inscrições até:* 08/12/2025
💰 *Salário:* R$ 12.371,00 + Benefícios (PLR, Saúde, Previdência)
⏱️ *Carga:* 30h semanais (qualidade de vida!)

*O que você recebe:*
✅ Conhecimentos Básicos (Português, Inglês, Estatística)
✅ Conhecimentos Médicos Gerais
✅ Medicina do Trabalho e Saúde do Trabalhador
✅ Legislação Específica
✅ Auditoria Médica e Plano de Saúde
✅ Questões comentadas Cesgranrio

*Metodologia Profa. Germana (1º Lugar Perícia Federal)*

💡 Curso feito para quem dá plantão: 1-2h/dia com material direcionado!

📌 *Inscrições do concurso até 08/12. Não perca o prazo!*

⚠️ *Importante:* Título de Especialista pode ser apresentado após aprovação!`,

            tcemg: `Olá, Dr(a)! 👋 Excelente escolha no *TCE MG*!

🏛️ *Concurso:* Tribunal de Contas de MG
📅 *Prova:* 25/01/2026
⏰ *Inscrições até:* 09/12/2025
💰 *Salário:* Carreira de Estado com estabilidade

*O que você recebe:*
✅ Português, Dir. Administrativo, Constitucional
✅ Controle Externo (diferencial da banca)
✅ Medicina Específica completa
✅ Questões comentadas + Simulados
✅ Preparação para Discursiva

*Metodologia Profa. Germana (1º Lugar Perícia Federal)*

💡 Curso feito para quem dá plantão: 1-2h/dia com mapas mentais e resumos cirúrgicos!

📌 *Inscrições do concurso até 09/12. Não perca o prazo!*`
        };

        return produtos[produto] || this.getMenuPrincipal();
    }

    getPrecosBlackNovember(produto) {
        const precos = {
            pericia: `Perfeito, Dr(a)! Estamos na *Black November* com a menor taxa de sempre!

💰 Taxa de Inscrição: Apenas R$ 79,00 (de R$ 359)
💰 Investimento: De R$ 12.115 por *R$ 7.269,00* à vista (40% OFF)
💵 Ou 12x de R$ 751,78

Essa condição é exclusiva e válida só até o fim da Black November (30/11)!`,

            auditoria: `Perfeito, Dr(a)! Estamos na *Black November* com a menor taxa de sempre!

💰 Taxa de Inscrição: Apenas R$ 79,00 (de R$ 359)
💰 Investimento: De R$ 12.115 por *R$ 7.269,00* à vista (40% OFF)
💵 Ou 12x de R$ 751,78

Essa condição é exclusiva e válida só até o fim da Black November (30/11)!`,

            medicina: `Perfeito, Dr(a)! Estamos na *Black November* com a menor taxa de sempre!

💰 Taxa de Inscrição: Apenas R$ 79,00 (de R$ 359)
💰 Investimento: De R$ 12.115 por *R$ 7.269,00* à vista (40% OFF)
💵 Ou 12x de R$ 751,78

Essa condição é exclusiva e válida só até o fim da Black November (30/11)!`,

            combo: `Perfeito, Dr(a)! O Combo é o melhor investimento na sua carreira!

💰 Taxa de Inscrição: Apenas R$ 79,00
💰 Investimento: 2 Pós-Graduações pelo preço de 1,5!
💵 Condições especiais de parcelamento disponíveis

Entre em contato para saber os valores atualizados e condições especiais!`,

            provatitulos: `Perfeito, Dr(a)! Investimento para a Prova de Título:

💰 Valor: Consulte condições atuais
💵 Parcelamento disponível

🔗 Link direto: https://pay.kiwify.com.br/9SypgNo`,

            missao: `Perfeito, Dr(a)! Investimento no Missão Médico Legista:

💰 Valor: Consulte condições atuais
💵 Parcelamento disponível

Entre em contato para saber os valores e condições especiais!`,

            sos: `Perfeito, Dr(a)! Como você é novo na Trajetória Med, vamos aproveitar a *Black November* com *40% OFF da Black November* (use cupom *TRAJETORIA40* no checkout):

💰 De *R$ 3.599,00* por apenas *R$ 2.159,40* à vista (*40% OFF*)
💵 Ou 12x de R$ 223,33

Essa condição é exclusiva e válida só até o fim da Black November (30/11)!`,

            caixa: `Perfeito, Dr(a)! Como você é novo na Trajetória Med, vamos aproveitar a *Black November* com *40% OFF da Black November* (use cupom *TRAJETORIA40* no checkout):

💰 De *R$ 3.599,00* por apenas *R$ 2.159,40* à vista (*40% OFF*)
💵 Ou 12x de R$ 223,33

Essa condição é exclusiva e válida só até o fim da Black November (30/11)!`,

            tcemg: `Perfeito, Dr(a)! Estamos na *Black November* com a menor taxa histórica!

💰 De R$ 3.599,00 por apenas *R$ 2.159,40* à vista (*40% OFF*)
💵 Ou 12x de R$ 223,33

Essa condição é exclusiva e válida só até o fim da Black November (30/11)!`,

            sos: `Perfeito, Dr(a)! Como você é novo na Trajetória Med, vamos aproveitar a *Black November* com *40% OFF da Black November* (use cupom *TRAJETORIA40* no checkout):

💰 De *R$ 3.599,00* por apenas *R$ 2.159,40* à vista (*40% OFF*)
💵 Ou 12x de R$ 223,33

Essa condição é exclusiva e válida só até o fim da Black November (30/11)!`,

            caixa: `Perfeito, Dr(a)! Como você é novo na Trajetória Med, vamos aproveitar a *Black November* com *40% OFF da Black November* (use cupom *TRAJETORIA40* no checkout):

💰 De *R$ 3.599,00* por apenas *R$ 2.159,40* à vista (*40% OFF*)
💵 Ou 12x de R$ 223,33

Essa condição é exclusiva e válida só até o fim da Black November (30/11)!`
        };

        return precos[produto] || "";
    }

    getLinkPagamento(produto, exAluno) {
        const links = {
            pericia: exAluno ? 'https://pay.kiwify.com.br/T46pMDR' : 'https://pay.kiwify.com.br/qvNdt4F',
            auditoria: exAluno ? 'https://pay.kiwify.com.br/bFgzCa8' : 'https://pay.kiwify.com.br/t6QQ5rx',
            medicina: exAluno ? 'https://pay.kiwify.com.br/hHEjxP1' : 'https://pay.kiwify.com.br/W9eDBqJ',
            combo: 'https://pay.kiwify.com.br/COMBO_LINK',
            provatitulos: 'https://pay.kiwify.com.br/9SypgNo',
            missao: 'https://pay.kiwify.com.br/MISSAO_LINK',
            sos: exAluno ? 'https://pay.kiwify.com.br/aEvlQ68' : 'https://pay.kiwify.com.br/qvNdt4F',
            caixa: exAluno ? 'https://pay.kiwify.com.br/SgP49yW' : 'https://pay.kiwify.com.br/q0TTdIR',
            tcemg: exAluno ? 'https://pay.kiwify.com.br/p33EuRI' : 'https://pay.kiwify.com.br/MquUu7Y'
        };

        const link = links[produto] || '';
        
        return `Excelente, Dr(a)! 🎉

Aqui está o link para garantir sua vaga:

${link}

Dr(a), assim que finalizar o pagamento, por favor envie o comprovante aqui ou confirme por mensagem. Isso agiliza a liberação do seu acesso! ✅

Estamos com poucas vagas nesse lote!`;
    }

    // Limpar sessão
    clearSession(userId, phoneNumber) {
        const sessionKey = `${userId}-${phoneNumber}`;
        this.sessions.delete(sessionKey);
    }

    // Verificar se sessão está pausada (para notificações)
    isSessionPaused(userId, phoneNumber) {
        const sessionKey = `${userId}-${phoneNumber}`;
        const session = this.sessions.get(sessionKey);
        return session?.pausado || false;
    }

    // Obter info para notificação
    getSessionInfo(userId, phoneNumber) {
        const sessionKey = `${userId}-${phoneNumber}`;
        return this.sessions.get(sessionKey);
    }

    /**
     * Extrair dados estruturados da conversa IA para CRM
     * Analisa as mensagens da conversa e extrai: nome, RQE, especialidade, estado, etc
     */
    async extractLeadDataFromConversation(userId, phoneNumber, conversationHistory) {
        const session = this.getSessionInfo(userId, phoneNumber);
        const extractedData = {
            name: session?.nome || null,
            interestedCourse: session?.produto || null,
            isFormerStudent: session?.exAluno === 'sim' ? true : (session?.exAluno === 'nao' ? false : null),
            previousCourse: session?.cursoAnterior || null,
            rqe: null,
            specialty: null,
            state: null,
            email: null
        };

        // Se não há histórico de conversa, retornar dados da sessão
        if (!conversationHistory || conversationHistory.length === 0) {
            return extractedData;
        }

        // Analisar histórico da conversa para extrair dados adicionais
        const fullConversation = conversationHistory.map(msg => msg.content || msg).join(' ');
        
        // Extrair nome (procurar por "me chamo", "meu nome é", ou frases similares)
        if (!extractedData.name) {
            const namePatterns = [
                // Padrão explícito: "me chamo X" ou "meu nome é X"
                /(?:me chamo|meu nome (?:é|e))\s+([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåçèéêëìíîïñòóôõöùúûüý]+(?:\s+[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåçèéêëìíîïñòóôõöùúûüý]+)*)/i,
                // Padrão "sou o/a X"
                /(?:sou o|sou a|sou)\s+([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåçèéêëìíîïñòóôõöùúûüý]+(?:\s+[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåçèéêëìíîïñòóôõöùúûüý]+)*)/i,
                // Padrão de nome completo (múltiplas palavras capitalizadas)
                /\b([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåçèéêëìíîïñòóôõöùúûüý]+(?:\s+[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåçèéêëìíîïñòóôõöùúûüý]+)+)\b/,
                // Padrão single name (apenas nome próprio capitalizado, min 3 caracteres)
                /\b([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåçèéêëìíîïñòóôõöùúûüý]{2,})\b/
            ];
            
            for (const pattern of namePatterns) {
                const match = fullConversation.match(pattern);
                if (match && match[1]) {
                    const name = match[1].trim();
                    // Aceitar nomes com 2+ palavras OU nomes únicos com 3+ caracteres
                    if (name.split(' ').length >= 2 || name.length >= 3) {
                        extractedData.name = name;
                        break;
                    }
                }
            }
        }
        
        // Extrair RQE (formato: números)
        const rqeMatch = fullConversation.match(/\b\d{4,6}\b/);
        if (rqeMatch) extractedData.rqe = rqeMatch[0];

        // Extrair especialidades comuns
        const specialties = ['cardiologia', 'pediatria', 'ortopedia', 'dermatologia', 'neurologia', 
                            'psiquiatria', 'oftalmologia', 'ginecologia', 'cirurgia', 'clínica geral',
                            'radiologia', 'anestesiologia', 'urologia', 'medicina do trabalho'];
        for (const spec of specialties) {
            if (fullConversation.toLowerCase().includes(spec)) {
                extractedData.specialty = spec.charAt(0).toUpperCase() + spec.slice(1);
                break;
            }
        }

        // Extrair estado (siglas)
        const stateMatch = fullConversation.match(/\b([A-Z]{2})\b/);
        if (stateMatch) extractedData.state = stateMatch[1];

        // Extrair email
        const emailMatch = fullConversation.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) extractedData.email = emailMatch[0];

        return extractedData;
    }

    /**
     * Sincronizar dados da sessão com CRM
     * Chama automaticamente após cada mensagem significativa
     * Throttle: 30 segundos entre sincronizações para mesmo usuário
     */
    async syncSessionToCRM(userId, phoneNumber, conversationHistory = []) {
        try {
            const syncKey = `${userId}-${phoneNumber}`;
            const now = Date.now();
            const lastSync = this.lastCRMSync.get(syncKey) || 0;
            
            // Throttle: não sincronizar se última sync foi há menos de 30 segundos
            if (now - lastSync < 30000) {
                console.log(`⏱️ [CRM SYNC] Throttled - última sync há ${Math.floor((now - lastSync) / 1000)}s`);
                return null;
            }

            const crmService = require('./crm.service');
            const leadData = await this.extractLeadDataFromConversation(userId, phoneNumber, conversationHistory);
            
            console.log(`🔍 [CRM SYNC] Phone: ${phoneNumber}`);
            console.log(`🔍 [CRM SYNC] Extracted:`, JSON.stringify(leadData, null, 2));
            console.log(`🔍 [CRM SYNC] History length: ${conversationHistory?.length || 0}`);
            
            // Validar dados mínimos
            if (!leadData.name && !leadData.interestedCourse) {
                console.log(`⚠️ [CRM SYNC] Skipped - insufficient data (no name/course)`);
                return null;
            }
            
            // Criar ou atualizar lead no CRM (etapa Triagem)
            const leadId = await crmService.upsertLead({
                userId: userId,
                phone: phoneNumber.replace('@c.us', ''),
                name: leadData.name,
                email: leadData.email,
                state: leadData.state,
                rqe: leadData.rqe,
                specialty: leadData.specialty,
                interestedCourse: leadData.interestedCourse,
                isFormerStudent: leadData.isFormerStudent,
                channel: 'whatsapp',
                source: 'chatbot_ia'
            });

            // Atualizar timestamp da última sincronização
            this.lastCRMSync.set(syncKey, now);

            console.log(`✅ [CRM SYNC] Lead ${leadId} ${leadId ? 'upserted' : 'created'} - Nome: ${leadData.name || 'N/A'}, Curso: ${leadData.interestedCourse || 'N/A'}`);
            return leadId;
        } catch (error) {
            console.error('❌ Erro ao sincronizar sessão com CRM:', error);
            return null;
        }
    }
}

module.exports = new ChatbotFlowService();
