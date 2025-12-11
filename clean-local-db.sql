-- Limpar banco de dados local mantendo apenas leandro.berti
USE wppbot_saas;

-- Mostrar usuários atuais
SELECT id, name, email FROM users;

-- Deletar todos exceto leandro.berti (assumindo ID = 1)
-- DELETE FROM users WHERE email != 'leandro.berti@gmail.com';

-- Verificar resultado
-- SELECT id, name, email FROM users;
