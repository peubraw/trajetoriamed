#!/bin/bash
mysql -u root -p'Leviathan1986@' wppbot_saas <<EOF
UPDATE bot_configs 
SET courses_config = JSON_MERGE_PATCH('{}', LOAD_FILE('/tmp/config_with_flows.json'))
WHERE id = 1;
EOF

echo "✅ Configuração inserida no banco de dados!"
