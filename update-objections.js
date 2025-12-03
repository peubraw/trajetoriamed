const pool = require('./config/database');

async function updateObjections() {
    const [rows] = await pool.query('SELECT courses_config FROM bot_configs WHERE id=1');
    const config = typeof rows[0].courses_config === 'string' 
        ? JSON.parse(rows[0].courses_config) 
        : rows[0].courses_config;
    
    console.log('🔄 Atualizando objeções específicas dos cursos...\n');
    
    // Objeções específicas por curso
    const objections = {
        auditoria: {
            expensive: 'Dr(a), o investimento se paga em 1-2 glosas defendidas! Você está investindo na sua capacidade de gerar receita. Operadoras e hospitais pagam muito bem por auditores qualificados.',
            no_time: 'Dr(a), o curso foi pensado exatamente para quem tem rotina pesada! Diploma MEC em 4 a 6 meses, com plantão ao vivo para suas dúvidas específicas. Você estuda no seu tempo.',
            alone: 'Dr(a), o mercado de auditoria está aquecido justamente por falta de profissionais qualificados! Nossa mentoria ajuda na transição e no networking para inserção no mercado.',
            think: 'Dr(a), entendo perfeitamente. Mas deixa eu te dizer: a Pós em Auditoria foi TOTALMENTE REFORMULADA seguindo o "Padrão Perícia" da Germana. Tem plantão ao vivo, discussão de casos reais e comunidade exclusiva. Quanto mais você espera, mais oportunidades perdem.',
            final: 'Dr(a), agradeço muito seu interesse! Qualquer dúvida, estamos à disposição. A Trajetória Med está aqui para sua evolução profissional. Desejo muito sucesso na sua carreira! 🎓'
        },
        medicina: {
            expensive: 'Dr(a), o investimento se paga rapidamente com contratos! Um único cliente corporativo já cobre o curso. A Medicina do Trabalho tem ótima remuneração e você pode atender como complemento.',
            no_time: 'Dr(a), por isso tem a mentoria integrada! O curso foi feito para quem trabalha. Diploma MEC em 4 a 6 meses, com plantão ao vivo para tirar dúvidas dos SEUS casos reais.',
            alone: 'Dr(a), o mercado está crescendo e é complementar ao que você já faz! Empresas precisam de médicos do trabalho, há déficit de profissionais. Nossa mentoria facilita a entrada no mercado.',
            think: 'Dr(a), compreendo. Mas veja: esta Pós tem Mentoria Integrada com plantão AO VIVO. Não é teoria chata, você discute PCMSO e casos reais. Oportunidades aparecem para quem está preparado.',
            final: 'Dr(a), muito obrigada pelo seu tempo! Qualquer dúvida sobre Medicina do Trabalho, pode contar com a Trajetória Med. Desejo muito sucesso! 🎓'
        },
        pericia: {
            expensive: 'Dr(a), 1-2 perícias já pagam o investimento! Honorários variam de R$ 300 a R$ 1.000 por perícia. Você está investindo em uma área que paga muito bem e oferece qualidade de vida.',
            no_time: 'Dr(a), o curso é para quem busca SAIR do plantão! Diploma MEC em 6 meses, plantão ao vivo semanal. Material da Profa. Germana (1º Lugar Perícia Federal), focado e objetivo.',
            alone: 'Dr(a), essa é uma percepção equivocada! Falta perito qualificado em todo lugar. Tribunais, INSS e empresas estão sempre buscando. O mercado está aquecido, não saturado.',
            think: 'Dr(a), entendo. Mas considere: a Pós foi TOTALMENTE REFORMULADA com o Padrão de Excelência da Germana (1º Lugar). Metodologia validada, casos reais, networking. Quanto mais espera, mais deixa de ganhar.',
            final: 'Dr(a), agradeço imensamente! A Trajetória Med está aqui quando você decidir dar esse passo na sua carreira. Muito sucesso! 🎓'
        },
        combo: {
            expensive: 'Dr(a), são 2 diplomas MEC! O investimento por diploma é muito menor que fazer separado. Você maximiza currículo e tem múltiplas opções de carreira com economia de tempo e dinheiro.',
            no_time: 'Dr(a), os módulos comuns facilitam muito! O cronograma é otimizado para aproveitar conteúdos compartilhados. Você faz 2 pós no tempo de 1,5.',
            alone: 'Dr(a), ter múltiplas especializações aumenta muito a empregabilidade! Você fica preparado para diversos concursos e tem mais opções de atuação no mercado privado.',
            think: 'Dr(a), compreendo. Mas veja a estratégia: 2 Certificações MEC, mentoria com a Germana, plantão ao vivo, networking ampliado. É a rota mais inteligente para quem quer maximizar oportunidades.',
            final: 'Dr(a), muito obrigada pela atenção! O Combo está aqui quando você quiser dar esse salto na carreira. Sucesso sempre! 🎓'
        },
        provatitulos: {
            expensive: 'Dr(a), comparado ao tempo que você economiza estudando certo, vale muito! A prova de título é difícil, nossa metodologia foca no que a ABMLPM cobra. Tempo é dinheiro.',
            no_time: 'Dr(a), justamente por isso criamos este preparatório! Material filtrado pela Profa. Germana, 100% online para estudar entre plantões. Metodologia "Cirúrgica" - só o que cai.',
            alone: 'Dr(a), estudar sozinho pelos livros é ineficiente! Você perde tempo com o que não cai. Nossa bibliografia é filtrada, questões são comentadas no estilo da banca.',
            think: 'Dr(a), entendo. Mas a prova de título da ABMLPM é conhecida por ser difícil. Já tentou antes? Nosso método é diferente - foco total na banca. Quanto mais espera, mais adia o RQE.',
            final: 'Dr(a), agradeço muito! Quando decidir buscar o RQE, a Trajetória Med está aqui para ajudar. Muito sucesso! 🎓'
        },
        missao: {
            expensive: 'Dr(a), comparado a cursinhos tradicionais, é muito mais focado e completo! Você tem Básicas + Específicas + IA para cronograma personalizado. Tudo em um só lugar, feito por médico para médico.',
            no_time: 'Dr(a), por isso temos a IA para cronograma personalizado! Ela monta o plano conforme SUA rotina. Material objetivo, sem enrolação. Você estuda no seu tempo.',
            alone: 'Dr(a), o material é explicado desde o básico! Português, Direito, tudo detalhado mas objetivo. A Profa. Germana (1º Lugar Perícia Federal) coordena, suporte total.',
            think: 'Dr(a), compreendo perfeitamente. Mas considere: IA para cronograma, conteúdo completo, acompanhamento da maior referência da área. Quanto mais espera, mais concorrentes se preparam.',
            final: 'Dr(a), muito obrigada! Quando decidir focar em PC/PF, a Missão Médico Legista está aqui. Desejo muito sucesso! 🎓'
        },
        sos: {
            expensive: 'Dr(a), são apenas R$ 477 à vista! É material de resgate, você estuda em poucos dias o que levaria meses. Investimento mínimo para não perder a prova.',
            no_time: 'Dr(a), por isso existe o SOS! É exatamente para reta final. Conteúdo "CIRÚRGICO" - apenas o que CAI. Você consegue estudar em poucos dias.',
            alone: 'Dr(a), o material foi filtrado pela Germana (1º Lugar Perícia Federal)! Tem tudo que cai, elimina a "gordura" dos cursinhos tradicionais. É compacto mas completo.',
            think: 'Dr(a), entendo, mas a prova está próxima! Quanto mais você espera, mais difícil fica. O SOS foi feito para essa situação - resgate de última hora com material validado.',
            final: 'Dr(a), agradeço muito! Se decidir fazer o SOS, estaremos aqui. Boa sorte na sua preparação! 🎓'
        },
        caixa: {
            expensive: 'Dr(a), o salário é R$ 12.371! O curso se paga em menos de 1 plantão. Você está investindo para SAIR do plantão e ter qualidade de vida.',
            no_time: 'Dr(a), o curso foi feito para quem dá plantão! Aulas curtas, cronograma para 1h a 2h por dia. Material "Cirúrgico" focado na banca Cesgranrio.',
            alone: 'Dr(a), sozinho você perde tempo com o que não cai! A banca Cesgranrio tem estilo próprio. Método validado pela Profa. Germana (1º Lugar Perícia Federal).',
            think: 'Dr(a), compreendo. Mas veja: inscrições até 08/12/2025, prova em 01/02/2026. Preparação direcionada para quem tem rotina pesada. Quanto mais espera, menos tempo tem.',
            final: 'Dr(a), muito obrigada! Qualquer dúvida sobre CAIXA, estamos à disposição. Desejo muito sucesso no concurso! 🎓'
        },
        tcemg: {
            expensive: 'Dr(a), o salário é R$ 15.000! O curso se paga em menos de 1 plantão. Você está investindo em carreira de Estado com estabilidade máxima.',
            no_time: 'Dr(a), o curso é focado para plantões! Material direto ao ponto. TCE MG é oportunidade de qualidade de vida - sem plantões, trabalho técnico.',
            alone: 'Dr(a), o déficit no TCE é enorme! Órgãos estaduais chamam muito mais que o edital oficial. E este concurso aceita QUALQUER especialidade ou SEM especialidade.',
            think: 'Dr(a), entendo. Mas considere: inscrições até 09/12/2025, prova em 25/01/2026. Carreira de Estado, qualidade de vida, aceita generalista. Oportunidade única.',
            final: 'Dr(a), muito obrigada pelo interesse! Quando decidir buscar o TCE MG, estamos aqui. Muito sucesso! 🎓'
        }
    };
    
    // Atualizar objeções de cada curso
    config.courses.forEach(course => {
        if (objections[course.id]) {
            course.objections = objections[course.id];
            console.log(`✅ Objeções do curso ${course.name} atualizadas`);
        }
    });
    
    // Salvar no banco
    await pool.query(
        'UPDATE bot_configs SET courses_config = ? WHERE id = 1',
        [JSON.stringify(config)]
    );
    
    console.log('\n🎉 TODAS AS OBJEÇÕES FORAM ATUALIZADAS COM SUCESSO!\n');
    console.log('📋 Objeções configuradas:');
    console.log('  1. ✅ Pós em Auditoria - 5 objeções específicas');
    console.log('  2. ✅ Pós em Medicina do Trabalho - 5 objeções específicas');
    console.log('  3. ✅ Pós em Perícia Médica - 5 objeções específicas');
    console.log('  4. ✅ Combo - 5 objeções específicas');
    console.log('  5. ✅ Prova de Títulos - 5 objeções específicas');
    console.log('  6. ✅ Missão - 5 objeções específicas');
    console.log('  7. ✅ SOS - 5 objeções específicas');
    console.log('  8. ✅ CAIXA - 5 objeções específicas');
    console.log('  9. ✅ TCE MG - 5 objeções específicas');
    console.log('\n💡 A IA agora usará estas objeções específicas quando o lead levantar dúvidas!');
    
    process.exit(0);
}

updateObjections().catch(console.error);
