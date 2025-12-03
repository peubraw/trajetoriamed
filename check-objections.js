const pool = require('./config/database');

async function checkObjections() {
    const [rows] = await pool.query('SELECT courses_config FROM bot_configs WHERE id=1');
    const config = typeof rows[0].courses_config === 'string' 
        ? JSON.parse(rows[0].courses_config) 
        : rows[0].courses_config;
    
    console.log('📊 VERIFICAÇÃO DAS OBJEÇÕES:\n');
    
    // Verificar objeções globais
    console.log('🌐 Objeções Globais:');
    if (config.global_objections) {
        console.log('  ✅ global_objections encontrado');
        console.log('    - price:', config.global_objections.price ? 'SIM' : 'NÃO');
        console.log('    - time:', config.global_objections.time ? 'SIM' : 'NÃO');
        console.log('    - alone:', config.global_objections.alone ? 'SIM' : 'NÃO');
        console.log('    - think:', config.global_objections.think ? 'SIM' : 'NÃO');
        console.log('    - final:', config.global_objections.final ? 'SIM' : 'NÃO');
    }
    
    if (config.objections) {
        console.log('  ✅ objections encontrado (legacy)');
        console.log('    - price:', config.objections.price ? 'SIM' : 'NÃO');
        console.log('    - time:', config.objections.time ? 'SIM' : 'NÃO');
        console.log('    - alone:', config.objections.alone ? 'SIM' : 'NÃO');
        console.log('    - think:', config.objections.think ? 'SIM' : 'NÃO');
        console.log('    - final:', config.objections.final ? 'SIM' : 'NÃO');
    }
    
    console.log('\n📚 Objeções por Curso:');
    config.courses.forEach((course, index) => {
        const hasObjections = course.objections && 
            (course.objections.expensive || 
             course.objections.no_time || 
             course.objections.alone || 
             course.objections.think || 
             course.objections.final);
        
        const status = hasObjections ? '✅' : '❌';
        console.log(`${status} ${index + 1}. ${course.name}`);
        
        if (hasObjections) {
            console.log(`    - expensive: ${course.objections.expensive ? course.objections.expensive.substring(0, 50) + '...' : 'NÃO'}`);
            console.log(`    - no_time: ${course.objections.no_time ? course.objections.no_time.substring(0, 50) + '...' : 'NÃO'}`);
            console.log(`    - alone: ${course.objections.alone ? course.objections.alone.substring(0, 50) + '...' : 'NÃO'}`);
            console.log(`    - think: ${course.objections.think ? course.objections.think.substring(0, 50) + '...' : 'NÃO'}`);
            console.log(`    - final: ${course.objections.final ? course.objections.final.substring(0, 50) + '...' : 'NÃO'}`);
        }
    });
    
    process.exit(0);
}

checkObjections().catch(console.error);
