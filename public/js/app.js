// Estado da aplicação
let currentUser = null;
let qrCheckInterval = null;

// Verificar autenticação ao carregar
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
});

// Autenticação
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            showDashboard();
            loadDashboardData();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
}

// Mostrar/Ocultar Modais
window.showLogin = function() {
    document.getElementById('login-modal').classList.remove('hidden');
    document.getElementById('register-modal').classList.add('hidden');
}

window.showRegister = function() {
    document.getElementById('register-modal').classList.remove('hidden');
    document.getElementById('login-modal').classList.add('hidden');
}

window.closeModal = function() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('register-modal').classList.add('hidden');
}

// Login
window.handleLogin = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            closeModal();
            showDashboard();
            loadDashboardData();
        } else {
            alert(data.error || 'Erro ao fazer login');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao fazer login');
    }
}

// Registro
window.handleRegister = async function(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, email, phone, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            closeModal();
            showDashboard();
            loadDashboardData();
            alert(data.message);
        } else {
            alert(data.error || 'Erro ao criar conta');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao criar conta');
    }
}

// Logout
window.handleLogout = async function() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        currentUser = null;
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('landing-page').classList.remove('hidden');
        location.reload();
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Reiniciar servidor
window.restartServer = async function() {
    if (!confirm('⚠️ Tem certeza que deseja reiniciar o servidor?\n\nIsso vai:\n• Desconectar todos os usuários temporariamente\n• Limpar conversas ativas\n• Resetar o bot\n\nO servidor voltará online em 5-10 segundos.')) {
        return;
    }

    try {
        const response = await fetch('/api/bot/restart-server', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            alert('✅ Servidor sendo reiniciado!\n\nAguarde 10 segundos e recarregue a página.');
            setTimeout(() => {
                location.reload();
            }, 10000);
        } else {
            const data = await response.json();
            alert(data.error || 'Erro ao reiniciar servidor');
        }
    } catch (error) {
        console.error('Erro ao reiniciar servidor:', error);
        alert('Erro ao reiniciar servidor. Verifique o console.');
    }
}

// Mostrar Dashboard
window.showDashboard = function() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
}

// Navegar entre seções do dashboard
window.showDashboardSection = function(section, event) {
    // Ocultar todas as seções
    document.querySelectorAll('.dashboard-section-tailwind').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Remover classe active de todos os links
    document.querySelectorAll('.nav-item-dashboard').forEach(el => {
        el.classList.remove('active', 'bg-whatsapp-600');
    });
    
    // Mostrar seção selecionada
    document.getElementById(`section-${section}`).classList.remove('hidden');
    
    // Adicionar classe active ao link
    if (event) {
        event.target.closest('.nav-item-dashboard').classList.add('active', 'bg-whatsapp-600');
    }
    
    // Carregar dados específicos da seção
    if (section === 'whatsapp') {
        checkWhatsAppStatus();
    } else if (section === 'prompt') {
        loadBotConfig();
    } else if (section === 'messages') {
        loadMessages();
    }
}

// Carregar dados do dashboard
async function loadDashboardData() {
    try {
        // Informações do usuário
        const userResponse = await fetch('/api/dashboard/user-info', {
            credentials: 'include'
        });
        const userData = await userResponse.json();
        
        // Atualizar badge do trial
        const trialInfo = document.getElementById('trial-info');
        if (userData.subscription_status === 'trial') {
            trialInfo.textContent = `Teste: ${userData.daysRemaining} dia(s) restante(s)`;
        } else {
            trialInfo.textContent = userData.subscription_status;
        }
        
        // Estatísticas
        const statsResponse = await fetch('/api/dashboard/stats', {
            credentials: 'include'
        });
        const stats = await statsResponse.json();
        
        // Atualizar cards
        document.getElementById('total-messages').textContent = stats.totalMessages;
        document.getElementById('today-messages').textContent = 
            stats.todayMessages.messages_received + stats.todayMessages.messages_sent;
        
        // Status do WhatsApp
        checkWhatsAppStatus();
        
        // Status do Bot
        checkBotStatus();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// WhatsApp
window.connectWhatsApp = async function() {
    try {
        console.log('Conectando WhatsApp...');
        document.getElementById('whatsapp-disconnected').classList.add('hidden');
        document.getElementById('whatsapp-connecting').classList.remove('hidden');
        
        const response = await fetch('/api/whatsapp/connect', {
            method: 'POST',
            credentials: 'include'
        });
        
        console.log('Response status:', response.status, response.ok);
        
        if (response.ok) {
            console.log('Iniciando polling do QR Code...');
            // Iniciar polling do QR Code
            window.startQRCodePolling();
        } else {
            const errorData = await response.json();
            console.error('Erro na resposta:', errorData);
            alert('Erro ao conectar WhatsApp: ' + (errorData.error || 'Erro desconhecido'));
            document.getElementById('whatsapp-disconnected').classList.remove('hidden');
            document.getElementById('whatsapp-connecting').classList.add('hidden');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar WhatsApp');
        document.getElementById('whatsapp-disconnected').classList.remove('hidden');
        document.getElementById('whatsapp-connecting').classList.add('hidden');
    }
}

window.startQRCodePolling = function() {
    qrCheckInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/whatsapp/qrcode', {
                credentials: 'include'
            });
            const data = await response.json();
            
            console.log('QR Code response:', { hasQR: !!data.qrCode, status: data.status });
            
            if (data.qrCode) {
                document.getElementById('qrcode-container').innerHTML = 
                    `<img src="${data.qrCode}" alt="QR Code" class="mx-auto max-w-sm">`;
            }
            
            if (data.status === 'connected') {
                clearInterval(qrCheckInterval);
                document.getElementById('whatsapp-connecting').classList.add('hidden');
                document.getElementById('whatsapp-connected').classList.remove('hidden');
                window.checkWhatsAppStatus();
            }
        } catch (error) {
            console.error('Erro ao buscar QR Code:', error);
        }
    }, 2000);
}

