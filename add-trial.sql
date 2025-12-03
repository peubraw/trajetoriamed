UPDATE users 
SET trial_end_date = DATE_ADD(NOW(), INTERVAL 30 DAY) 
WHERE email = 'leandro.berti@gmail.com';

SELECT id, name, email, trial_end_date, 
       DATEDIFF(trial_end_date, NOW()) as dias_restantes
FROM users 
WHERE email = 'leandro.berti@gmail.com';
