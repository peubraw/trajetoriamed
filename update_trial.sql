UPDATE users SET trial_ends_at = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE email = 'peubraw@gmail.com';
SELECT email, trial_ends_at FROM users WHERE email = 'peubraw@gmail.com';