window.checkWhatsAppStatus = async function() {
    try {
        const response = await fetch('/api/whatsapp/status', {
            credentials: 'include'
        });
        const data = await response.json();
        
        const statusEl = document.getElementById('whatsapp-status');
        
        if (data.status === 'connected') {
            statusEl.textContent = '✅ Conectado';
            
            if (data.phoneNumber) {
                document.getElementById('connected-phone').textContent = data.phoneNumber;
            }
            
            // Mostrar card de conectado
            document.getElementById('whatsapp-disconnected').classList.add('hidden');
            document.getElementById('whatsapp-connecting').classList.add('hidden');
            document.getElementById('whatsapp-connected').classList.remove('hidden');
        } else {
            statusEl.textContent = '❌ Desconectado';
        }
    } catch (error) {
        console.error('Erro ao verificar status:', error);
    }
}

window.disconnectWhatsApp = async function() {
    try {
        const response = await fetch('/api/whatsapp/disconnect', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            document.getElementById('whatsapp-connected').classList.add('hidden');
            document.getElementById('whatsapp-disconnected').classList.remove('hidden');
            checkWhatsAppStatus();
        }
    } catch (error) {
        console.error('Erro ao desconectar:', error);
    }
}

window.logoutWhatsApp = async function() {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá desconectar PERMANENTEMENTE este número do WhatsApp.\n\nVocê precisará escanear o QR Code novamente para reconectar (pode ser com outro número).\n\nDeseja continuar?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/whatsapp/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ WhatsApp desconectado permanentemente! Você pode conectar outro número agora.');
            document.getElementById('whatsapp-connected').classList.add('hidden');
            document.getElementById('whatsapp-disconnected').classList.remove('hidden');
            checkWhatsAppStatus();
        } else {
            alert('❌ Erro: ' + (data.error || 'Não foi possível desconectar'));
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('❌ Erro ao desconectar permanentemente');
    }
}

// Gerenciamento de Vendedores
let vendorCount = 0;
const vendors = [];

function addVendor(name = '', phone = '') {
    vendorCount++;
    const vendorId = `vendor-${vendorCount}`;
    
    const vendorHTML = `
        <div id="${vendorId}" class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg relative">
            <button type="button" onclick="removeVendor('${vendorId}')" 
                    class="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold text-xl">
                ✕
            </button>
            <div>
                <label class="block font-semibold text-gray-700 mb-2">Vendedor ${vendorCount} - Nome:</label>
                <input type="text" class="vendor-name w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-whatsapp-500 focus:outline-none" value="${name}" placeholder="Nome do vendedor">
            </div>
            <div>
                <label class="block font-semibold text-gray-700 mb-2">Telefone (com DDI):</label>
                <input type="text" class="vendor-phone w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-whatsapp-500 focus:outline-none" value="${phone}" placeholder="5511999999999">
            </div>
        </div>
    `;
    
    document.getElementById('vendors-container').insertAdjacentHTML('beforeend', vendorHTML);
}

function removeVendor(vendorId) {
    const vendorElement = document.getElementById(vendorId);
    if (vendorElement) {
        vendorElement.remove();
    }
}

function getVendorsFromForm() {
    const vendorElements = document.querySelectorAll('#vendors-container > div');
    const vendors = [];
    
    vendorElements.forEach((element, index) => {
        const name = element.querySelector('.vendor-name').value;
        const phone = element.querySelector('.vendor-phone').value;
        
        if (name && phone) {
            vendors.push({ name, phone });
        }
    });
    
    return vendors;
}

