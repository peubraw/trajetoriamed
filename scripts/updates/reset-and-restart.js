// Script para resetar conversas e reiniciar sistema
const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const DB_CONFIG = {
    host: 'localhost',
    user: 'wppbot',
    password: 'wppbot@2025',
    database: 'wppbot_saas'
};

const USER_EMAIL = 'leandro.berti@gmail.com';

async function resetAndRestart() {
    try {
        console.log('='.repeat(50));
        console.log('RESET E REINICIALIZAÇÃO DO SISTEMA');
        console.log('='.repeat(50));
        
        // Conectar ao banco
        console.log('\n[1/4] Conectando ao banco...');
        const connection = await mysql.createConnection(DB_CONFIG);
        console.log('[OK] Conectado');
        
        // Buscar usuário
        console.log(`[2/4] Buscando usuário: ${USER_EMAIL}`);
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
        
        // Reset das conversas
        console.log('[3/4] Resetando conversas...');
        
        // Deletar mensagens
        const [msgResult] = await connection.execute(
            'DELETE FROM messages WHERE user_id = ?',
            [userId]
        );
        console.log(`  - Mensagens deletadas: ${msgResult.affectedRows}`);
        
        // Deletar estatísticas
        const [statsResult] = await connection.execute(
            'DELETE FROM statistics WHERE user_id = ?',
            [userId]
        );
        console.log(`  - Estatísticas deletadas: ${statsResult.affectedRows}`);
        
        // Resetar sessão WhatsApp
        const [sessionResult] = await connection.execute(
            'UPDATE whatsapp_sessions SET status = ?, qr_code = NULL, phone_number = NULL WHERE user_id = ?',
            ['disconnected', userId]
        );
        console.log(`  - Sessão WhatsApp resetada: ${sessionResult.affectedRows}`);
        
        await connection.end();
        console.log('[OK] Reset no banco concluído');
        
        // Limpar arquivos de sessão
        console.log('\n[4/4] Limpando arquivos de sessão...');
        try {
            await execPromise('rm -rf tokens/session_1/*');
            console.log('[OK] Arquivos de sessão removidos');
        } catch (error) {
            console.log('[AVISO] Não há arquivos de sessão para remover');
        }
        
        // Reiniciar PM2
        console.log('\n[PM2] Reiniciando aplicação...');
        const { stdout } = await execPromise('pm2 restart wppbot');
        console.log(stdout);
        
        // Status final
        console.log('\n' + '='.repeat(50));
        console.log('✅ RESET E REINICIALIZAÇÃO CONCLUÍDOS!');
        console.log('='.repeat(50));
        console.log('\n📊 RESUMO:');
        console.log(`  - Usuário: ${USER_EMAIL}`);
        console.log('  - Mensagens: RESETADAS');
        console.log('  - Estatísticas: RESETADAS');
        console.log('  - Sessão WhatsApp: DESCONECTADA');
        console.log('  - Aplicação: REINICIADA');
        console.log('\n📱 PRÓXIMOS PASSOS:');
        console.log('  1. Acesse: http://165.22.158.58');
        console.log('  2. Faça login com: leandro.berti@gmail.com');
        console.log('  3. Conecte o WhatsApp (novo QR Code)');
        console.log('  4. Teste o bot com mensagens');
        console.log('\n' + '='.repeat(50));
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n[ERRO]', error.message);
        process.exit(1);
    }
}

resetAndRestart();
