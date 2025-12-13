-- Adicionar coluna file_name para armazenar nome do arquivo original
USE wppbot_saas;

-- Adicionar coluna file_name após media_mimetype
ALTER TABLE crm_chat_messages 
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) NULL COMMENT 'Nome original do arquivo' 
AFTER media_mimetype;

SELECT '✅ Coluna file_name adicionada com sucesso!' as result;
