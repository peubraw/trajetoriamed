-- ========================================
-- MIGRATION: Sistema Híbrido Bot + Humano
-- Data: 05/12/2025
-- Milestone 1: Fundação do Sistema
-- ========================================

USE wppbot_saas;

-- Verificar e adicionar campos na tabela crm_leads (se não existirem)

-- Campo bot_active
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'wppbot_saas' 
AND TABLE_NAME = 'crm_leads' 
AND COLUMN_NAME = 'bot_active';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE crm_leads ADD COLUMN bot_active BOOLEAN DEFAULT TRUE AFTER bot_last_action',
    'SELECT "Campo bot_active já existe" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Campo bot_paused_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'wppbot_saas' 
AND TABLE_NAME = 'crm_leads' 
AND COLUMN_NAME = 'bot_paused_at';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE crm_leads ADD COLUMN bot_paused_at TIMESTAMP NULL AFTER bot_active',
    'SELECT "Campo bot_paused_at já existe" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Campo bot_paused_by
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'wppbot_saas' 
AND TABLE_NAME = 'crm_leads' 
AND COLUMN_NAME = 'bot_paused_by';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE crm_leads ADD COLUMN bot_paused_by INT NULL COMMENT "ID do usuário que pausou" AFTER bot_paused_at',
    'SELECT "Campo bot_paused_by já existe" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar FK para bot_paused_by (se não existir)
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'wppbot_saas' 
AND TABLE_NAME = 'crm_leads' 
AND CONSTRAINT_NAME = 'fk_bot_paused_by';

SET @query = IF(@fk_exists = 0,
    'ALTER TABLE crm_leads ADD CONSTRAINT fk_bot_paused_by FOREIGN KEY (bot_paused_by) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "FK bot_paused_by já existe" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Campo assigned_to (lead_owner)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'wppbot_saas' 
AND TABLE_NAME = 'crm_leads' 
AND COLUMN_NAME = 'assigned_to';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE crm_leads ADD COLUMN assigned_to INT NULL COMMENT "Vendedor responsável" AFTER stage_id',
    'SELECT "Campo assigned_to já existe" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar FK para assigned_to (se não existir)
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'wppbot_saas' 
AND TABLE_NAME = 'crm_leads' 
AND CONSTRAINT_NAME = 'fk_assigned_to';

SET @query = IF(@fk_exists = 0,
    'ALTER TABLE crm_leads ADD CONSTRAINT fk_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "FK assigned_to já existe" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar índice em assigned_to (se não existir)
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'wppbot_saas' 
AND TABLE_NAME = 'crm_leads' 
AND INDEX_NAME = 'idx_assigned';

SET @query = IF(@idx_exists = 0,
    'ALTER TABLE crm_leads ADD INDEX idx_assigned (assigned_to)',
    'SELECT "Índice idx_assigned já existe" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================
-- Tabela crm_settings (configurações)
-- ========================================

CREATE TABLE IF NOT EXISTS crm_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Distribuição de leads
    distribution_mode ENUM('manual', 'round_robin', 'shark_tank') DEFAULT 'round_robin',
    shark_tank_timeout INT DEFAULT 300 COMMENT 'Tempo em segundos para auto-atribuição',
    
    -- SLA
    sla_enabled BOOLEAN DEFAULT TRUE,
    sla_response_time INT DEFAULT 900 COMMENT 'Tempo máximo de resposta (segundos)',
    sla_business_hours_only BOOLEAN DEFAULT TRUE,
    
    -- Automações
    auto_bot_pause_on_human BOOLEAN DEFAULT TRUE,
    auto_scoring_enabled BOOLEAN DEFAULT TRUE,
    auto_temperature_update BOOLEAN DEFAULT TRUE,
    
    -- Notificações
    notify_new_lead BOOLEAN DEFAULT TRUE,
    notify_hot_lead BOOLEAN DEFAULT TRUE,
    notify_sla_breach BOOLEAN DEFAULT TRUE,
    notify_payment_received BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_settings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Adicionar novos tipos de atividade
-- ========================================

-- Verificar se já existem os tipos de atividade
ALTER TABLE crm_activities 
MODIFY COLUMN activity_type ENUM(
    'message_sent', 'message_received', 'stage_changed', 
    'bot_paused', 'bot_resumed', 'note_added', 
    'assigned', 'email_sent', 'call_made',
    'meeting_scheduled', 'payment_received',
    'shark_tank_claimed', 'round_robin_assigned'
) NOT NULL;

-- ========================================
-- Configurações padrão para usuários existentes
-- ========================================

INSERT INTO crm_settings (user_id, distribution_mode, shark_tank_timeout)
SELECT id, 'round_robin', 300
FROM users 
WHERE id NOT IN (SELECT user_id FROM crm_settings)
ON DUPLICATE KEY UPDATE user_id = user_id;

-- ========================================
-- Índices adicionais para performance
-- ========================================

-- Índice para bot_active (filtros frequentes)
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'wppbot_saas' 
AND TABLE_NAME = 'crm_leads' 
AND INDEX_NAME = 'idx_bot_active';

SET @query = IF(@idx_exists = 0,
    'ALTER TABLE crm_leads ADD INDEX idx_bot_active (bot_active)',
    'SELECT "Índice idx_bot_active já existe" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================
-- Atualizar campos bot_enabled nas stages
-- ========================================

-- Garantir que bot_enabled existe em crm_stages
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'wppbot_saas' 
AND TABLE_NAME = 'crm_stages' 
AND COLUMN_NAME = 'bot_enabled';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE crm_stages ADD COLUMN bot_enabled BOOLEAN DEFAULT FALSE AFTER color',
    'SELECT "Campo bot_enabled já existe" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Atualizar estágios existentes: ativar bot nas primeiras etapas
UPDATE crm_stages 
SET bot_enabled = TRUE 
WHERE position <= 2 
AND name IN ('Novos', 'Triagem', 'Nutrição', 'Apresentação', 'Novo Lead', 'Qualificação');

-- Desativar bot em etapas humanas
UPDATE crm_stages 
SET bot_enabled = FALSE 
WHERE name IN ('Em Negociação', 'Negociação', 'Atendimento Humano', 'Follow-up Manual', 'Aguardando Resposta Vendedor');

-- ========================================
-- LOG de conclusão
-- ========================================

SELECT '✅ Migration concluída com sucesso!' AS status,
       'Sistema Híbrido Bot + Humano instalado' AS message,
       NOW() AS timestamp;

-- Verificar estrutura criada
SELECT 
    'crm_leads' AS tabela,
    COUNT(*) AS total_campos
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'wppbot_saas' 
AND TABLE_NAME = 'crm_leads'
UNION ALL
SELECT 
    'crm_settings' AS tabela,
    COUNT(*) AS total_campos
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'wppbot_saas' 
AND TABLE_NAME = 'crm_settings';
