const pool = require('./config/database');

async function updateCoursesData() {
    const [rows] = await pool.query('SELECT courses_config FROM bot_configs WHERE id=1');
    const config = typeof rows[0].courses_config === 'string' 
        ? JSON.parse(rows[0].courses_config) 
        : rows[0].courses_config;
    
    console.log('🔄 Atualizando dados dos cursos...\n');
    
    // Atualizar cada curso
    config.courses.forEach(course => {
        switch(course.id) {
            case 'auditoria':
                course.installment = '12x de R$ 751,78';
                course.cash = 'R$ 7.269,00';
                course.coupon = 'BLACK NOVEMBER';
                course.payment_link_new = 'https://pay.kiwify.com.br/iu4JbKA';
                course.payment_link_alumni = 'https://pay.kiwify.com.br/T46pMDR';
                console.log('✅ Auditoria atualizada');
                break;
                
            case 'medicina':
                course.installment = '12x de R$ 751,78';
                course.cash = 'R$ 7.269,00';
                course.coupon = 'BLACK NOVEMBER';
                course.payment_link_new = 'https://pay.kiwify.com.br/oTf43cS';
                course.payment_link_alumni = 'https://pay.kiwify.com.br/jRxnIyC';
                console.log('✅ Medicina do Trabalho atualizada');
                break;
                
            case 'pericia':
                course.installment = '12x de R$ 751,78';
                course.cash = 'R$ 7.269,00';
                course.coupon = 'BLACK NOVEMBER';
                course.payment_link_new = 'https://pay.kiwify.com.br/YeI9SQP';
                course.payment_link_alumni = 'https://pay.kiwify.com.br/emzXXmz';
                console.log('✅ Perícia Médica atualizada');
                break;
                
            case 'combo':
                course.installment = '12x de R$ 952,80';
                course.cash = 'R$ 10.527,24';
                course.coupon = 'BLACK NOVEMBER';
                course.payment_link_new = 'https://pay.kiwify.com.br/7nox0Jl';
                course.payment_link_alumni = 'https://pay.kiwify.com.br/T46pMDR';
                console.log('✅ Combo atualizado');
                break;
                
            case 'provatitulos':
                // Mantém os valores atuais
                console.log('ℹ️  Prova de Títulos mantida (sem info fornecida)');
                break;
                
            case 'missao':
                course.installment = '12x de R$ 223,33';
                course.cash = 'R$ 2.159,40';
                course.coupon = 'TRAJETORIA40';
                course.payment_link_new = 'https://pay.kiwify.com.br/oYLSDRc';
                course.payment_link_alumni = 'https://pay.kiwify.com.br/oYLSDRc';
                console.log('✅ Missão atualizada');
                break;
                
            case 'sos':
                course.installment = '12x de R$ 49,33';
                course.cash = 'R$ 477,00';
                course.coupon = 'TRAJETORIA40';
                course.payment_link_new = 'https://pay.kiwify.com.br/qvNdt4F';
                course.payment_link_alumni = 'https://pay.kiwify.com.br/qvNdt4F';
                console.log('✅ SOS atualizado');
                break;
                
            case 'caixa':
                course.installment = '12x de R$ 227,22';
                course.cash = 'R$ 2.197,00';
                course.coupon = 'BLACK NOVEMBER';
                course.payment_link_new = 'https://pay.kiwify.com.br/q0TTdIR';
                course.payment_link_alumni = 'https://pay.kiwify.com.br/q0TTdIR';
                console.log('✅ CAIXA atualizado');
                break;
                
            case 'tcemg':
                course.installment = '12x de R$ 227,22';
                course.cash = 'R$ 2.197,00';
                course.coupon = 'BLACK NOVEMBER';
                course.payment_link_new = 'https://pay.kiwify.com.br/MquUu7Y';
                course.payment_link_alumni = 'https://pay.kiwify.com.br/MquUu7Y';
                console.log('✅ TCE MG atualizado');
                break;
        }
    });
    
    // Salvar no banco
    await pool.query(
        'UPDATE bot_configs SET courses_config = ? WHERE id = 1',
        [JSON.stringify(config)]
    );
    
    console.log('\n🎉 TODOS OS CURSOS FORAM ATUALIZADOS COM SUCESSO!\n');
    console.log('📋 Resumo das atualizações:');
    console.log('  1. ✅ Pós em Auditoria - 12x R$ 751,78 / R$ 7.269,00');
    console.log('  2. ✅ Pós em Medicina do Trabalho - 12x R$ 751,78 / R$ 7.269,00');
    console.log('  3. ✅ Pós em Perícia Médica - 12x R$ 751,78 / R$ 7.269,00');
    console.log('  4. ✅ Combo - 12x R$ 952,80 / R$ 10.527,24');
    console.log('  5. ℹ️  Prova de Títulos - Mantida');
    console.log('  6. ✅ Missão - 12x R$ 223,33 / R$ 2.159,40');
    console.log('  7. ✅ SOS - 12x R$ 49,33 / R$ 477,00');
    console.log('  8. ✅ CAIXA - 12x R$ 227,22 / R$ 2.197,00');
    console.log('  9. ✅ TCE MG - 12x R$ 227,22 / R$ 2.197,00');
    
    process.exit(0);
}

updateCoursesData().catch(console.error);
