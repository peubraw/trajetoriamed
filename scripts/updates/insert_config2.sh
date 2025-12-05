#!/bin/bash

# Ler o JSON
CONFIG=$(cat /tmp/config_with_flows.json)

# Escapar aspas simples
CONFIG_ESCAPED=$(echo "$CONFIG" | sed "s/'/''/g")

# Inserir no banco
mysql -u root -p'Leviathan1986@' wppbot_saas -e "UPDATE bot_configs SET courses_config = '$CONFIG_ESCAPED' WHERE id = 1;"

echo "✅ Configuração inserida!"

# Verificar
mysql -u root -p'Leviathan1986@' wppbot_saas -e "SELECT JSON_LENGTH(courses_config, '$.courses') as total_courses FROM bot_configs WHERE id=1;"
