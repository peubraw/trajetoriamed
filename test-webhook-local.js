// Teste de webhook - Simular envio da Meta para verificar se está funcionando
const axios = require('axios');

const webhookUrl = 'http://localhost:3001/api/meta/webhook';

const testMessage = {
    "object": "whatsapp_business_account",
    "entry": [{
        "id": "4211071149107697",
        "changes": [{
            "value": {
                "messaging_product": "whatsapp",
                "metadata": {
                    "display_phone_number": "5561999033732",
                    "phone_number_id": "858789420659191"
                },
                "contacts": [{
                    "profile": {
                        "name": "Pedro Teste"
                    },
                    "wa_id": "558496464766"
                }],
                "messages": [{
                    "from": "558496464766",
                    "id": "wamid.TEST123",
                    "timestamp": Math.floor(Date.now() / 1000).toString(),
                    "text": {
                        "body": "Teste de webhook local"
                    },
                    "type": "text"
                }]
            },
            "field": "messages"
        }]
    }]
};

async function testWebhook() {
    console.log('🧪 Testando webhook localmente...\n');
    console.log('📦 Payload:');
    console.log(JSON.stringify(testMessage, null, 2));
    console.log('');

    try {
        const response = await axios.post(webhookUrl, testMessage, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Resposta do webhook:', response.status);
        console.log('📝 Agora verifique os logs do PM2 para ver se processou a mensagem');
    } catch (error) {
        console.error('❌ Erro ao chamar webhook:');
        console.error('   Status:', error.response?.status);
        console.error('   Dados:', error.response?.data);
    }
}

testWebhook();
