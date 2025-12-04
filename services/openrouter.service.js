const axios = require('axios');

class OpenRouterService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseUrl = 'https://openrouter.ai/api/v1';
        // Usando modelo pago mais barato - Llama 3.1 8B ($0.06/M in, $0.06/M out)
        this.model = 'meta-llama/llama-3.1-8b-instruct';
    }

    async chat(messages, temperature = 0.7, maxTokens = 500) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: this.model,
                    messages: messages,
                    temperature: temperature,
                    max_tokens: maxTokens,
                    stream: false
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept-Encoding': 'gzip, deflate',
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'WPPBot SaaS'
                    },
                    timeout: 30000,
                    decompress: true
                }
            );

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Erro ao chamar OpenRouter:', error.response?.data || error.message);
            throw new Error('Erro ao processar mensagem com IA');
        }
    }

    async generatePrompt(userDescription) {
        const messages = [
            {
                role: 'system',
                content: `Você é um especialista em criar prompts para chatbots de atendimento. 
                Sua função é transformar uma descrição simples em um prompt completo e profissional 
                para um assistente de IA que atenderá clientes via WhatsApp. 
                
                O prompt deve incluir:
                1. Personalidade e tom de voz
                2. Instruções claras sobre como atender
                3. Limites e diretrizes
                4. Informações específicas do negócio
                
                Retorne APENAS o prompt final, sem explicações adicionais.`
            },
            {
                role: 'user',
                content: `Crie um prompt completo para um chatbot com base nesta descrição: ${userDescription}`
            }
        ];

        return await this.chat(messages, 0.8, 800);
    }

    async processMessage(systemPrompt, userMessage, conversationHistory = []) {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: userMessage }
        ];

        return await this.chat(messages, 0.3, 250);
    }
}

module.exports = new OpenRouterService();