// Bot Configuration
async function loadBotConfig() {
    try {
        const response = await fetch('/api/bot/config', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.config) {
            document.getElementById('bot-name').value = data.config.bot_name || '';
            document.getElementById('is-active').checked = data.config.is_active;
            
            // Carregar mensagens do fluxo (ou usar padrão se não existir)
            loadFlowMessages(data.config);
            
            // Carregar vendedores dinamicamente
            document.getElementById('vendors-container').innerHTML = '';
            vendorCount = 0;
            
            // Carregar vendedores salvos
            if (data.config.vendor1_name && data.config.vendor1_phone) {
                addVendor(data.config.vendor1_name, data.config.vendor1_phone);
            }
            if (data.config.vendor2_name && data.config.vendor2_phone) {
                addVendor(data.config.vendor2_name, data.config.vendor2_phone);
            }
            if (data.config.vendor3_name && data.config.vendor3_phone) {
                addVendor(data.config.vendor3_name, data.config.vendor3_phone);
            }
            if (data.config.vendor4_name && data.config.vendor4_phone) {
                addVendor(data.config.vendor4_name, data.config.vendor4_phone);
            }
            
            // Se não houver vendedores, adicionar um vazio
            if (vendorCount === 0) {
                addVendor();
            }
        }
    } catch (error) {
        console.error('Erro ao carregar configuração:', error);
    }
}

// Carregar mensagens do fluxo nos campos
function loadFlowMessages(config) {
    try {
        const flowMessages = JSON.parse(config.system_prompt || '{}');
        document.getElementById('msg-menu-principal').value = flowMessages.menu_principal || getDefaultMenuPrincipal();
        document.getElementById('msg-pergunta-ex-aluno').value = flowMessages.pergunta_ex_aluno || 'Dr(a), você já é ou foi aluno da Trajetória Med em algum curso?';
        document.getElementById('msg-pedir-nome').value = flowMessages.pedir_nome || 'Perfeito! Para eu registrar corretamente, pode me confirmar seu nome completo, Dr(a)? 😊';
        document.getElementById('msg-curso-anterior').value = flowMessages.curso_anterior || 'Perfeito! Qual curso você já fez conosco?';
        document.getElementById('msg-finalizacao-ex-aluno').value = flowMessages.finalizacao_ex_aluno || 'Obrigado pelas informações! 😊';
        document.getElementById('msg-confirmacao').value = flowMessages.confirmacao || 'Você gostaria de garantir sua vaga com esse desconto? 😊';
        
        // Produtos
        document.getElementById('produto-auditoria').value = flowMessages.produto_auditoria || getDefaultProdutoAuditoria();
        document.getElementById('produto-medicina').value = flowMessages.produto_medicina || getDefaultProdutoMedicina();
        document.getElementById('produto-pericia').value = flowMessages.produto_pericia || getDefaultProdutoPericia();
        document.getElementById('produto-combo').value = flowMessages.produto_combo || getDefaultProdutoCombo();
        document.getElementById('produto-provatitulos').value = flowMessages.produto_provatitulos || getDefaultProdutoProvaTitulos();
        document.getElementById('produto-missao').value = flowMessages.produto_missao || getDefaultProdutoMissao();
        document.getElementById('produto-sos').value = flowMessages.produto_sos || getDefaultProdutoSOS();
        document.getElementById('produto-caixa').value = flowMessages.produto_caixa || getDefaultProdutoCaixa();
        document.getElementById('produto-tcemg').value = flowMessages.produto_tcemg || getDefaultProdutoTCEMG();
        
        // Links do Instagram
        document.getElementById('link-auditoria').value = flowMessages.link_auditoria || 'CzlC6XlIGPp';
        document.getElementById('link-medicina').value = flowMessages.link_medicina || 'CyPqkXlISe8';
        document.getElementById('link-pericia').value = flowMessages.link_pericia || 'DRdbFtgDP78, DReKP5DgpBk, DRekG7dgw2J';
        document.getElementById('link-combo').value = flowMessages.link_combo || '';
        document.getElementById('link-provatitulos').value = flowMessages.link_provatitulos || '';
        document.getElementById('link-missao').value = flowMessages.link_missao || '';
        document.getElementById('link-sos').value = flowMessages.link_sos || 'DRJWDjCgqGT, DReN7hRAwpN, DReN2wFgqGN';
        document.getElementById('link-caixa').value = flowMessages.link_caixa || 'DReKLJog0ry, DReJmRjARrW, DRe3xI1AiMv';
        document.getElementById('link-tcemg').value = flowMessages.link_tcemg || 'DRe3y7vAChT, DRb6Nc_ANbj, DRe37Z3gRjg';
    } catch (e) {
        // Se não conseguir parsear, carregar padrões
        loadDefaultFlowMessages();
    }
}

