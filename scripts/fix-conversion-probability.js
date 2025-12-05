const db = require('../config/database');

async function fixConversionProbability() {
    try {
        // Atualizar conversion_probability com valores padrão
        await db.query(`
            UPDATE crm_stages SET conversion_probability = 
            CASE name
                WHEN '🎯 Triagem' THEN 10
                WHEN '🥗 Nutrição' THEN 20
                WHEN '🔗 Link Enviado' THEN 40
                WHEN '💰 Negociação' THEN 60
                WHEN '⏳ Aguardando' THEN 80
                WHEN '✅ Confirmada' THEN 0
                WHEN '❌ Perdido' THEN 0
                ELSE 50
            END
            WHERE user_id = 1
        `);

        // Verificar o resultado
        const [stages] = await db.query(`
            SELECT id, name, conversion_probability, is_success, is_lost 
            FROM crm_stages 
            WHERE user_id=1 
            ORDER BY position
        `);

        console.log('✅ Stages atualizadas:');
        console.table(stages);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

fixConversionProbability();
