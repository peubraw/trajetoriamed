// Script Node.js para atualizar prompt no banco
const fs = require('fs');
const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'localhost',
    user: 'wppbot',
    password: 'wppbot@2025',
    database: 'wppbot_saas'
};

const USER_EMAIL = 'leandro.berti@gmail.com';
const PROMPT_FILE = '/var/www/wppbot/prompt-templates/MASTER-Bot-Trajetoria-Med-UNIFIED.txt';

async function updatePrompt() {
    try {
        // Ler arquivo do prompt
        console.log('[1/4] Lendo arquivo do prompt...');
        const promptContent = fs.readFileSync(PROMPT_FILE, 'utf8');
        console.log(`[OK] Arquivo lido: ${promptContent.length} caracteres`);
        
        // Conectar ao banco
        console.log('[2/4] Conectando ao banco...');
        const connection = await mysql.createConnection(DB_CONFIG);
        console.log('[OK] Conectado');
        
        // Buscar usuário
        console.log(`[3/4] Buscando usuário: ${USER_EMAIL}`);
        const [users] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [USER_EMAIL]
        );
        
        if (users.length === 0) {
            console.error('[ERRO] Usuário não encontrado');
            await connection.end();
            process.exit(1);
        }
        
        const userId = users[0].id;
        console.log(`[OK] Usuário encontrado: ID ${userId}`);
        
        // Atualizar prompt
        console.log('[4/4] Atualizando prompt no banco...');
        await connection.execute(
            'UPDATE bot_configs SET system_prompt = ?, updated_at = NOW() WHERE user_id = ?',
            [promptContent, userId]
        );
        
        // Verificar atualização
        const [configs] = await connection.execute(
            'SELECT bot_name, LENGTH(system_prompt) as prompt_size, updated_at FROM bot_configs WHERE user_id = ?',
            [userId]
        );
        
        if (configs.length > 0) {
            const { bot_name, prompt_size, updated_at } = configs[0];
            console.log('\n' + '='.repeat(50));
            console.log('✅ PROMPT ATUALIZADO COM SUCESSO!');
            console.log('='.repeat(50));
            console.log(`Bot: ${bot_name}`);
            console.log(`Tamanho do prompt: ${prompt_size} caracteres`);
            console.log(`Atualizado em: ${updated_at}`);
            console.log('='.repeat(50));
        }
        
        await connection.end();
        process.exit(0);
        
    } catch (error) {
        console.error('[ERRO]', error.message);
        process.exit(1);
    }
}

updatePrompt();
