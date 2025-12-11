// Script de teste de envio com debug detalhado
const axios = require('axios');
require('dotenv').config();

const config = {
    phoneNumberId: process.env.META_PHONE_NUMBER_ID,
    accessToken: process.env.META_ACCESS_TOKEN,
    apiVersion: 'v21.0'
};

async function testSendWithDebug() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         TESTE DE ENVIO COM DEBUG - META WHATSAPP API          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Testar diferentes formatos de número
    const phoneNumbers = [
        '558496464766',     // Com código do país
        '5561999033732',    // Número verificado da conta
        '61999033732',      // Sem 55
        '+558496464766'     // Com +
    ];

    console.log('📋 Números que vamos testar:\n');
    phoneNumbers.forEach((phone, index) => {
        console.log(`   ${index + 1}. ${phone}`);
    });
    console.log('');

    // Teste 1: Verificar o número registrado
    console.log('📱 1. VERIFICANDO NÚMERO REGISTRADO NA CONTA\n');
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                },
                params: {
                    fields: 'display_phone_number,verified_name'
                }
            }
        );

        console.log(`✅ Número registrado: ${response.data.display_phone_number}`);
        console.log(`   Nome: ${response.data.verified_name}\n`);
    } catch (error) {
        console.log('❌ Erro ao verificar número registrado\n');
    }

    // Teste 2: Tentar enviar para o primeiro número
    console.log('📤 2. TENTANDO ENVIAR MENSAGEM PARA 558496464766\n');
    
    const targetPhone = '558496464766';
    
    try {
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: targetPhone,
            type: 'text',
            text: { 
                body: `🧪 TESTE ${new Date().toLocaleTimeString('pt-BR')}\n\nSe você recebeu esta mensagem, a API está funcionando!\n\nEnviado via Meta WhatsApp Business API.` 
            }
        };

        console.log('📦 Payload enviado:');
        console.log(JSON.stringify(payload, null, 2));
        console.log('');

        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ MENSAGEM ENVIADA COM SUCESSO!\n');
        console.log('📊 Resposta da API:');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('');
        console.log(`📱 Message ID: ${response.data.messages[0].id}`);
        console.log(`📞 WA ID do destinatário: ${response.data.contacts[0].wa_id}`);
        console.log('');

        // Verificar status da mensagem
        console.log('🔍 3. VERIFICANDO STATUS DA MENSAGEM\n');
        
        const messageId = response.data.messages[0].id;
        
        console.log('⚠️  IMPORTANTE: A API do WhatsApp não permite consultar status de mensagens diretamente.');
        console.log('   O status é enviado via webhook quando a mensagem é:');
        console.log('   - sent (enviada)');
        console.log('   - delivered (entregue)');
        console.log('   - read (lida)');
        console.log('   - failed (falhou)\n');

        // Verificar possíveis problemas
        console.log('🔍 4. POSSÍVEIS RAZÕES PARA NÃO RECEBER A MENSAGEM\n');
        console.log('   ✓ A mensagem foi enviada pela API (confirmado acima)');
        console.log('');
        console.log('   Verifique se:');
        console.log('   1. ❓ O número 8496464766 está correto?');
        console.log('   2. ❓ O WhatsApp deste número está ativo?');
        console.log('   3. ❓ Este número já teve alguma conversa com +55 61 9903-3732?');
        console.log('   4. ❓ A mensagem pode estar em "Spam" ou "Solicitações"?');
        console.log('   5. ❓ O número bloqueou mensagens de empresas?\n');

        console.log('💡 IMPORTANTE - LIMITAÇÃO DA META API:');
        console.log('   Para INICIAR uma conversa, você PRECISA:');
        console.log('   a) Usar um template aprovado pela Meta, OU');
        console.log('   b) O usuário deve ter enviado uma mensagem primeiro (janela de 24h)\n');

        console.log('📝 SOLUÇÃO: Enviar via Template Aprovado\n');
        console.log('   Vou tentar enviar usando o template "hello_world" que está aprovado:\n');

        // Enviar via template
        const templatePayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: targetPhone,
            type: 'template',
            template: {
                name: 'hello_world',
                language: { code: 'en_US' }
            }
        };

        console.log('📦 Payload do Template:');
        console.log(JSON.stringify(templatePayload, null, 2));
        console.log('');

        const templateResponse = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            templatePayload,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ TEMPLATE ENVIADO COM SUCESSO!\n');
        console.log('📊 Resposta:');
        console.log(JSON.stringify(templateResponse.data, null, 2));
        console.log('');
        console.log('📱 Verifique seu WhatsApp agora!\n');

    } catch (error) {
        console.log('❌ ERRO AO ENVIAR MENSAGEM\n');
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Código: ${error.response?.data?.error?.code}`);
        console.log(`   Tipo: ${error.response?.data?.error?.error_subcode}`);
        console.log(`   Mensagem: ${error.response?.data?.error?.message}`);
        console.log('');
        
        if (error.response?.data?.error?.code === 131047) {
            console.log('💡 ERRO 131047: Você não pode iniciar uma conversa com este número!');
            console.log('');
            console.log('   SOLUÇÕES:');
            console.log('   1. Peça para o usuário enviar uma mensagem primeiro para +55 61 9903-3732');
            console.log('   2. Use um template aprovado pela Meta');
            console.log('   3. Crie templates em: https://business.facebook.com/wa/manage/message-templates/\n');
        }

        if (error.response?.data?.error?.error_data) {
            console.log('📋 Detalhes adicionais:');
            console.log(JSON.stringify(error.response.data.error.error_data, null, 2));
            console.log('');
        }
    }

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                            RESUMO                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log('Para receber mensagens, o número precisa:');
    console.log('1. Ter iniciado uma conversa com sua empresa (janela de 24h), OU');
    console.log('2. Receber um template aprovado pela Meta\n');
    console.log('🔗 Documentação: https://developers.facebook.com/docs/whatsapp/pricing\n');
}

testSendWithDebug().catch(error => {
    console.error('\n💥 ERRO FATAL:', error.message);
});
