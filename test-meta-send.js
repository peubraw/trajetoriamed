// Script de teste para envio via Meta API
const metaWhatsAppService = require('./services/meta-whatsapp.service');
require('dotenv').config();

async function testMetaSend() {
    try {
        console.log('📤 Enviando mensagem de teste...');
        console.log('   Para: 5584996464766');
        console.log('   Via: Meta WhatsApp Business API');
        
        const result = await metaWhatsAppService.sendTextMessage(
            '5584996464766',
            '🎉 Teste da Meta WhatsApp Business API!\n\nSistema TrajetóriaMed funcionando perfeitamente com a API oficial da Meta.\n\n✅ Webhook configurado\n✅ Mensagens sendo enviadas\n✅ Sistema 100% operacional'
        );
        
        console.log('\n✅ Mensagem enviada com sucesso!');
        console.log('📱 Message ID:', result.messages[0].id);
        console.log('📊 Status:', result.messaging_product);
        console.log('\n🔗 Detalhes completos:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('\n❌ Erro ao enviar mensagem:');
        console.error('   Status:', error.response?.status);
        console.error('   Erro:', error.response?.data || error.message);
    }
}

testMetaSend();
