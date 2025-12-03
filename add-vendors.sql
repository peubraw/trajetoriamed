-- Adicionar colunas de vendedores na tabela bot_configs
USE wppbot_saas;

-- Verificar e adicionar colunas (ignora erro se já existir)
ALTER TABLE bot_configs
ADD COLUMN vendor1_name VARCHAR(100) DEFAULT 'Nathalia';

ALTER TABLE bot_configs
ADD COLUMN vendor1_phone VARCHAR(20) DEFAULT '5531971102701';

ALTER TABLE bot_configs
ADD COLUMN vendor2_name VARCHAR(100) DEFAULT 'Vitória';

ALTER TABLE bot_configs
ADD COLUMN vendor2_phone VARCHAR(20) DEFAULT '5531985757508';

ALTER TABLE bot_configs
ADD COLUMN vendor3_name VARCHAR(100) DEFAULT 'João';

ALTER TABLE bot_configs
ADD COLUMN vendor3_phone VARCHAR(20) DEFAULT '5531973088916';

ALTER TABLE bot_configs
ADD COLUMN vendor4_name VARCHAR(100) DEFAULT 'Leandro';

ALTER TABLE bot_configs
ADD COLUMN vendor4_phone VARCHAR(20) DEFAULT '553187369717';

SELECT 'Colunas de vendedores adicionadas com sucesso!' AS message;
