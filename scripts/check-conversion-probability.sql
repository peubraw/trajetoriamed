SELECT id, name, conversion_probability, is_success, is_lost 
FROM crm_stages 
WHERE user_id=1 
ORDER BY position;
