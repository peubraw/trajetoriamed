// Script de Diagnóstico da Meta WhatsApp Business API
const axios = require('axios');
require('dotenv').config();

const config = {
    phoneNumberId: process.env.META_PHONE_NUMBER_ID,
    accessToken: process.env.META_ACCESS_TOKEN,
    wabaId: process.env.META_WABA_ID,
    appId: process.env.META_APP_ID,
    apiVersion: 'v21.0'
};

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║    DIAGNÓSTICO META WHATSAPP BUSINESS API - WABA_Mia          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

async function runDiagnostics() {
    let allTestsPassed = true;

    // ============================================
    // 1. VERIFICAR CONFIGURAÇÕES
    // ============================================
    console.log('📋 1. VERIFICANDO CONFIGURAÇÕES\n');
    console.log(`   App ID: ${config.appId || '❌ NÃO CONFIGURADO'}`);
    console.log(`   WABA ID: ${config.wabaId || '❌ NÃO CONFIGURADO'}`);
    console.log(`   Phone Number ID: ${config.phoneNumberId || '❌ NÃO CONFIGURADO'}`);
    console.log(`   Access Token: ${config.accessToken ? config.accessToken.substring(0, 20) + '...' : '❌ NÃO CONFIGURADO'}`);

    if (!config.phoneNumberId || !config.accessToken || !config.wabaId) {
        console.log('\n❌ ERRO: Configurações incompletas no arquivo .env\n');
        allTestsPassed = false;
        return;
    }
    console.log('\n✅ Configurações encontradas\n');

    // ============================================
    // 2. TESTAR CONECTIVIDADE COM A API
    // ============================================
    console.log('🌐 2. TESTANDO CONECTIVIDADE COM A API\n');
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                },
                params: {
                    fields: 'id,verified_name,code_verification_status,display_phone_number,quality_rating,messaging_limit_tier'
                }
            }
        );

        console.log('✅ Conectado com sucesso à Meta API!\n');
        console.log('📱 Informações do Número:');
        console.log(`   ID: ${response.data.id}`);
        console.log(`   Nome Verificado: ${response.data.verified_name || 'Não verificado'}`);
        console.log(`   Número: ${response.data.display_phone_number || 'N/A'}`);
        console.log(`   Status de Verificação: ${response.data.code_verification_status || 'N/A'}`);
        console.log(`   Quality Rating: ${response.data.quality_rating || 'N/A'}`);
        console.log(`   Limite de Mensagens: ${response.data.messaging_limit_tier || 'N/A'}\n`);
    } catch (error) {
        console.log('❌ ERRO ao conectar com a API\n');
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Mensagem: ${error.response?.data?.error?.message || error.message}`);
        console.log(`   Tipo: ${error.response?.data?.error?.type || 'Desconhecido'}\n`);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('💡 DICA: Token de acesso inválido ou expirado');
            console.log('   1. Verifique se o token está correto');
            console.log('   2. Gere um novo token em developers.facebook.com');
            console.log('   3. Certifique-se de que o token tem as permissões necessárias\n');
        }
        allTestsPassed = false;
        return;
    }

    // ============================================
    // 3. VERIFICAR PERMISSÕES DO TOKEN
    // ============================================
    console.log('🔐 3. VERIFICANDO PERMISSÕES DO TOKEN\n');
    try {
        const debugResponse = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/debug_token`,
            {
                params: {
                    input_token: config.accessToken,
                    access_token: config.accessToken
                }
            }
        );

        const tokenData = debugResponse.data.data;
        console.log('✅ Token válido!\n');
        console.log('📊 Informações do Token:');
        console.log(`   App ID: ${tokenData.app_id}`);
        console.log(`   Tipo: ${tokenData.type}`);
        console.log(`   Válido: ${tokenData.is_valid ? 'Sim' : 'Não'}`);
        console.log(`   Expira: ${tokenData.expires_at ? new Date(tokenData.expires_at * 1000).toLocaleString('pt-BR') : 'Nunca (permanente)'}`);
        
        if (tokenData.scopes && tokenData.scopes.length > 0) {
            console.log(`   Permissões: ${tokenData.scopes.join(', ')}\n`);
        } else {
            console.log('   Permissões: Não disponível (pode ser token de sistema)\n');
        }

        // Verificar permissões essenciais
        const requiredScopes = ['whatsapp_business_messaging', 'whatsapp_business_management'];
        const hasScopes = tokenData.scopes || [];
        
        if (hasScopes.length > 0) {
            const missingScopes = requiredScopes.filter(scope => !hasScopes.includes(scope));
            if (missingScopes.length > 0) {
                console.log('⚠️  AVISO: Podem faltar permissões:');
                console.log(`   Faltando: ${missingScopes.join(', ')}\n`);
            }
        }
    } catch (error) {
        console.log('⚠️  Não foi possível verificar as permissões do token\n');
        console.log(`   Erro: ${error.response?.data?.error?.message || error.message}\n`);
    }

    // ============================================
    // 4. VERIFICAR WABA (WhatsApp Business Account)
    // ============================================
    console.log('🏢 4. VERIFICANDO CONTA WHATSAPP BUSINESS (WABA)\n');
    try {
        const wabaResponse = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                },
                params: {
                    fields: 'id,name,currency,timezone_id,message_template_namespace'
                }
            }
        );

        console.log('✅ WABA acessível!\n');
        console.log('📋 Informações da Conta:');
        console.log(`   ID: ${wabaResponse.data.id}`);
        console.log(`   Nome: ${wabaResponse.data.name || 'N/A'}`);
        console.log(`   Moeda: ${wabaResponse.data.currency || 'N/A'}`);
        console.log(`   Fuso Horário: ${wabaResponse.data.timezone_id || 'N/A'}\n`);
    } catch (error) {
        console.log('❌ ERRO ao acessar WABA\n');
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Mensagem: ${error.response?.data?.error?.message || error.message}\n`);
        allTestsPassed = false;
    }

    // ============================================
    // 5. LISTAR TEMPLATES APROVADOS
    // ============================================
    console.log('📨 5. VERIFICANDO TEMPLATES DE MENSAGEM\n');
    try {
        const templatesResponse = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                },
                params: {
                    limit: 10
                }
            }
        );

        const templates = templatesResponse.data.data || [];
        console.log(`✅ ${templates.length} template(s) encontrado(s)\n`);
        
        if (templates.length > 0) {
            console.log('📋 Templates Disponíveis:');
            templates.forEach((template, index) => {
                console.log(`   ${index + 1}. ${template.name} - Status: ${template.status} - Idioma: ${template.language}`);
            });
            console.log('');
        } else {
            console.log('⚠️  Nenhum template aprovado encontrado');
            console.log('💡 DICA: Para enviar mensagens iniciadas pelo sistema, você precisa criar templates em:');
            console.log('   https://business.facebook.com/wa/manage/message-templates/\n');
        }
    } catch (error) {
        console.log('⚠️  Não foi possível listar templates\n');
        console.log(`   Erro: ${error.response?.data?.error?.message || error.message}\n`);
    }

    // ============================================
    // 6. TESTE DE ENVIO (SIMULADO)
    // ============================================
    console.log('📤 6. VERIFICANDO CAPACIDADE DE ENVIO\n');
    console.log('ℹ️  Para testar o envio real de mensagens, use o comando:');
    console.log('   node test-meta-send.js\n');

    // ============================================
    // RESUMO FINAL
    // ============================================
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      RESUMO DO DIAGNÓSTICO                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    if (allTestsPassed) {
        console.log('✅ TODOS OS TESTES PASSARAM!\n');
        console.log('🎉 Sua API do WhatsApp está configurada corretamente!\n');
        console.log('📝 PRÓXIMOS PASSOS:');
        console.log('   1. Teste o envio de mensagem: node test-meta-send.js');
        console.log('   2. Configure o webhook no Facebook Developers');
        console.log('   3. Inicie o servidor: npm start\n');
    } else {
        console.log('❌ ALGUNS TESTES FALHARAM\n');
        console.log('Por favor, revise os erros acima e corrija as configurações.\n');
    }
}

// Executar diagnóstico
runDiagnostics().catch(error => {
    console.error('\n💥 ERRO FATAL:', error.message);
    process.exit(1);
});
