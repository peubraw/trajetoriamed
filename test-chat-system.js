// ================================================
// TESTE DO SISTEMA DE CHAT WHATSAPP
// Execute: node test-chat-system.js
// ================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testChatSystem() {
    console.log('\n🧪 INICIANDO TESTES DO SISTEMA DE CHAT...\n');
    
    let connection;
    
    try {
        // 1. Testar conexão com banco de dados
        console.log('📊 1. Testando conexão com banco de dados...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'wppbot_saas'
        });
        console.log('   ✅ Conexão estabelecida com sucesso!\n');

        // 2. Verificar tabelas do chat
        console.log('📋 2. Verificando tabelas do chat...');
        const [tables] = await connection.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'crm_chat%'
        `, [process.env.DB_NAME || 'wppbot_saas']);
        
        const expectedTables = ['crm_chat_messages', 'crm_conversations', 'crm_chat_typing'];
        const foundTables = tables.map(t => t.TABLE_NAME);
        
        expectedTables.forEach(table => {
            if (foundTables.includes(table)) {
                console.log(`   ✅ Tabela ${table} encontrada`);
            } else {
                console.log(`   ❌ Tabela ${table} NÃO encontrada!`);
            }
        });
        console.log('');

        // 3. Verificar views
        console.log('👁️ 3. Verificando views...');
        const [views] = await connection.query(`
            SELECT TABLE_NAME 
            FROM information_schema.VIEWS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'vw_chat%'
        `, [process.env.DB_NAME || 'wppbot_saas']);
        
        const expectedViews = ['vw_chat_messages_full', 'vw_conversations_full'];
        const foundViews = views.map(v => v.TABLE_NAME);
        
        expectedViews.forEach(view => {
            if (foundViews.includes(view)) {
                console.log(`   ✅ View ${view} encontrada`);
            } else {
                console.log(`   ❌ View ${view} NÃO encontrada!`);
            }
        });
        console.log('');

        // 4. Testar inserção de mensagem de teste
        console.log('💬 4. Testando inserção de mensagem...');
        try {
            // Buscar primeiro usuário
            const [users] = await connection.query('SELECT id FROM users LIMIT 1');
            if (users.length === 0) {
                console.log('   ⚠️ Nenhum usuário encontrado no sistema');
            } else {
                const userId = users[0].id;
                const testPhone = '5511999999999';
                
                // Inserir mensagem de teste
                await connection.query(`
                    INSERT INTO crm_chat_messages 
                    (user_id, phone, message_type, message_content, direction, sender_type, status)
                    VALUES (?, ?, 'text', 'Mensagem de teste do sistema', 'inbound', 'lead', 'delivered')
                `, [userId, testPhone]);
                
                console.log('   ✅ Mensagem de teste inserida com sucesso!');
                
                // Verificar se foi criada conversa automaticamente via trigger/service
                const [conversations] = await connection.query(
                    'SELECT * FROM crm_conversations WHERE user_id = ? AND phone = ?',
                    [userId, testPhone]
                );
                
                if (conversations.length > 0) {
                    console.log('   ✅ Conversa criada automaticamente');
                } else {
                    console.log('   ⚠️ Conversa não foi criada (isso é esperado sem o service rodando)');
                }
                
                // Limpar teste
                await connection.query('DELETE FROM crm_chat_messages WHERE phone = ?', [testPhone]);
                await connection.query('DELETE FROM crm_conversations WHERE phone = ?', [testPhone]);
                console.log('   ✅ Dados de teste removidos');
            }
        } catch (error) {
            console.log('   ❌ Erro ao testar inserção:', error.message);
        }
        console.log('');

        // 5. Verificar arquivos do sistema
        console.log('📁 5. Verificando arquivos do sistema...');
        const fs = require('fs');
        const files = [
            'routes/chat.routes.js',
            'services/chat.service.js',
            'public/crm-chat.html',
            'database/chat-schema.sql',
            'database/install-chat.sql'
        ];
        
        files.forEach(file => {
            if (fs.existsSync(file)) {
                console.log(`   ✅ ${file}`);
            } else {
                console.log(`   ❌ ${file} NÃO encontrado!`);
            }
        });
        console.log('');

        // 6. Verificar rotas no server.js
        console.log('🛣️ 6. Verificando rotas no server.js...');
        const serverContent = fs.readFileSync('server.js', 'utf8');
        
        if (serverContent.includes("require('./routes/chat.routes')")) {
            console.log('   ✅ Rota do chat configurada no server.js');
        } else {
            console.log('   ❌ Rota do chat NÃO encontrada no server.js!');
        }
        
        if (serverContent.includes('join-room') || serverContent.includes('join-conversation')) {
            console.log('   ✅ Eventos Socket.IO configurados');
        } else {
            console.log('   ⚠️ Eventos Socket.IO podem não estar configurados');
        }
        console.log('');

        // 7. Estatísticas
        console.log('📊 7. Estatísticas do banco...');
        const [msgCount] = await connection.query('SELECT COUNT(*) as total FROM crm_chat_messages');
        const [convCount] = await connection.query('SELECT COUNT(*) as total FROM crm_conversations');
        
        console.log(`   📨 Total de mensagens: ${msgCount[0].total}`);
        console.log(`   💬 Total de conversas: ${convCount[0].total}`);
        console.log('');

        // RESULTADO FINAL
        console.log('═══════════════════════════════════════════');
        console.log('✅ TODOS OS TESTES CONCLUÍDOS!');
        console.log('═══════════════════════════════════════════');
        console.log('\n📝 Próximos Passos:');
        console.log('1. Inicie o servidor: node server.js');
        console.log('2. Acesse: http://localhost:3000/crm-chat.html');
        console.log('3. Faça login no sistema');
        console.log('4. Comece a conversar com seus leads!\n');

    } catch (error) {
        console.error('❌ ERRO DURANTE OS TESTES:', error.message);
        console.error('\n📝 Solução:');
        console.error('1. Verifique se o MySQL está rodando');
        console.error('2. Verifique as credenciais no arquivo .env');
        console.error('3. Execute o script de instalação: database/install-chat.sql\n');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Executar testes
testChatSystem();