// Restaurar mensagens padrão
window.loadDefaultFlowMessages = function() {
    document.getElementById('msg-menu-principal').value = getDefaultMenuPrincipal();
    document.getElementById('msg-pergunta-ex-aluno').value = 'Dr(a), você já é ou foi aluno da Trajetória Med em algum curso?';
    document.getElementById('msg-pedir-nome').value = 'Perfeito! Para eu registrar corretamente, pode me confirmar seu nome completo, Dr(a)? 😊';
    document.getElementById('msg-curso-anterior').value = 'Perfeito! Qual curso você já fez conosco?';
    document.getElementById('msg-finalizacao-ex-aluno').value = 'Obrigado pelas informações! 😊';
    document.getElementById('msg-confirmacao').value = 'Você gostaria de garantir sua vaga com esse desconto? 😊';
    
    document.getElementById('produto-auditoria').value = getDefaultProdutoAuditoria();
    document.getElementById('produto-medicina').value = getDefaultProdutoMedicina();
    document.getElementById('produto-pericia').value = getDefaultProdutoPericia();
    document.getElementById('produto-combo').value = getDefaultProdutoCombo();
    document.getElementById('produto-provatitulos').value = getDefaultProdutoProvaTitulos();
    document.getElementById('produto-missao').value = getDefaultProdutoMissao();
    document.getElementById('produto-sos').value = getDefaultProdutoSOS();
    document.getElementById('produto-caixa').value = getDefaultProdutoCaixa();
    document.getElementById('produto-tcemg').value = getDefaultProdutoTCEMG();
    
    alert('✅ Mensagens restauradas para o padrão!');
}

function getDefaultMenuPrincipal() {
    return `Olá, Dr(a)! 👋\n\nSou o Assistente da *Trajetória Med*!\n\nDigite o número da opção desejada:\n\n*📚 PÓS-GRADUAÇÕES:*\n1️⃣ Pós em Auditoria em Saúde\n2️⃣ Pós em Medicina do Trabalho\n3️⃣ Pós em Perícia Médica Federal e Judicial\n4️⃣ Combo Perícia + Medicina do Trabalho\n\n*🎯 PREPARATÓRIOS:*\n5️⃣ Prova de Título em Medicina Legal\n6️⃣ Missão Médico Legista (PC/PF)\n7️⃣ SOS Médico Legista (Reta Final)\n8️⃣ CAIXA (Médico do Trabalho)\n9️⃣ TCE MG (Tribunal de Contas)`;
}

