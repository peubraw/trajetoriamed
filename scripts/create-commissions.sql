-- Criar comissão para venda do Roberto Lima (lead 7)
INSERT INTO crm_commissions 
(lead_id, seller_user_id, sale_value, commission_rate, commission_amount, status, payment_gateway, transaction_id, sale_date, approved_at)
VALUES 
(7, 1, 1850.00, 10.00, 185.00, 'approved', 'manual', 'MANUAL-001', NOW(), NOW());

-- Verificar comissões criadas
SELECT 
    c.id,
    l.name as lead_name,
    c.sale_value,
    c.commission_amount,
    c.status
FROM crm_commissions c
JOIN crm_leads l ON c.lead_id = l.id
WHERE c.seller_user_id = 1;
