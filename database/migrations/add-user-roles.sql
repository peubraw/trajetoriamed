-- ======================================
-- Migração: Sistema de Roles de Usuários
-- Adiciona controle de acesso para Admin e Vendedores
-- ======================================

USE wppbot_saas;

-- Adicionar coluna de role na tabela users
ALTER TABLE users 
ADD COLUMN role ENUM('admin', 'seller') DEFAULT 'admin' 
COMMENT 'Tipo de usuário: admin (acesso total) ou seller (apenas leads designados)';

-- Adicionar índice para melhor performance em queries de permissão
ALTER TABLE users ADD INDEX idx_role (role);

-- Adicionar coluna para identificar o admin principal (dono da conta)
ALTER TABLE users 
ADD COLUMN parent_user_id INT NULL 
COMMENT 'ID do admin que criou este vendedor (NULL para admins principais)';

ALTER TABLE users 
ADD CONSTRAINT fk_parent_user 
FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Garantir que usuários existentes sejam admins
UPDATE users SET role = 'admin' WHERE role IS NULL;

-- Criar tabela de configuração de permissões (para futuras expansões)
CREATE TABLE IF NOT EXISTS user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    permission VARCHAR(100) NOT NULL COMMENT 'Nome da permissão',
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_permission (user_id, permission),
    INDEX idx_user_permission (user_id, permission)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir permissões padrão para funcionalidades futuras
-- Exemplos: 'view_all_leads', 'edit_all_leads', 'manage_sellers', 'view_reports', etc.

-- Adicionar índice adicional em crm_leads para queries de vendedor
ALTER TABLE crm_leads ADD INDEX idx_user_assigned (user_id, assigned_to);

-- ======================================
-- VIEWS para facilitar queries
-- ======================================

-- View para vendedores e seus admins
CREATE OR REPLACE VIEW v_users_hierarchy AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.parent_user_id,
    p.name as parent_name,
    p.email as parent_email
FROM users u
LEFT JOIN users p ON u.parent_user_id = p.id;

-- View para leads com informações de vendedor
CREATE OR REPLACE VIEW v_leads_with_sellers AS
SELECT 
    l.*,
    u.name as owner_name,
    u.email as owner_email,
    s.name as seller_name,
    s.email as seller_email,
    s.role as seller_role,
    st.name as stage_name,
    st.color as stage_color,
    st.conversion_probability
FROM crm_leads l
LEFT JOIN users u ON l.user_id = u.id
LEFT JOIN users s ON l.assigned_to = s.id
LEFT JOIN crm_stages st ON l.stage_id = st.id;
