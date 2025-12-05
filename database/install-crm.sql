-- ================================================
-- INSTALAÇÃO RÁPIDA - CRM KANBAN
-- Execute este arquivo para instalar o CRM completo
-- ================================================

USE wppbot_saas;

-- 1. Criar tabelas do CRM
SOURCE database/crm-schema.sql;

-- 2. Configurar usuário admin (Leandro) com estágios padrão
-- Assumindo que Leandro tem user_id = 1

-- Verificar se estágios já existem
SELECT COUNT(*) as count FROM crm_stages WHERE user_id = 1;

-- Se count = 0, criar estágios padrão
-- (O sistema fará isso automaticamente via endpoint /api/crm/stages/init)

-- 3. Configurar CRM settings
INSERT INTO crm_settings (
    user_id,
    distribution_mode,
    shark_tank_timeout,
    sla_enabled,
    sla_response_time,
    sla_business_hours_only,
    auto_bot_pause_on_human,
    auto_scoring_enabled,
    auto_temperature_update,
    notify_new_lead,
    notify_hot_lead,
    notify_sla_breach,
    notify_payment_received
) VALUES (
    1,                  -- user_id do Leandro
    'round_robin',      -- Modo roleta por padrão
    300,                -- 5 minutos para shark tank
    TRUE,               -- SLA ativado
    900,                -- 15 minutos de SLA
    TRUE,               -- Apenas horário comercial
    TRUE,               -- Bot pausa automaticamente quando humano intervém
    TRUE,               -- Scoring automático
    TRUE,               -- Atualização de temperatura automática
    TRUE,               -- Notificar novo lead
    TRUE,               -- Notificar lead quente
    TRUE,               -- Notificar SLA violado
    TRUE                -- Notificar pagamento recebido
) ON DUPLICATE KEY UPDATE
    distribution_mode = VALUES(distribution_mode);

-- 4. Verificação
SELECT 'CRM Kanban instalado com sucesso!' as status;

-- Verificar tabelas criadas
SHOW TABLES LIKE 'crm_%';

-- Verificar estágios (se já criados)
SELECT * FROM crm_stages WHERE user_id = 1;

-- ================================================
-- COMANDOS ÚTEIS PÓS-INSTALAÇÃO
-- ================================================

-- Ver todos os leads
-- SELECT * FROM crm_leads ORDER BY created_at DESC LIMIT 10;

-- Ver estatísticas de um lead
-- SELECT * FROM crm_activities WHERE lead_id = 1 ORDER BY created_at DESC;

-- Ver pipeline (valor total por estágio)
-- SELECT s.name, COUNT(l.id) as leads, SUM(l.potential_value) as total
-- FROM crm_stages s
-- LEFT JOIN crm_leads l ON s.id = l.stage_id
-- WHERE s.user_id = 1
-- GROUP BY s.name;

-- Resetar bot de um lead específico
-- UPDATE crm_leads SET bot_active = TRUE, bot_paused_at = NULL WHERE phone = '5584999999999';

-- Ver ranking de vendedores
-- SELECT * FROM v_crm_seller_stats WHERE user_id = 1;
