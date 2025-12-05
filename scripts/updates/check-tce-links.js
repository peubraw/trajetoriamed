const db = require('./config/database');

(async () => {
    try {
        const [rows] = await db.execute('SELECT courses_config FROM bot_configs WHERE id = 1');
        const configStr = typeof rows[0].courses_config === 'string' 
            ? rows[0].courses_config 
            : JSON.stringify(rows[0].courses_config);
        const config = JSON.parse(configStr);
        const tce = config.courses.find(c => c.id === 'tcemg');
        
        console.log('\n=== LINKS DO TCE MG ===\n');
        console.log('payment_link_new (Black Friday):');
        console.log(tce.payment_link_new);
        console.log('\npayment_link_alumni (Normal):');
        console.log(tce.payment_link_alumni);
        console.log('\nPreços:');
        console.log('Parcelado:', tce.installment);
        console.log('À vista:', tce.cash);
        console.log('Cupom:', tce.coupon);
        
    } catch (error) {
        console.error('Erro:', error);
    }
    process.exit(0);
})();
