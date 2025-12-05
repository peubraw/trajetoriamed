-- Criar leads de teste para popular o dashboard CRM

-- Lead 2: Em triagem
INSERT INTO crm_leads (user_id, name, phone, email, stage_id, assigned_to, temperature, potential_value, source, created_at)
VALUES (1, 'Maria Silva', '5511988888888', 'maria@example.com', 8, 1, 'hot', 2197.00, 'instagram', NOW());

-- Lead 3: Em nutrição
INSERT INTO crm_leads (user_id, name, phone, email, stage_id, assigned_to, temperature, potential_value, source, created_at)
VALUES (1, 'João Santos', '5511977777777', 'joao@example.com', 9, 1, 'warm', 1850.00, 'whatsapp', NOW());

-- Lead 4: Link enviado
INSERT INTO crm_leads (user_id, name, phone, email, stage_id, assigned_to, temperature, potential_value, source, created_at)
VALUES (1, 'Ana Paula', '5511966666666', 'ana@example.com', 10, 1, 'hot', 2197.00, 'whatsapp', NOW());

-- Lead 5: Em negociação
INSERT INTO crm_leads (user_id, name, phone, email, stage_id, assigned_to, temperature, potential_value, source, created_at)
VALUES (1, 'Pedro Costa', '5511955555555', 'pedro@example.com', 11, 1, 'hot', 1650.00, 'indicacao', NOW());

-- Lead 6: Aguardando pagamento
INSERT INTO crm_leads (user_id, name, phone, email, stage_id, assigned_to, temperature, potential_value, source, created_at)
VALUES (1, 'Juliana Oliveira', '5511944444444', 'juliana@example.com', 12, 1, 'hot', 2197.00, 'whatsapp', NOW());

-- Lead 7: Venda confirmada
INSERT INTO crm_leads (user_id, name, phone, email, stage_id, assigned_to, temperature, potential_value, source, created_at)
VALUES (1, 'Roberto Lima', '5511933333333', 'roberto@example.com', 13, 1, 'hot', 1850.00, 'whatsapp', NOW());

-- Lead 8: Perdido
INSERT INTO crm_leads (user_id, name, phone, email, stage_id, assigned_to, temperature, potential_value, source, lost_reason, created_at)
VALUES (1, 'Carla Ferreira', '5511922222222', 'carla@example.com', 14, 1, 'cold', 2197.00, 'instagram', 'Preço alto', NOW());

-- Lead 9: Perdido
INSERT INTO crm_leads (user_id, name, phone, email, stage_id, assigned_to, temperature, potential_value, source, lost_reason, created_at)
VALUES (1, 'Marcos Alves', '5511911111111', 'marcos@example.com', 14, 1, 'cold', 1650.00, 'whatsapp', 'Não respondeu', NOW());

-- Verificar leads criados
SELECT 
    l.id,
    l.name,
    s.name as stage,
    l.potential_value,
    l.temperature
FROM crm_leads l
JOIN crm_stages s ON l.stage_id = s.id
WHERE l.user_id = 1
ORDER BY l.created_at DESC;

-- Verificar totais por estágio
SELECT 
    s.name as stage,
    COUNT(l.id) as total_leads,
    SUM(l.potential_value) as total_value
FROM crm_stages s
LEFT JOIN crm_leads l ON s.id = l.stage_id AND l.user_id = 1
WHERE s.user_id = 1
GROUP BY s.id, s.name
ORDER BY s.position;
