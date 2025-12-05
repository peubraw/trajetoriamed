const pool = require('./config/database');

async function updateScripts() {
    const [rows] = await pool.query('SELECT courses_config FROM bot_configs WHERE id=1');
    const config = typeof rows[0].courses_config === 'string' 
        ? JSON.parse(rows[0].courses_config) 
        : rows[0].courses_config;
    
    console.log('🔄 Atualizando scripts de apresentação e fechamento...\n');
    
    const scripts = {
        auditoria: {
            intro: `Ótima escolha, Dr(a)! 🎯

A Pós em Auditoria foi TOTALMENTE REFORMULADA seguindo o "Padrão Perícia" da Trajetória Med!

✅ Foco em PRÁTICA REAL
✅ Plantão ao vivo com a Dra. Germana
✅ Diploma MEC em 6 meses
✅ Networking exclusivo

Antes de apresentar os valores, preciso de algumas informações:`,
            
            closing: `Perfeito, Dr(a)! 

Link de pagamento enviado acima ☝️

Por favor, após efetuar o pagamento, envie o comprovante aqui mesmo no WhatsApp para liberarmos seu acesso imediato!

⚡ Qualquer dúvida, estou à disposição.

Bem-vindo(a) à Trajetória Med! 🎓`
        },
        
        medicina: {
            intro: `Excelente escolha, Dr(a)! 🎯

A Pós em Medicina do Trabalho da Trajetória Med tem um diferencial único:

✅ Mentoria Integrada com plantão AO VIVO
✅ Foco na VIDA REAL (PCMSO, nexos, afastamentos)
✅ Diploma MEC em 4 a 6 meses
✅ Networking com quem já está no mercado

Preciso de algumas informações antes de apresentar as condições:`,
            
            closing: `Pronto, Dr(a)! 

Link de pagamento enviado acima ☝️

Assim que efetuar o pagamento, envie o comprovante aqui que liberamos seu acesso na hora!

💼 A Medicina do Trabalho está esperando por você!

Bem-vindo(a) à Trajetória Med! 🎓`
        },
        
        pericia: {
            intro: `Excelente decisão, Dr(a)! 🎯

A Pós em Perícia foi TOTALMENTE REFORMULADA com o Padrão de Excelência da Profa. Germana (1º Lugar Perícia Federal)!

✅ Foco em PRÁTICA (Tribunais, INSS, perícias judiciais)
✅ Plantão AO VIVO semanal
✅ Diploma MEC em 6 meses
✅ Networking com peritos atuantes

Antes de apresentar as condições, preciso saber:`,
            
            closing: `Perfeito, Dr(a)! 

Link de pagamento enviado acima ☝️

Após o pagamento, envie o comprovante aqui que liberamos seu acesso imediatamente!

⚖️ Sua nova carreira na Perícia começa agora!

Bem-vindo(a) à Trajetória Med! 🎓`
        },
        
        combo: {
            intro: `Excelente estratégia, Dr(a)! 🎯

O Combo é a rota mais inteligente e rápida!

✅ 2 Certificações MEC
✅ Módulos comuns compartilhados
✅ Mentoria com a Profa. Germana
✅ Plantão ao vivo
✅ Networking ampliado

Antes de apresentar a condição especial, preciso saber:`,
            
            closing: `Pronto, Dr(a)! 

Link de pagamento enviado acima ☝️

Envie o comprovante após o pagamento para liberarmos seu acesso!

🚀 2 diplomas MEC, uma carreira turbinada!

Bem-vindo(a) à Trajetória Med! 🎓`
        },
        
        provatitulos: {
            intro: `Ótima decisão, Dr(a)! 🎯

O Preparatório da Prova de Títulos é focado na ABMLPM/AMB!

✅ Bibliografia filtrada (só o que cai)
✅ Metodologia "Cirúrgica"
✅ 100% online
✅ Coordenado pela Profa. Germana

Antes de apresentar as condições:`,
            
            closing: `Perfeito, Dr(a)! 

Link de pagamento enviado acima ☝️

Após o pagamento, envie o comprovante para liberarmos seu acesso!

🏆 Seu RQE está mais próximo!

Bem-vindo(a) à Trajetória Med! 🎓`
        },
        
        missao: {
            intro: `Excelente escolha, Dr(a)! 🎯

A Missão Médico Legista é o preparatório COMPLETO para PC/PF!

✅ Básicas + Específicas
✅ IA para cronograma PERSONALIZADO
✅ Aulas objetivas + PDFs
✅ Profa. Germana (1º Lugar Perícia Federal)

Antes de apresentar as condições:`,
            
            closing: `Pronto, Dr(a)! 

Link de pagamento enviado acima ☝️

Envie o comprovante após o pagamento que liberamos seu acesso!

👮 Sua aprovação em PC/PF começa agora!

Bem-vindo(a) à Trajetória Med! 🎓`
        },
        
        sos: {
            intro: `Ótima decisão, Dr(a)! 🎯

O SOS é o material de RESGATE para reta final!

✅ Conteúdo "CIRÚRGICO" - só o que CAI
✅ Resumos diretos
✅ Mapas Mentais RÁPIDOS
✅ Material validado pela Germana

Vou apresentar as condições:`,
            
            closing: `Perfeito, Dr(a)! 

Link de pagamento enviado acima ☝️

Envie o comprovante após o pagamento!

⚡ Seu resgate de reta final começa AGORA!

Bem-vindo(a) à Trajetória Med! 🎓`
        },
        
        caixa: {
            intro: `Excelente escolha, Dr(a)! 🎯

O preparatório da CAIXA foi feito para quem tem rotina pesada!

💼 Salário: R$ 12.371,00 + Benefícios
📅 Prova: 01/02/2026
⏰ Inscrições: até 08/12/2025

✅ Aulas para assistir no plantão
✅ Material "Cirúrgico"
✅ Método validado pela Germana

Antes de apresentar as condições:`,
            
            closing: `Pronto, Dr(a)! 

Link de pagamento enviado acima ☝️

Após o pagamento, envie o comprovante para liberação imediata!

💼 Sua aprovação na CAIXA começa agora!

Bem-vindo(a) à Trajetória Med! 🎓`
        },
        
        tcemg: {
            intro: `Excelente escolha, Dr(a)! 🎯

O preparatório do TCE MG aceita QUALQUER especialidade!

💼 Salário: R$ 15.000,00 + Benefícios
📅 Prova: 25/01/2026
⏰ Inscrições: até 09/12/2025

✅ Carreira de Estado
✅ Qualidade de vida
✅ Material focado

Antes de apresentar as condições:`,
            
            closing: `Perfeito, Dr(a)! 

Link de pagamento enviado acima ☝️

Envie o comprovante após o pagamento para liberação!

⚖️ Sua carreira no TCE MG começa agora!

Bem-vindo(a) à Trajetória Med! 🎓`
        }
    };
    
    // Atualizar scripts de cada curso
    config.courses.forEach(course => {
        if (scripts[course.id]) {
            course.intro_script = scripts[course.id].intro;
            course.closing_script = scripts[course.id].closing;
            console.log(`✅ Scripts de ${course.name} atualizados`);
        }
    });
    
    // Salvar no banco
    await pool.query(
        'UPDATE bot_configs SET courses_config = ? WHERE id = 1',
        [JSON.stringify(config)]
    );
    
    console.log('\n🎉 TODOS OS SCRIPTS FORAM ATUALIZADOS COM SUCESSO!\n');
    console.log('📋 Scripts configurados:');
    console.log('  1. ✅ Pós em Auditoria - Intro + Closing');
    console.log('  2. ✅ Pós em Medicina do Trabalho - Intro + Closing');
    console.log('  3. ✅ Pós em Perícia Médica - Intro + Closing');
    console.log('  4. ✅ Combo - Intro + Closing');
    console.log('  5. ✅ Prova de Títulos - Intro + Closing');
    console.log('  6. ✅ Missão - Intro + Closing');
    console.log('  7. ✅ SOS - Intro + Closing');
    console.log('  8. ✅ CAIXA - Intro + Closing');
    console.log('  9. ✅ TCE MG - Intro + Closing');
    console.log('\n📝 Uso dos scripts:');
    console.log('  • INTRO: Mensagem enviada logo após o lead escolher o curso');
    console.log('  • CLOSING: Mensagem de boas-vindas após enviar o link de pagamento');
    
    process.exit(0);
}

updateScripts().catch(console.error);
