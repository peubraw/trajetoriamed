-- Script para criar um vendedor de teste
-- Use este script para criar um vendedor e testar o dashboard

USE wppbot_saas;

-- Criar vendedor de teste
-- Senha: 123456
INSERT INTO users (name, email, password, phone, role, parent_user_id, trial_end_date, is_active, subscription_status)
VALUES (
    'Vendedor Teste',
    'vendedor@teste.com',
    '$2a$10$8Z9qYZQZ9qYZQZ9qYZQZ9.VLqZ8Z9qYZQZ9qYZQZ9qYZQZ9qYZQZ9q', -- senha: 123456
    '11999999999',
    'seller',
    1, -- ID do admin que criou (ajuste se necessário)
    DATE_ADD(NOW(), INTERVAL 30 DAY),
    TRUE,
    'active'
);

-- Verificar vendedores criados
SELECT id, name, email, role, parent_user_id FROM users WHERE role = 'seller';
