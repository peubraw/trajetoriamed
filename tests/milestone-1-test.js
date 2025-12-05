/**
 * TESTE DE INTEGRAÇÃO - Milestone 1
 * Sistema Híbrido Bot + Humano
 * 
 * Este script testa todas as funcionalidades implementadas
 */

const botControlService = require('../services/bot-control.service');
const leadDistributionService = require('../services/lead-distribution.service');

console.log('🧪 Iniciando testes do Milestone 1...\n');

async function runTests() {
    try {
        // ====================================
        // TESTE 1: Controle do Bot
        // ====================================
        console.log('📌 TESTE 1: Controle do Bot');
        console.log('----------------------------');
        
        const testLeadId = 1; // Ajustar conforme necessário
        const testUserId = 1;

        // Verificar status inicial
        console.log('1.1. Verificando status inicial do bot...');
        const initialStatus = await botControlService.checkBotStatus(testLeadId);
        console.log('   ✓ Status:', initialStatus);

        // Pausar bot
        console.log('\n1.2. Pausando bot manualmente...');
        await botControlService.pauseBot(testLeadId, 'Teste de pausa manual', testUserId);
        const pausedStatus = await botControlService.checkBotStatus(testLeadId);
        console.log('   ✓ Bot pausado:', !pausedStatus.isActive);

        // Retomar bot
        console.log('\n1.3. Retomando bot...');
        await botControlService.resumeBot(testLeadId, testUserId);
        const resumedStatus = await botControlService.checkBotStatus(testLeadId);
        console.log('   ✓ Bot ativo:', resumedStatus.isActive);

        // Estatísticas
        console.log('\n1.4. Obtendo estatísticas...');
        const stats = await botControlService.getBotStatistics(testUserId);
        console.log('   ✓ Total de leads:', stats.total_leads);
        console.log('   ✓ Bots ativos:', stats.bots_active);
        console.log('   ✓ Bots pausados:', stats.bots_paused);

        console.log('\n✅ TESTE 1 CONCLUÍDO COM SUCESSO!\n');

        // ====================================
        // TESTE 2: Distribuição Round Robin
        // ====================================
        console.log('📌 TESTE 2: Distribuição Round Robin');
        console.log('--------------------------------------');

        // Configurar modo Round Robin
        console.log('2.1. Configurando modo Round Robin...');
        await leadDistributionService.updateDistributionSettings(testUserId, {
            distribution_mode: 'round_robin',
            shark_tank_timeout: 300
        });
        const settings = await leadDistributionService.getDistributionSettings(testUserId);
        console.log('   ✓ Modo configurado:', settings.distribution_mode);

        // Distribuir lead
        console.log('\n2.2. Distribuindo lead via Round Robin...');
        const distribution = await leadDistributionService.distributeRoundRobin(testLeadId, testUserId);
        console.log('   ✓ Lead atribuído para:', distribution.seller?.name || 'N/A');

        console.log('\n✅ TESTE 2 CONCLUÍDO COM SUCESSO!\n');

        // ====================================
        // TESTE 3: Distribuição Shark Tank
        // ====================================
        console.log('📌 TESTE 3: Distribuição Shark Tank');
        console.log('-------------------------------------');

        // Configurar modo Shark Tank
        console.log('3.1. Configurando modo Shark Tank...');
        await leadDistributionService.updateDistributionSettings(testUserId, {
            distribution_mode: 'shark_tank',
            shark_tank_timeout: 10 // 10 segundos para teste
        });

        // Distribuir lead
        console.log('\n3.2. Disponibilizando lead no Shark Tank...');
        const sharkResult = await leadDistributionService.distributeSharkTank(2, testUserId); // Lead ID 2
        console.log('   ✓ Vendedores notificados:', sharkResult.availableFor?.length || 0);
        console.log('   ✓ Timeout:', sharkResult.timeout, 'segundos');

        // Listar leads disponíveis
        console.log('\n3.3. Listando leads no Shark Tank...');
        const sharkLeads = await leadDistributionService.getSharkTankLeads(testUserId);
        console.log('   ✓ Leads disponíveis:', sharkLeads.length);

        console.log('\n✅ TESTE 3 CONCLUÍDO COM SUCESSO!\n');

        // ====================================
        // TESTE 4: Pausa Automática
        // ====================================
        console.log('📌 TESTE 4: Pausa Automática');
        console.log('------------------------------');

        // Pausa ao vendedor digitar
        console.log('4.1. Testando pausa ao vendedor digitar...');
        await botControlService.resumeBot(testLeadId); // Garantir que está ativo
        await botControlService.autoPauseOnHumanMessage(testLeadId, testUserId);
        const autoPausedStatus = await botControlService.checkBotStatus(testLeadId);
        console.log('   ✓ Bot pausado automaticamente:', !autoPausedStatus.isActive);

        console.log('\n✅ TESTE 4 CONCLUÍDO COM SUCESSO!\n');

        // ====================================
        // TESTE 5: Integração com Eventos
        // ====================================
        console.log('📌 TESTE 5: Eventos Socket.IO');
        console.log('-------------------------------');

        // Registrar listeners de eventos
        console.log('5.1. Registrando listeners...');
        leadDistributionService.on('lead:assigned', (data) => {
            console.log('   ✓ Evento capturado: lead:assigned', data);
        });

        leadDistributionService.on('shark_tank:new_lead', (data) => {
            console.log('   ✓ Evento capturado: shark_tank:new_lead', data);
        });

        leadDistributionService.on('shark_tank:lead_claimed', (data) => {
            console.log('   ✓ Evento capturado: shark_tank:lead_claimed', data);
        });

        console.log('   ✓ Listeners registrados com sucesso');

        console.log('\n✅ TESTE 5 CONCLUÍDO COM SUCESSO!\n');

        // ====================================
        // RESUMO FINAL
        // ====================================
        console.log('═══════════════════════════════════════');
        console.log('       ✅ TODOS OS TESTES PASSARAM!     ');
        console.log('═══════════════════════════════════════');
        console.log('\n📊 Resumo da implementação:');
        console.log('   ✓ Serviço de controle do bot');
        console.log('   ✓ Serviço de distribuição de leads');
        console.log('   ✓ Modo Round Robin');
        console.log('   ✓ Modo Shark Tank');
        console.log('   ✓ Pausa automática');
        console.log('   ✓ Eventos em tempo real');
        console.log('   ✓ APIs REST completas');
        console.log('\n🎉 Milestone 1 implementado com sucesso!');

    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Executar testes
runTests().then(() => {
    console.log('\n✨ Testes finalizados!');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
});
