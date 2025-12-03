-- Atualizar links da CAIXA e TCE MG para sistema Black Friday
-- Black Friday (payment_link_new): válido até 05/12/2025
-- Normal (payment_link_alumni): válido após 05/12/2025

-- IMPORTANTE: Para CAIXA e TCE MG, NÃO usar sistema ex-aluno
-- payment_link_new = Link Black Friday (https://pay.kiwify.com.br/q0TTdIR para CAIXA)
-- payment_link_alumni = Link Normal (https://pay.kiwify.com.br/7aiBZMe para CAIXA)

UPDATE bot_configs 
SET courses_config = JSON_SET(
    courses_config,
    -- Atualizar curso CAIXA
    '$.courses[7].name', 'CAIXA - Médico do Trabalho',
    '$.courses[7].payment_link_new', 'https://pay.kiwify.com.br/q0TTdIR',
    '$.courses[7].payment_link_alumni', 'https://pay.kiwify.com.br/7aiBZMe',
    -- Manter curso TCE MG como está (já tem os links corretos)
    '$.courses[8].payment_link_new', 'https://pay.kiwify.com.br/vxDfWrp',
    '$.courses[8].payment_link_alumni', 'https://pay.kiwify.com.br/Jl2eYDO'
)
WHERE user_id = 1;

-- Verificar atualização
SELECT 
    id,
    user_id,
    bot_name,
    JSON_EXTRACT(courses_config, '$.courses[7].name') as caixa_name,
    JSON_EXTRACT(courses_config, '$.courses[7].payment_link_new') as caixa_black,
    JSON_EXTRACT(courses_config, '$.courses[7].payment_link_alumni') as caixa_normal,
    JSON_EXTRACT(courses_config, '$.courses[8].name') as tce_name,
    JSON_EXTRACT(courses_config, '$.courses[8].payment_link_new') as tce_black,
    JSON_EXTRACT(courses_config, '$.courses[8].payment_link_alumni') as tce_normal
FROM bot_configs 
WHERE user_id = 1;
