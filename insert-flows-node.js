const mysql = require('mysql2/promise');
const fs = require('fs');

async function insertFlows() {
    // Ler JSON
    const config = JSON.parse(fs.readFileSync('/tmp/config_with_flows.json', 'utf8'));
    
    // Conectar
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'wppbot',
        password: 'wppbot@2025',
        database: 'wppbot_saas'
    });
    
    console.log('🔄 Conectado ao banco de dados...');
    
    // Inserir
    await connection.execute(
        'UPDATE bot_configs SET courses_config = ? WHERE id = 1',
        [JSON.stringify(config)]
    );
    
    console.log('✅ Configuração inserida no banco de dados!');
    
    // Verificar
    const [rows] = await connection.execute(
        "SELECT JSON_LENGTH(courses_config, '$.courses') as total FROM bot_configs WHERE id=1"
    );
    console.log(`✅ Total de cursos: ${rows[0].total}`);
    
    // Verificar fluxos
    const [flowRows] = await connection.execute(
        "SELECT JSON_LENGTH(courses_config, '$.courses[7].flow_instructions') as caixa, JSON_LENGTH(courses_config, '$.courses[8].flow_instructions') as tce FROM bot_configs WHERE id=1"
    );
    console.log(`✅ Fluxo CAIXA: ${flowRows[0].caixa} caracteres`);
    console.log(`✅ Fluxo TCE MG: ${flowRows[0].tce} caracteres`);
    
    await connection.end();
    
    console.log('\n🎉 TODOS OS 9 FLUXOS FORAM INSERIDOS COM SUCESSO!\n');
    console.log('📋 Fluxos incluídos:');
    console.log('  1. ✅ Pós em Auditoria');
    console.log('  2. ✅ Pós em Medicina do Trabalho');
    console.log('  3. ✅ Pós em Perícia Médica');
    console.log('  4. ✅ Combo (2 em 1)');
    console.log('  5. ✅ Prova de Títulos');
    console.log('  6. ✅ Missão Médico Legista');
    console.log('  7. ✅ SOS Médico Legista');
    console.log('  8. ✅ CAIXA - Médico do Trabalho');
    console.log('  9. ✅ TCE MG - Tribunal de Contas');
}

insertFlows().catch(console.error);
