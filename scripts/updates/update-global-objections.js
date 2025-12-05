const pool = require('./config/database');

async function updateGlobalObjections() {
    const [rows] = await pool.query('SELECT courses_config FROM bot_configs WHERE id=1');
    const config = typeof rows[0].courses_config === 'string' 
        ? JSON.parse(rows[0].courses_config) 
        : rows[0].courses_config;
    
    console.log('🔄 Atualizando objeções globais...\n');
    
    // Objeções globais (usadas como fallback quando não há objeção específica do curso)
    config.global_objections = {
        price: 'Dr(a), o salário inicial é +12k com benefícios. O valor do curso é menor que um único plantão de 24h. É um investimento para Sair dos plantões, não um custo.',
        time: 'Dr(a), o curso foi feito para quem dá plantão. As aulas são curtas, temos mapas mentais e cronograma para 1h a 2h por dia. Você precisa de direção, não de tempo sobrando.',
        alone: 'O problema é filtrar o que estudar. Sozinho você perde tempo. A banca tem estilo próprio e nós entregamos tudo mastigado, focado exatamente no que cai.',
        think: 'Claro, Dr(a)! Mas lembre-se que as inscrições são até [DATA] e quanto antes começar, mais preparado estará.',
        final: 'Entendo perfeitamente, Dr(a). Ficamos à disposição para qualquer dúvida. A Trajetória Med está aqui quando você decidir dar esse passo importante na sua carreira. Muito sucesso! 🎓'
    };
    
    // Manter compatibilidade com campo "objections" também
    if (!config.objections) {
        config.objections = config.global_objections;
    }
    
    // Salvar no banco
    await pool.query(
        'UPDATE bot_configs SET courses_config = ? WHERE id = 1',
        [JSON.stringify(config)]
    );
    
    console.log('✅ Objeções globais atualizadas com sucesso!\n');
    console.log('📋 Objeções configuradas:');
    console.log('  ✅ "Está caro" (price)');
    console.log('  ✅ "Não tenho tempo" (time)');
    console.log('  ✅ "Vou estudar sozinho" (alone)');
    console.log('  ✅ "Preciso pensar" (think)');
    console.log('  ✅ Rejeição final (final)');
    console.log('\n💡 Estas objeções serão usadas como fallback quando o curso não tiver objeção específica.');
    
    process.exit(0);
}

updateGlobalObjections().catch(console.error);
