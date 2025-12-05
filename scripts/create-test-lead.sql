-- Script para criar lead de teste para webhooks
-- Execute este script no banco de dados para testar os webhooks

-- 1. Buscar ID do primeiro estágio (Novo Lead)
SET @first_stage_id = (SELECT id FROM crm_stages WHERE user_id = 1 ORDER BY position ASC LIMIT 1);

-- 2. Inserir lead de teste
INSERT INTO crm_leads (
    user_id,
    name,
    phone,
    email,
    stage_id,
    assigned_to,
    temperature,
    potential_value,
    source,
    created_at
) VALUES (
    1,                              -- user_id (leandro.berti@gmail.com)
    'Cliente Teste Webhook',        -- name
    '5511999999999',                -- phone (mesmo do script de teste)
    'teste@trajetoriamed.com',      -- email
    @first_stage_id,                -- stage_id (primeiro estágio)
    1,                              -- assigned_to (vendedor ID 1)
    'hot',                          -- temperature
    2197.00,                        -- potential_value
    'teste',                        -- source
    NOW()                           -- created_at
);

-- 3. Verificar se foi criado
SELECT 
    id,
    name,
    phone,
    email,
    stage_id,
    assigned_to,
    potential_value,
    created_at
FROM crm_leads
WHERE phone = '5511999999999';

-- 4. Mostrar estágio atual
SELECT 
    l.id as lead_id,
    l.name as lead_name,
    l.phone,
    s.name as stage_name,
    s.is_success
FROM crm_leads l
JOIN crm_stages s ON l.stage_id = s.id
WHERE l.phone = '5511999999999';