async function generatePrompt() {
    alert('Função de geração de prompt desabilitada. Use o sistema de fluxo.');
    return;
    
    const btn = document.getElementById('generate-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Gerando...';
    
    try {
        const response = await fetch('/api/bot/generate-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ description })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('system-prompt').value = data.prompt;
            alert('Prompt gerado com sucesso! Revise e ajuste se necessário.');
        } else {
            alert(data.error || 'Erro ao gerar prompt');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar prompt');
    } finally {
        btn.disabled = false;
        btn.textContent = '✨ Gerar Prompt com IA';
    }
}

async function saveBotConfig(event) {
    event.preventDefault();
    
    // Coletar vendedores do formulário
    const vendors = getVendorsFromForm();
    
    const config = {
        bot_name: document.getElementById('bot-name').value,
        system_prompt: JSON.stringify({
            menu_principal: document.getElementById('msg-menu-principal').value,
            pergunta_ex_aluno: document.getElementById('msg-pergunta-ex-aluno').value,
            pedir_nome: document.getElementById('msg-pedir-nome').value,
            curso_anterior: document.getElementById('msg-curso-anterior').value,
            finalizacao_ex_aluno: document.getElementById('msg-finalizacao-ex-aluno').value,
            confirmacao: document.getElementById('msg-confirmacao').value,
            produto_auditoria: document.getElementById('produto-auditoria').value,
            produto_medicina: document.getElementById('produto-medicina').value,
            produto_pericia: document.getElementById('produto-pericia').value,
            produto_combo: document.getElementById('produto-combo').value,
            produto_provatitulos: document.getElementById('produto-provatitulos').value,
            produto_missao: document.getElementById('produto-missao').value,
            produto_sos: document.getElementById('produto-sos').value,
            produto_caixa: document.getElementById('produto-caixa').value,
            produto_tcemg: document.getElementById('produto-tcemg').value,
            link_auditoria: document.getElementById('link-auditoria').value,
            link_medicina: document.getElementById('link-medicina').value,
            link_pericia: document.getElementById('link-pericia').value,
            link_combo: document.getElementById('link-combo').value,
            link_provatitulos: document.getElementById('link-provatitulos').value,
            link_missao: document.getElementById('link-missao').value,
            link_sos: document.getElementById('link-sos').value,
            link_caixa: document.getElementById('link-caixa').value,
            link_tcemg: document.getElementById('link-tcemg').value
        }),
        temperature: 0.3,
        max_tokens: 250,
        is_active: document.getElementById('is-active').checked,
        vendor1_name: vendors[0]?.name || '',
        vendor1_phone: vendors[0]?.phone || '',
        vendor2_name: vendors[1]?.name || '',
        vendor2_phone: vendors[1]?.phone || '',
        vendor3_name: vendors[2]?.name || '',
        vendor3_phone: vendors[2]?.phone || '',
        vendor4_name: vendors[3]?.name || '',
        vendor4_phone: vendors[3]?.phone || ''
    };
    
    try {
        const response = await fetch('/api/bot/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(config)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Configuração salva com sucesso!');
            checkBotStatus();
        } else {
            alert(data.error || 'Erro ao salvar configuração');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar configuração');
    }
}

window.testPrompt = function() {
    document.getElementById('test-card').classList.remove('hidden');
}

window.sendTestMessage = async function() {
    const systemPrompt = document.getElementById('system-prompt').value;
    const testMessage = document.getElementById('test-message').value;
    
    if (!systemPrompt || !testMessage) {
        alert('Preencha o prompt e a mensagem de teste');
        return;
    }
    
    try {
        const response = await fetch('/api/bot/test-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ system_prompt: systemPrompt, test_message: testMessage })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('test-response').innerHTML = `
                <strong>Resposta do Bot:</strong><br>
                ${data.response}
            `;
        } else {
            alert(data.error || 'Erro ao testar prompt');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao testar prompt');
    }
}

async function checkBotStatus() {
    try {
        const response = await fetch('/api/bot/config', {
            credentials: 'include'
        });
        const data = await response.json();
        
        const statusEl = document.getElementById('bot-status');
        
        if (data.config && data.config.is_active) {
            statusEl.textContent = '✅ Ativo';
            statusEl.style.color = 'var(--success-color)';
        } else {
            statusEl.textContent = '❌ Inativo';
            statusEl.style.color = 'var(--danger-color)';
        }
    } catch (error) {
        console.error('Erro ao verificar status do bot:', error);
    }
}

// Funções para retornar textos padrão dos produtos
function getDefaultProdutoPericia() {
    return `Olá, Dr(a)! 👋 Excelente escolha na *Pós-Graduação em Perícia Médica*!

Nossa Pós foi TOTALMENTE REFORMULADA seguindo o padrão de excelência da Perícia!

*O que você recebe:*
✅ Foco em prática real: operadoras, hospitais e defesa de glosas
✅ Plantão de dúvidas AO VIVO com a Dra. Germana
✅ Diploma MEC - conclusão em 6 meses
✅ Mentoria de carreira e networking profissional

*Diferencial:* Não é teoria chata! São casos reais que você vai enfrentar no dia a dia do mercado.`;
}

function getDefaultProdutoAuditoria() {
    return `Olá, Dr(a)! 👋 Excelente escolha na *Pós-Graduação em Auditoria em Saúde*!

Nossa Pós foi TOTALMENTE REFORMULADA seguindo o padrão de excelência da Perícia!

*O que você recebe:*
✅ Foco em prática real: operadoras, hospitais e defesa de glosas
✅ Plantão de dúvidas AO VIVO com a Dra. Germana
✅ Diploma MEC - conclusão em 6 meses
✅ Mentoria de carreira e networking profissional

*Diferencial:* Não é teoria chata! São casos reais que você vai enfrentar no dia a dia do mercado.`;
}

function getDefaultProdutoMedicina() {
    return `Olá, Dr(a)! 👋 Excelente escolha na *Pós-Graduação em Medicina do Trabalho*!

Nossa Pós foi TOTALMENTE REFORMULADA seguindo o padrão de excelência da Perícia!

*O que você recebe:*
✅ Foco em prática real: operadoras, hospitais e defesa de glosas
✅ Plantão de dúvidas AO VIVO com a Dra. Germana
✅ Diploma MEC - conclusão em 6 meses
✅ Mentoria de carreira e networking profissional

*Diferencial:* Não é teoria chata! São casos reais que você vai enfrentar no dia a dia do mercado.`;
}

function getDefaultProdutoWebinario() {
    return `Olá, Dr(a)! 👋 Excelente escolha no *SOS Médico Legista (Reta Final)*!

*O que você recebe:*
✅ Revisão completa para a prova
✅ Questões comentadas
✅ Material exclusivo
✅ Suporte até o dia da prova

*Diferencial:* Método aprovado da Profa. Germana Veloso!`;
}

function getDefaultProdutoTCEMG() {
    return `Olá, Dr(a)! 👋 Excelente escolha no *TCE MG*!

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

📌 *Inscrições do concurso até 09/12. Não perca o prazo!*`;
}

function getDefaultProdutoSOS() {
    return `Olá, Dr(a)! 👋 Excelente escolha no *SOS Médico Legista (Reta Final)*!

*O que você recebe:*
✅ Revisão completa para a prova
✅ Questões comentadas
✅ Material exclusivo
✅ Suporte até o dia da prova

*Diferencial:* Método aprovado da Profa. Germana Veloso!`;
}

function getDefaultProdutoCaixa() {
    return `Olá, Dr(a)! 👋 Excelente escolha no *CAIXA - Médico do Trabalho*!

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

⚠️ *Importante:* Título de Especialista pode ser apresentado após aprovação!`;
}

function getDefaultProdutoCombo() {
    return `Olá, Dr(a)! 👋 Excelente escolha no *Combo Perícia + Medicina do Trabalho*!

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

🔗 Entre em contato para mais informações`;
}

function getDefaultProdutoProvaTitulos() {
    return `Olá, Dr(a)! 👋 Ótima escolha no *Preparatório Prova de Título (RQE)*!

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

🔗 Link: https://pay.kiwify.com.br/9SypgNo`;
}

function getDefaultProdutoMissao() {
    return `Olá, Dr(a)! 👋 Excelente escolha no *Missão Médico Legista*!

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

🔗 Entre em contato para mais informações`;
}

// Mensagens
async function loadMessages() {
    try {
        const response = await fetch('/api/dashboard/stats', {
            credentials: 'include'
        });
        const data = await response.json();
        
        const messagesList = document.getElementById('messages-list');
        
        if (data.recentMessages && data.recentMessages.length > 0) {
            messagesList.innerHTML = data.recentMessages.map(msg => `
                <div class="message-item">
                    <div class="message-header">
                        <span>${msg.sender}</span>
                        <span>${new Date(msg.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                    <div class="message-body">
                        <strong>Cliente:</strong> ${msg.message}
                    </div>
                    <div class="message-response">
                        <strong>Bot:</strong> ${msg.response}
                    </div>
                </div>
            `).join('');
        } else {
            messagesList.innerHTML = '<p style="text-align: center; color: var(--text-light);">Nenhuma mensagem ainda</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

// ===== CRM FUNCTIONS =====
let crmSocket = null;
let allCRMLeads = [];
let allCRMStages = [];
let pipelineChart = null;
let lostReasonsChart = null;

// Alternar tabs do CRM
window.switchCRMTab = function(tabName, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Remover active de todas as tabs
    document.querySelectorAll('.crm-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.crm-tab-content').forEach(content => content.classList.remove('active'));
    
    // Ativar tab clicada
    if (event && event.target) {
        event.target.classList.add('active');
    }
    document.getElementById(`crm-tab-${tabName}`).classList.add('active');
    
    // Carregar dados da tab
    if (tabName === 'kanban') {
        window.loadKanbanBoard();
    } else if (tabName === 'analytics') {
        window.loadCRMAnalytics();
    }
}

// Conectar Socket.IO para atualizações em tempo real
function connectCRMSocket() {
    if (!crmSocket && typeof io !== 'undefined') {
        crmSocket = io({
            transports: ['websocket', 'polling']
        });
        
        crmSocket.on('connect', () => {
            console.log('Socket.IO CRM conectado');
            if (currentUser) {
                crmSocket.emit('join-crm', currentUser.id);
            }
        });
        
        crmSocket.on('new-lead', () => {
            console.log('Novo lead recebido');
            window.loadKanbanBoard();
        });
        
        crmSocket.on('lead-moved', () => {
            console.log('Lead movido');
            window.loadKanbanBoard();
        });
        
        crmSocket.on('bot-toggled', () => {
            console.log('Bot alternado');
            window.loadKanbanBoard();
        });
    }
}

// Carregar Kanban
window.loadKanbanBoard = async function() {
    try {
        const [stagesRes, leadsRes] = await Promise.all([
            fetch('/api/crm/stages', { credentials: 'include' }),
            fetch('/api/crm/leads', { credentials: 'include' })
        ]);
        
        const stagesData = await stagesRes.json();
        const leadsData = await leadsRes.json();
        
        allCRMStages = stagesData.stages || [];
        allCRMLeads = leadsData.leads || [];
        
        renderKanbanBoard();
    } catch (error) {
        console.error('Erro ao carregar Kanban:', error);
    }
}

function renderKanbanBoard() {
    const board = document.getElementById('kanban-board');
    if (!board) return;
    
    board.innerHTML = '';
    
    allCRMStages.forEach(stage => {
        const stageLeads = allCRMLeads.filter(lead => lead.stage_id === stage.id);
        
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.dataset.stageId = stage.id;
        column.ondrop = dropLead;
        column.ondragover = allowDrop;
        
        column.innerHTML = `
            <div class="column-header" style="border-color: ${stage.color}">
                <div class="column-title">${stage.name}</div>
                <div class="column-count">${stageLeads.length}</div>
            </div>
            <div class="cards-container"></div>
        `;
        
        const container = column.querySelector('.cards-container');
        stageLeads.forEach(lead => {
            container.appendChild(createLeadCard(lead));
        });
        
        board.appendChild(column);
    });
}

function createLeadCard(lead) {
    const card = document.createElement('div');
    card.className = 'lead-card';
    card.draggable = true;
    card.dataset.leadId = lead.id;
    
    const tempEmoji = {
        'hot': '🔥',
        'warm': '🌤️',
        'cold': '❄️'
    }[lead.temperature] || '🌤️';
    
    const botStatus = lead.bot_active ? 
        '<span class="bot-status bot-active">🟢 Bot Ativo</span>' :
        '<span class="bot-status bot-paused">🔴 Bot Pausado</span>';
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-name">${lead.name || lead.phone}</div>
            ${botStatus}
        </div>
        <div class="card-details">
            ${lead.specialty ? `<div class="card-detail-row">🩺 ${lead.specialty}</div>` : ''}
            ${lead.interested_course ? `<div class="card-detail-row">📚 ${lead.interested_course}</div>` : ''}
        </div>
        <div class="card-footer">
            <div class="card-value">R$ ${parseFloat(lead.potential_value || 0).toFixed(2).replace('.', ',')}</div>
            <div class="card-temperature">${tempEmoji}</div>
        </div>
    `;
    
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('leadId', lead.id);
        card.classList.add('dragging');
    });
    
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });
    
    return card;
}

function allowDrop(e) {
    e.preventDefault();
}

async function dropLead(e) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const newStageId = e.currentTarget.dataset.stageId;
    
    try {
        const res = await fetch(`/api/crm/leads/${leadId}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ stageId: newStageId })
        });
        
        if (res.ok) {
            await window.loadKanbanBoard();
        } else {
            alert('Erro ao mover lead');
        }
    } catch (error) {
        console.error('Erro ao mover:', error);
    }
}

function filterKanbanLeads() {
    const searchTerm = document.getElementById('kanbanSearchInput')?.value.toLowerCase() || '';
    const tempFilter = document.getElementById('kanbanTempFilter')?.value || '';
    
    const cards = document.querySelectorAll('.lead-card');
    cards.forEach(card => {
        const leadId = card.dataset.leadId;
        const lead = allCRMLeads.find(l => l.id == leadId);
        
        if (!lead) return;
        
        const matchesSearch = !searchTerm || 
            (lead.name && lead.name.toLowerCase().includes(searchTerm)) ||
            (lead.phone && lead.phone.includes(searchTerm));
        
        const matchesTemp = !tempFilter || lead.temperature === tempFilter;
        
        card.style.display = (matchesSearch && matchesTemp) ? 'block' : 'none';
    });
}

window.refreshKanban = function() {
    window.loadKanbanBoard();
}

// Carregar Analytics
window.loadCRMAnalytics = async function() {
    try {
        const [statsRes, pipelineRes, rankingRes] = await Promise.all([
            fetch('/api/crm/dashboard/stats', { credentials: 'include' }),
            fetch('/api/crm/dashboard/pipeline', { credentials: 'include' }),
            fetch('/api/crm/dashboard/ranking', { credentials: 'include' })
        ]);
        
        const statsData = await statsRes.json();
        const pipelineData = await pipelineRes.json();
        const rankingData = await rankingRes.json();
        
        console.log('Stats recebidas:', statsData);
        console.log('Pipeline recebido:', pipelineData);
        console.log('Ranking recebido:', rankingData);
        
        const stats = statsData.stats || {};
        const pipelineStages = pipelineData.stages || [];
        const sellers = rankingData.ranking || [];
        
        console.log('Dados extraídos:');
        console.log('- Stats:', stats);
        console.log('- Pipeline stages:', pipelineStages);
        console.log('- Sellers:', sellers);
        
        // Atualizar KPIs
        document.getElementById('kpi-revenue').textContent = formatCurrency(stats.revenue_realized || 0);
        document.getElementById('kpi-pipeline').textContent = formatCurrency(stats.pipeline_weighted || 0);
        document.getElementById('kpi-waiting').textContent = formatCurrency(stats.awaiting_payment || 0);
        document.getElementById('kpi-lost').textContent = formatCurrency(stats.money_lost || 0);
        
        // Renderizar gráficos
        console.log('Renderizando pipeline chart com', pipelineStages.length, 'stages');
        renderPipelineChart(pipelineStages);
        
        console.log('Renderizando lost reasons chart com', (stats.lost_reasons || []).length, 'motivos');
        renderLostReasonsChart(stats.lost_reasons || []);
        
        // Renderizar ranking
        console.log('Renderizando ranking com', sellers.length, 'vendedores');
        renderSellerRanking(sellers);
    } catch (error) {
        console.error('Erro ao carregar analytics:', error);
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function renderPipelineChart(stages) {
    const ctx = document.getElementById('pipelineChart');
    if (!ctx) {
        console.warn('Elemento pipelineChart não encontrado');
        return;
    }
    
    if (!Array.isArray(stages)) {
        console.error('Stages não é um array:', stages);
        return;
    }
    
    if (stages.length === 0) {
        console.warn('Nenhuma stage para renderizar');
        return;
    }
    
    console.log('Renderizando chart com stages:', stages);
    
    if (pipelineChart) {
        pipelineChart.destroy();
    }
    
    try {
        pipelineChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stages.map(s => s.name),
                datasets: [{
                    label: 'Valor Total (R$)',
                    data: stages.map(s => parseFloat(s.total_value || 0)),
                    backgroundColor: stages.map(s => s.color || '#3b82f6'),
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => 'R$ ' + value.toFixed(0)
                        }
                    }
                }
            }
        });
        console.log('Pipeline chart renderizado com sucesso');
    } catch (error) {
        console.error('Erro ao renderizar pipeline chart:', error);
    }
}

