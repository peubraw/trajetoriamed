const db = require('./config/database');

(async () => {
    try {
        const [rows] = await db.execute('SELECT courses_config FROM bot_configs WHERE id = 1');
        const configStr = typeof rows[0].courses_config === 'string' 
            ? rows[0].courses_config 
            : JSON.stringify(rows[0].courses_config);
        const config = JSON.parse(configStr);
        
        console.log('\n=== LINKS DE TODOS OS CURSOS ===\n');
        
        config.courses.forEach(course => {
            console.log(`${course.id.toUpperCase()}:`);
            console.log(`  Nome: ${course.name}`);
            console.log(`  Link NEW: ${course.payment_link_new}`);
            console.log(`  Link ALUMNI: ${course.payment_link_alumni}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('Erro:', error);
    }
    process.exit(0);
})();
