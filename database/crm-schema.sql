-- ======================================
-- CRM KANBAN - Schema Completo
-- Sistema de Gestão de Leads e Pipeline
-- ======================================

USE wppbot_saas;

-- Tabela de estágios do funil (Colunas do Kanban)
CREATE TABLE IF NOT EXISTS crm_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    position INT NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    bot_enabled BOOLEAN DEFAULT FALSE,
    conversion_probability DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Probabilidade de fechamento (%)',
    is_success BOOLEAN DEFAULT FALSE COMMENT 'Se é etapa de sucesso (venda confirmada)',
    is_lost BOOLEAN DEFAULT FALSE COMMENT 'Se é etapa de perda',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_position (user_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela principal de Leads (Cards do Kanban)
CREATE TABLE IF NOT EXISTS crm_leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Proprietário do sistema',
    phone VARCHAR(20) NOT NULL COMMENT 'WhatsApp/Telefone do lead',
    name VARCHAR(255),
    email VARCHAR(255),
    state VARCHAR(2) COMMENT 'Estado (UF)',
    rqe VARCHAR(50) COMMENT 'RQE do médico',
    specialty VARCHAR(100) COMMENT 'Especialidade médica',
    
    -- Gestão
    stage_id INT NOT NULL,
    assigned_to INT COMMENT 'Vendedor responsável',
    channel ENUM('whatsapp', 'instagram', 'facebook', 'website', 'manual') DEFAULT 'whatsapp',
    source VARCHAR(255) COMMENT 'Link ou campanha de origem',
    
    -- Interesse e curso
    interested_course VARCHAR(100),
    course_selected VARCHAR(100),
    is_former_student BOOLEAN DEFAULT FALSE COMMENT 'Ex-aluno',
    
    -- Status do Bot
    bot_active BOOLEAN DEFAULT TRUE,
    bot_paused_at TIMESTAMP NULL,
    bot_paused_by INT NULL COMMENT 'Quem pausou o bot',
    bot_last_action VARCHAR(255) COMMENT 'Última ação do bot',
    
    -- Financeiro
    potential_value DECIMAL(10,2) DEFAULT 0.00,
    final_value DECIMAL(10,2) NULL COMMENT 'Valor fechado',
    payment_status ENUM('pending', 'waiting', 'confirmed', 'failed') NULL,
    payment_link VARCHAR(500),
    payment_method VARCHAR(50),
    
    -- Scoring e temperatura
    score INT DEFAULT 0 COMMENT 'Pontuação do lead (0-100)',
    temperature ENUM('cold', 'warm', 'hot') DEFAULT 'warm',
    temperature_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- SLA e controle de tempo
    last_contact_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_response_at TIMESTAMP NULL COMMENT 'Última resposta do lead',
    sla_alert BOOLEAN DEFAULT FALSE,
    sla_deadline TIMESTAMP NULL,
    
    -- Motivo de perda
    lost_reason VARCHAR(255) NULL,
    lost_details TEXT NULL,
    
    -- Timestamps e observações
    notes TEXT,
    tags VARCHAR(500) COMMENT 'Tags separadas por vírgula',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    converted_at TIMESTAMP NULL COMMENT 'Data de conversão',
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES crm_stages(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (bot_paused_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_phone_user (phone, user_id),
    INDEX idx_stage (stage_id),
    INDEX idx_assigned (assigned_to),
    INDEX idx_temperature (temperature),
    INDEX idx_last_contact (last_contact_at),
    INDEX idx_score (score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de atividades/histórico do lead
CREATE TABLE IF NOT EXISTS crm_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'Quem executou a ação',
    activity_type ENUM(
        'message_sent', 'message_received', 'stage_changed', 
        'bot_paused', 'bot_resumed', 'note_added', 
        'assigned', 'email_sent', 'call_made',
        'meeting_scheduled', 'payment_received'
    ) NOT NULL,
    description TEXT,
    metadata JSON COMMENT 'Dados adicionais (ex: stage anterior)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lead_date (lead_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de notas do vendedor
CREATE TABLE IF NOT EXISTS crm_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'Autor da nota',
    note TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lead (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de tags personalizadas
CREATE TABLE IF NOT EXISTS crm_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#64748B',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tag_user (name, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de follow-ups agendados
CREATE TABLE IF NOT EXISTS crm_followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'Responsável pelo follow-up',
    scheduled_at TIMESTAMP NOT NULL,
    message_template TEXT,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_scheduled (scheduled_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de áudios rápidos (biblioteca)
CREATE TABLE IF NOT EXISTS crm_quick_audios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    audio_url VARCHAR(500),
    duration_seconds INT,
    use_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configurações do CRM por usuário
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

-- Tabela de webhooks para integração com gateways de pagamento
CREATE TABLE IF NOT EXISTS crm_webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL COMMENT 'payment.approved, payment.failed, etc',
    payload JSON NOT NULL,
    lead_id INT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE SET NULL,
    INDEX idx_processed (processed, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================
-- INSERIR ESTÁGIOS PADRÃO
-- ======================================

-- Função para criar estágios padrão para cada usuário
-- (Isso será executado via migration ou API quando um novo usuário for criado)

-- Exemplo para o Leandro (assumindo user_id = 1):
INSERT INTO crm_stages (user_id, name, position, color, bot_enabled, conversion_probability) VALUES
(1, 'Novos / Triagem', 1, '#6366F1', TRUE, 5.00),
(1, 'Nutrição / Apresentação', 2, '#3B82F6', TRUE, 15.00),
(1, 'Quente / Link Enviado', 3, '#F59E0B', FALSE, 60.00),
(1, 'Em Negociação', 4, '#EF4444', FALSE, 80.00),
(1, 'Aguardando Pagamento', 5, '#8B5CF6', FALSE, 90.00),
(1, 'Venda Confirmada', 6, '#10B981', FALSE, 100.00),
(1, 'Perdido / Arquivado', 7, '#6B7280', FALSE, 0.00)
ON DUPLICATE KEY UPDATE name=name;

-- Marcar estágios especiais
UPDATE crm_stages SET is_success = TRUE WHERE name = 'Venda Confirmada';
UPDATE crm_stages SET is_lost = TRUE WHERE name = 'Perdido / Arquivado';

-- ======================================
-- VIEWS PARA DASHBOARD
-- ======================================

-- View de pipeline ponderado (forecast)
CREATE OR REPLACE VIEW v_crm_pipeline AS
SELECT 
    l.user_id,
    l.assigned_to,
    s.name AS stage_name,
    s.conversion_probability,
    COUNT(l.id) AS lead_count,
    SUM(l.potential_value) AS total_potential,
    SUM(l.potential_value * s.conversion_probability / 100) AS weighted_value
FROM crm_leads l
INNER JOIN crm_stages s ON l.stage_id = s.id
WHERE s.is_lost = FALSE AND s.is_success = FALSE
GROUP BY l.user_id, l.assigned_to, s.name, s.conversion_probability;

-- View de conversão por vendedor
CREATE OR REPLACE VIEW v_crm_seller_stats AS
SELECT 
    l.user_id,
    l.assigned_to,
    u.name AS seller_name,
    COUNT(DISTINCT l.id) AS total_leads,
    COUNT(DISTINCT CASE WHEN s.is_success THEN l.id END) AS won_leads,
    COUNT(DISTINCT CASE WHEN s.is_lost THEN l.id END) AS lost_leads,
    SUM(CASE WHEN s.is_success THEN l.final_value ELSE 0 END) AS total_revenue,
    ROUND(COUNT(CASE WHEN s.is_success THEN 1 END) * 100.0 / NULLIF(COUNT(l.id), 0), 2) AS conversion_rate
FROM crm_leads l
INNER JOIN crm_stages s ON l.stage_id = s.id
LEFT JOIN users u ON l.assigned_to = u.id
WHERE l.assigned_to IS NOT NULL
GROUP BY l.user_id, l.assigned_to, u.name;

-- View de motivos de perda
CREATE OR REPLACE VIEW v_crm_lost_reasons AS
SELECT 
    l.user_id,
    l.lost_reason,
    COUNT(*) AS count,
    SUM(l.potential_value) AS total_lost_value
FROM crm_leads l
INNER JOIN crm_stages s ON l.stage_id = s.id
WHERE s.is_lost = TRUE AND l.lost_reason IS NOT NULL
GROUP BY l.user_id, l.lost_reason
ORDER BY count DESC;

-- ======================================
-- TRIGGERS
-- ======================================

-- Atualizar last_activity_at quando houver mudança
DELIMITER $$
CREATE TRIGGER trg_update_lead_activity
BEFORE UPDATE ON crm_leads
FOR EACH ROW
BEGIN
    IF OLD.stage_id != NEW.stage_id 
       OR OLD.notes != NEW.notes 
       OR OLD.bot_active != NEW.bot_active THEN
        SET NEW.last_activity_at = CURRENT_TIMESTAMP;
    END IF;
END$$
DELIMITER ;

-- Registrar mudança de estágio automaticamente
DELIMITER $$
CREATE TRIGGER trg_log_stage_change
AFTER UPDATE ON crm_leads
FOR EACH ROW
BEGIN
    IF OLD.stage_id != NEW.stage_id THEN
        INSERT INTO crm_activities (lead_id, user_id, activity_type, description, metadata)
        VALUES (
            NEW.id,
            NEW.assigned_to,
            'stage_changed',
            CONCAT('Movido de ', (SELECT name FROM crm_stages WHERE id = OLD.stage_id), 
                   ' para ', (SELECT name FROM crm_stages WHERE id = NEW.stage_id)),
            JSON_OBJECT('old_stage', OLD.stage_id, 'new_stage', NEW.stage_id)
        );
    END IF;
END$$
DELIMITER ;

-- ======================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ======================================

ALTER TABLE crm_leads ADD FULLTEXT INDEX ft_search (name, email, notes, tags);
ALTER TABLE crm_activities ADD INDEX idx_type_date (activity_type, created_at DESC);

-- ======================================
-- FIM DO SCHEMA
-- ======================================