function renderLostReasonsChart(reasons) {
    const ctx = document.getElementById('lostReasonsChart');
    if (!ctx) {
        console.warn('Elemento lostReasonsChart não encontrado');
        return;
    }
    
    if (!Array.isArray(reasons)) {
        console.error('Reasons não é um array:', reasons);
        return;
    }
    
    if (reasons.length === 0) {
        console.warn('Nenhum motivo de perda para renderizar');
        // Mostrar mensagem "Sem dados"
        ctx.parentElement.innerHTML = '<div style="text-align: center; padding: 40px; color: #9ca3af;">Nenhum lead perdido ainda</div>';
        return;
    }
    
    if (lostReasonsChart) {
        lostReasonsChart.destroy();
    }
    
    try {
        const labels = reasons.map(r => r.reason || 'Não informado');
        const data = reasons.map(r => r.count);
        
        lostReasonsChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
        console.log('Lost reasons chart renderizado com sucesso');
    } catch (error) {
        console.error('Erro ao renderizar lost reasons chart:', error);
    }
}

function renderSellerRanking(sellers) {
    const tbody = document.getElementById('ranking-table-body');
    if (!tbody) return;
    
    if (sellers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #9ca3af;">Nenhum dado disponível</td></tr>';
        return;
    }
    
    const maxRevenue = Math.max(...sellers.map(s => parseFloat(s.total_revenue || 0)));
    const maxConversion = Math.max(...sellers.map(s => parseFloat(s.conversion_rate || 0)));
    
    tbody.innerHTML = sellers.map((seller, index) => {
        const position = index + 1;
        let badge = '';
        
        if (parseFloat(seller.total_revenue) === maxRevenue && maxRevenue > 0) {
            badge += '<span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">👑 Alpha</span> ';
        }
        if (parseFloat(seller.conversion_rate) === maxConversion && maxConversion > 0) {
            badge += '<span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">🎯 Sniper</span>';
        }
        
        return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px; font-weight: 700;">${position}°</td>
                <td style="padding: 12px; font-weight: 600;">${seller.name}</td>
                <td style="padding: 12px;">${seller.total_leads} leads</td>
                <td style="padding: 12px; color: ${seller.conversion_rate > 50 ? '#10b981' : '#6b7280'}; font-weight: 600;">
                    ${parseFloat(seller.conversion_rate || 0).toFixed(1)}%
                </td>
                <td style="padding: 12px; color: #10b981; font-weight: 700;">
                    ${formatCurrency(seller.total_revenue)}
                </td>
                <td style="padding: 12px; font-weight: 600;">
                    ${formatCurrency(parseFloat(seller.total_revenue || 0) * 0.1)}
                </td>
                <td style="padding: 12px;">${badge}</td>
            </tr>
        `;
    }).join('');
}

window.exportCRMLeads = function() {
    window.location.href = '/api/crm/export';
}

// Inicializar CRM quando a seção for aberta
const originalShowDashboardSection = window.showDashboardSection;
window.showDashboardSection = function(section, event) {
    originalShowDashboardSection(section, event);
    
    if (section === 'crm') {
        connectCRMSocket();
        window.loadKanbanBoard();
    }
}
