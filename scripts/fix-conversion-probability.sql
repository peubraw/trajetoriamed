-- Atualizar conversion_probability com valores padrão baseados na posição
UPDATE crm_stages SET conversion_probability = 
  CASE name
    WHEN '🎯 Triagem' THEN 10
    WHEN '🥗 Nutrição' THEN 20
    WHEN '🔗 Link Enviado' THEN 40
    WHEN '💰 Negociação' THEN 60
    WHEN '⏳ Aguardando' THEN 80
    WHEN '✅ Confirmada' THEN 0  -- is_success = TRUE, não conta no pipeline
    WHEN '❌ Perdido' THEN 0     -- is_lost = TRUE, não conta no pipeline
    ELSE 50
  END
WHERE user_id = 1 AND conversion_probability IS NULL;

-- Verificar o resultado
SELECT id, name, conversion_probability, is_success, is_lost 
FROM crm_stages 
WHERE user_id=1 
ORDER BY position;
