-- ========================================
-- MIGRATION: Milestone 2 - Kanban Inteligente
-- Ajustar percentuais de conversão das etapas
-- Data: 05/12/2025
-- ========================================

USE wppbot_saas;

-- Atualizar percentuais conforme especificação do Milestone 2
UPDATE crm_stages 
SET conversion_probability = CASE 
    WHEN name LIKE '%Triagem%' OR name LIKE '%Novos%' THEN 10.00
    WHEN name LIKE '%Nutrição%' OR name LIKE '%Apresentação%' THEN 30.00
    WHEN name LIKE '%Link%' OR name LIKE '%Quente%' THEN 80.00
    WHEN name LIKE '%Negociação%' THEN 60.00
    WHEN name LIKE '%Aguardando%' OR name LIKE '%Pagamento%' THEN 90.00
    WHEN is_success = 1 THEN 100.00
    WHEN is_lost = 1 THEN 0.00
    ELSE conversion_probability
END;

-- Verificar resultado
SELECT id, name, conversion_probability, bot_enabled, is_success, is_lost 
FROM crm_stages 
WHERE user_id = 1 
ORDER BY position;

-- Log de sucesso
SELECT '✅ Percentuais de conversão atualizados!' AS status;
