const pool = require('./config/database');

async function checkFlows() {
    const [rows] = await pool.query('SELECT courses_config FROM bot_configs WHERE id=1');
    const config = typeof rows[0].courses_config === 'string' 
        ? JSON.parse(rows[0].courses_config) 
        : rows[0].courses_config;
    
    console.log('📊 VERIFICAÇÃO DOS FLUXOS:\n');
    config.courses.forEach((course, index) => {
        const flowLength = course.flow_instructions ? course.flow_instructions.length : 0;
        const status = flowLength > 100 ? '✅' : '❌';
        console.log(`${status} ${index + 1}. ${course.name}: ${flowLength} caracteres`);
    });
    
    process.exit(0);
}

checkFlows();
