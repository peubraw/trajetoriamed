-- ======================================
-- CHAT WHATSAPP INTEGRADO AO CRM
-- Sistema de Chat Completo para Admin e Vendedores
-- ======================================

USE wppbot_saas;

-- Tabela de mensagens do chat (histórico completo de conversas)
CREATE TABLE IF NOT EXISTS crm_chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relacionamentos
    user_id INT NOT NULL COMMENT 'Proprietário do sistema/bot',
    lead_id INT NULL COMMENT 'Lead relacionado (se existir no CRM)',
    phone VARCHAR(20) NOT NULL COMMENT 'Telefone do contato',
    
    -- Informações da mensagem
    message_id VARCHAR(255) NULL COMMENT 'ID único da mensagem no WhatsApp',
    message_type ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker') DEFAULT 'text',
    message_content TEXT NOT NULL COMMENT 'Conteúdo da mensagem',
    media_url VARCHAR(500) NULL COMMENT 'URL da mídia (se aplicável)',
    media_mimetype VARCHAR(100) NULL COMMENT 'Tipo MIME da mídia',
    file_name VARCHAR(255) NULL COMMENT 'Nome original do arquivo',
    caption TEXT NULL COMMENT 'Legenda da mídia',
    
    -- Direção e sender
    direction ENUM('inbound', 'outbound') NOT NULL COMMENT 'Entrada (recebida) ou Saída (enviada)',
    sender_type ENUM('lead', 'admin', 'seller', 'bot') NOT NULL COMMENT 'Quem enviou',
    sent_by INT NULL COMMENT 'ID do usuário que enviou (admin/vendedor)',
    
    -- Status e controle
    status ENUM('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'pending',
    is_read BOOLEAN DEFAULT FALSE COMMENT 'Se foi lida pelo destinatário',
    read_at TIMESTAMP NULL,
    
    -- Metadados
    error_message TEXT NULL COMMENT 'Mensagem de erro se falhou',
    metadata JSON NULL COMMENT 'Dados adicionais (localização, contato, etc)',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    
    -- Índices e relacionamentos
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_phone (user_id, phone),
    INDEX idx_lead (lead_id),
    INDEX idx_created (created_at DESC),
    INDEX idx_direction (direction),
    INDEX idx_status (status),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de conversas (agrupamento por contato)
CREATE TABLE IF NOT EXISTS crm_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relacionamentos
    user_id INT NOT NULL COMMENT 'Proprietário do sistema',
    lead_id INT NULL COMMENT 'Lead relacionado',
    phone VARCHAR(20) NOT NULL COMMENT 'Telefone do contato',
    
    -- Informações do contato
    contact_name VARCHAR(255) NULL,
    contact_avatar VARCHAR(500) NULL,
    
    -- Status da conversa
    assigned_to INT NULL COMMENT 'Vendedor responsável pela conversa',
    status ENUM('active', 'archived', 'closed') DEFAULT 'active',
    
    -- Contadores
    unread_count INT DEFAULT 0 COMMENT 'Mensagens não lidas',
    total_messages INT DEFAULT 0 COMMENT 'Total de mensagens',
    
    -- Última mensagem (para preview)
    last_message_content TEXT NULL,
    last_message_at TIMESTAMP NULL,
    last_message_direction ENUM('inbound', 'outbound') NULL,
    
    -- Tags e notas
    tags VARCHAR(500) NULL COMMENT 'Tags separadas por vírgula',
    notes TEXT NULL COMMENT 'Notas da conversa',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL,
    
    -- Índices e relacionamentos
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_user_phone (user_id, phone),
    INDEX idx_assigned (assigned_to),
    INDEX idx_status (status),
    INDEX idx_last_message (last_message_at DESC),
    INDEX idx_unread (unread_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de digitação em tempo real (typing indicators)
CREATE TABLE IF NOT EXISTS crm_chat_typing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'Quem está digitando',
    phone VARCHAR(20) NOT NULL,
    is_typing BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES crm_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_conversation (conversation_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View para facilitar consultas de mensagens com informações do lead
CREATE OR REPLACE VIEW vw_chat_messages_full AS
SELECT 
    m.*,
    l.name as lead_name,
    l.email as lead_email,
    l.stage_id,
    l.assigned_to as lead_assigned_to,
    l.temperature,
    l.score,
    u.name as sent_by_name,
    u.role as sent_by_role,
    s.name as stage_name
FROM crm_chat_messages m
LEFT JOIN crm_leads l ON m.lead_id = l.id
LEFT JOIN users u ON m.sent_by = u.id
LEFT JOIN crm_stages s ON l.stage_id = s.id;

-- View para conversas com informações agregadas
CREATE OR REPLACE VIEW vw_conversations_full AS
SELECT 
    c.*,
    l.name as lead_name,
    l.email as lead_email,
    l.stage_id,
    l.temperature,
    l.score,
    l.interested_course,
    a.name as assigned_to_name,
    a.email as assigned_to_email,
    s.name as stage_name,
    s.color as stage_color
FROM crm_conversations c
LEFT JOIN crm_leads l ON c.lead_id = l.id
LEFT JOIN users a ON c.assigned_to = a.id
LEFT JOIN crm_stages s ON l.stage_id = s.id;
