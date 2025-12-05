-- Features Avançadas do CRM - Instalação Segura
-- Ignora erros se colunas/tabelas já existirem

-- 1. BIBLIOTECA DE ÁUDIOS RÁPIDOS
CREATE TABLE IF NOT EXISTS crm_quick_audios_library (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    audio_url VARCHAR(500) NOT NULL,
    duration_seconds INT DEFAULT 0,
    times_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_audios (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. WEBHOOKS DE PAGAMENTO - Log
CREATE TABLE IF NOT EXISTS crm_webhook_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    webhook_id INT,
    lead_id INT,
    gateway VARCHAR(50) COMMENT 'kiwify, hotmart, eduzz',
    event_type VARCHAR(100),
    payload JSON,
    processing_status ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
    INDEX idx_gateway_event (gateway, event_type),
    INDEX idx_processing (processing_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BULK ACTIONS (Edição em Massa)
CREATE TABLE IF NOT EXISTS crm_bulk_actions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action_type ENUM('move_stage', 'assign_seller', 'send_message', 'toggle_bot', 'tag_leads') NOT NULL,
    affected_leads_count INT DEFAULT 0,
    lead_ids JSON,
    parameters JSON,
    execution_status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
    started_at DATETIME,
    completed_at DATETIME,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_bulk_status (execution_status, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. REMARKETING AUTOMÁTICO
CREATE TABLE IF NOT EXISTS crm_remarketing_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    stage_id INT,
    hours_inactive INT DEFAULT 48,
    message_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    times_triggered INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES crm_stages(id) ON DELETE CASCADE,
    INDEX idx_active_rules (is_active, stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- 5. CONFIGURAÇÕES DE SLA POR ESTÁGIO
CREATE TABLE IF NOT EXISTS crm_stage_sla_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stage_id INT NOT NULL,
    sla_minutes INT DEFAULT 15,
    auto_redistribute BOOLEAN DEFAULT FALSE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stage_id) REFERENCES crm_stages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_stage_sla (stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. COMISSÕES
CREATE TABLE IF NOT EXISTS crm_commissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lead_id INT NOT NULL,
    seller_user_id INT NOT NULL,
    sale_value DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    commission_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'pending',
    payment_gateway VARCHAR(50),
    transaction_id VARCHAR(255),
    sale_date DATETIME NOT NULL,
    approved_at DATETIME,
    paid_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_seller_commissions (seller_user_id, status),
    INDEX idx_pending_commissions (status, approved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View de comissões por vendedor
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

-- Inserir SLA padrão para estágios existentes (ignora duplicados)
INSERT IGNORE INTO crm_stage_sla_config (stage_id, sla_minutes, auto_redistribute, notification_enabled)
SELECT id, 15, FALSE, TRUE FROM crm_stages;

COMMIT;
