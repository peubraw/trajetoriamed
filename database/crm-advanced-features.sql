-- Adicionar novas colunas e tabelas para features avançadas do CRM

-- 1. LEAD SCORING: Adicionar cálculo de score na tabela de leads
-- Verificar se colunas já existem antes de adicionar
SET @exist_score_breakdown := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'wppbot_saas' AND TABLE_NAME = 'crm_leads' AND COLUMN_NAME = 'score_breakdown');
SET @exist_last_score := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'wppbot_saas' AND TABLE_NAME = 'crm_leads' AND COLUMN_NAME = 'last_score_update');

SET @sql_score_breakdown = IF(@exist_score_breakdown = 0, 
    'ALTER TABLE crm_leads ADD COLUMN score_breakdown JSON COMMENT ''Detalhamento do score (engagement, data_quality, recency)''', 
    'SELECT ''Column score_breakdown already exists'' as info');
SET @sql_last_score = IF(@exist_last_score = 0, 
    'ALTER TABLE crm_leads ADD COLUMN last_score_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 
    'SELECT ''Column last_score_update already exists'' as info');

PREPARE stmt1 FROM @sql_score_breakdown;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

PREPARE stmt2 FROM @sql_last_score;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 2. BIBLIOTECA DE ÁUDIOS RÁPIDOS
CREATE TABLE IF NOT EXISTS crm_quick_audios_library (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL COMMENT 'Ex: Saudação Inicial, Retorno Pós-Link',
    audio_url VARCHAR(500) NOT NULL COMMENT 'URL do áudio armazenado',
    duration_seconds INT DEFAULT 0,
    times_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_audios (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CONTROLE DE SLA (Service Level Agreement)
ALTER TABLE crm_leads 
ADD COLUMN IF NOT EXISTS sla_response_deadline DATETIME COMMENT 'Prazo para responder o lead',
ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE COMMENT 'Se ultrapassou o tempo de resposta',
ADD COLUMN IF NOT EXISTS sla_breach_count INT DEFAULT 0 COMMENT 'Quantas vezes foi violado o SLA';

-- Índice para consultas rápidas de SLA vencido
CREATE INDEX IF NOT EXISTS idx_sla_deadline ON crm_leads(sla_response_deadline, sla_breached);

-- 4. AGENDAMENTO DE FOLLOW-UP
ALTER TABLE crm_followups 
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_sent_at DATETIME,
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_at DATETIME;

-- Índice para buscar follow-ups pendentes
CREATE INDEX IF NOT EXISTS idx_followup_schedule ON crm_followups(scheduled_date, status, notification_sent);

-- 5. WEBHOOKS DE PAGAMENTO (Kiwify/Hotmart)
ALTER TABLE crm_webhooks 
ADD COLUMN IF NOT EXISTS last_triggered_at DATETIME,
ADD COLUMN IF NOT EXISTS success_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS failure_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Tabela de log de webhooks recebidos
CREATE TABLE IF NOT EXISTS crm_webhook_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webhook_id INT,
    lead_id INT,
    gateway VARCHAR(50) COMMENT 'kiwify, hotmart, eduzz',
    event_type VARCHAR(100) COMMENT 'purchase.approved, purchase.refunded',
    payload JSON COMMENT 'Dados completos do webhook',
    processing_status ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (webhook_id) REFERENCES crm_webhooks(id) ON DELETE SET NULL,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
    INDEX idx_gateway_event (gateway, event_type),
    INDEX idx_processing (processing_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. HISTÓRICO DE AUDITORIA DETALHADO
-- Expandir tabela de atividades para incluir mais contexto
ALTER TABLE crm_activities 
ADD COLUMN IF NOT EXISTS changed_by_user_id INT COMMENT 'Quem fez a ação',
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS before_value TEXT COMMENT 'Valor anterior',
ADD COLUMN IF NOT EXISTS after_value TEXT COMMENT 'Novo valor',
ADD COLUMN IF NOT EXISTS change_reason VARCHAR(255) COMMENT 'Motivo da mudança';

-- Índice para auditoria por usuário
CREATE INDEX IF NOT EXISTS idx_audit_user ON crm_activities(changed_by_user_id, created_at DESC);

-- 7. EDIÇÃO EM MASSA (Bulk Actions Log)
CREATE TABLE IF NOT EXISTS crm_bulk_actions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action_type ENUM('move_stage', 'assign_seller', 'send_message', 'toggle_bot', 'tag_leads') NOT NULL,
    affected_leads_count INT DEFAULT 0,
    lead_ids JSON COMMENT 'Array de IDs dos leads afetados',
    parameters JSON COMMENT 'Parâmetros da ação (ex: novo stage_id, mensagem)',
    execution_status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
    started_at DATETIME,
    completed_at DATETIME,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_bulk_status (execution_status, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. REMARKETING AUTOMÁTICO (Recuperação de Leads)
CREATE TABLE IF NOT EXISTS crm_remarketing_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    stage_id INT COMMENT 'Aplicar em qual estágio',
    hours_inactive INT DEFAULT 48 COMMENT 'Horas de inatividade para disparar',
    message_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    times_triggered INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES crm_stages(id) ON DELETE CASCADE,
    INDEX idx_active_rules (is_active, stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log de execuções de remarketing
CREATE TABLE IF NOT EXISTS crm_remarketing_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rule_id INT NOT NULL,
    lead_id INT NOT NULL,
    message_sent TEXT,
    sent_at DATETIME,
    lead_responded BOOLEAN DEFAULT FALSE,
    responded_at DATETIME,
    FOREIGN KEY (rule_id) REFERENCES crm_remarketing_rules(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
    INDEX idx_remarketing_leads (lead_id, sent_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. CONFIGURAÇÕES DE SLA POR ESTÁGIO
CREATE TABLE IF NOT EXISTS crm_stage_sla_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stage_id INT NOT NULL,
    sla_minutes INT DEFAULT 15 COMMENT 'Tempo máximo de resposta em minutos',
    auto_redistribute BOOLEAN DEFAULT FALSE COMMENT 'Redistribuir automaticamente se estourar SLA',
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stage_id) REFERENCES crm_stages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_stage_sla (stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir configurações padrão de SLA para estágios existentes
INSERT INTO crm_stage_sla_config (stage_id, sla_minutes, auto_redistribute, notification_enabled)
SELECT id, 15, FALSE, TRUE FROM crm_stages 
WHERE id NOT IN (SELECT stage_id FROM crm_stage_sla_config)
ON DUPLICATE KEY UPDATE stage_id = stage_id;

-- 10. COMISSÕES (Tracking Financeiro)
CREATE TABLE IF NOT EXISTS crm_commissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lead_id INT NOT NULL,
    seller_user_id INT NOT NULL,
    sale_value DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10.00 COMMENT 'Percentual de comissão',
    commission_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'pending',
    payment_gateway VARCHAR(50),
    transaction_id VARCHAR(255),
    sale_date DATETIME NOT NULL,
    approved_at DATETIME COMMENT 'Data de aprovação do pagamento',
    paid_at DATETIME COMMENT 'Data que foi pago ao vendedor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_seller_commissions (seller_user_id, status),
    INDEX idx_pending_commissions (status, approved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View para cálculo rápido de comissões
CREATE OR REPLACE VIEW v_crm_seller_commissions AS
SELECT 
    u.id as seller_id,
    u.name as seller_name,
    COUNT(c.id) as total_sales,
    SUM(c.sale_value) as total_revenue,
    SUM(c.commission_amount) as total_commissions,
    SUM(CASE WHEN c.status = 'pending' THEN c.commission_amount ELSE 0 END) as pending_commission,
    SUM(CASE WHEN c.status = 'approved' THEN c.commission_amount ELSE 0 END) as approved_commission,
    SUM(CASE WHEN c.status = 'paid' THEN c.commission_amount ELSE 0 END) as paid_commission
FROM users u
LEFT JOIN crm_commissions c ON u.id = c.seller_user_id
GROUP BY u.id, u.name;

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_lead_last_activity ON crm_leads(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_temperature_score ON crm_leads(temperature, score DESC);
CREATE INDEX IF NOT EXISTS idx_activities_lead_date ON crm_activities(lead_id, created_at DESC);

COMMIT;
