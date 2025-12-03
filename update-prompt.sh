#!/bin/bash
# Script para atualizar prompt no banco de dados

cd /var/www/wppbot

echo "[1/3] Lendo arquivo do prompt..."
PROMPT_FILE="prompt-templates/MASTER-Bot-Trajetoria-Med-UNIFIED.txt"

if [ ! -f "$PROMPT_FILE" ]; then
    echo "[ERRO] Arquivo não encontrado: $PROMPT_FILE"
    exit 1
fi

PROMPT_SIZE=$(wc -c < "$PROMPT_FILE")
echo "[OK] Arquivo encontrado: $PROMPT_SIZE bytes"

echo "[2/3] Criando SQL temporário..."
TMP_SQL="/tmp/update-prompt-$$.sql"

# Criar arquivo SQL com o prompt escapado
cat > "$TMP_SQL" << 'EOSQL'
SET @user_id = (SELECT id FROM users WHERE email = 'leandro.berti@gmail.com');
SET @prompt_content = 'PROMPT_PLACEHOLDER';

UPDATE bot_configs 
SET system_prompt = @prompt_content, 
    updated_at = NOW() 
WHERE user_id = @user_id;

SELECT 
    'Prompt Atualizado' as status,
    bot_name,
    LENGTH(system_prompt) as prompt_size,
    updated_at
FROM bot_configs 
WHERE user_id = @user_id;
EOSQL

# Substituir o placeholder pelo conteúdo do arquivo (escapando aspas)
PROMPT_CONTENT=$(cat "$PROMPT_FILE" | sed "s/'/''/g")
sed -i "s/PROMPT_PLACEHOLDER/$PROMPT_CONTENT/" "$TMP_SQL"

echo "[3/3] Executando atualização no banco..."
mysql -u wppbot -pwppbot@2025 wppbot_saas < "$TMP_SQL"

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo "✅ PROMPT ATUALIZADO COM SUCESSO!"
    echo "=================================="
else
    echo ""
    echo "[ERRO] Falha ao atualizar prompt"
fi

# Limpar arquivo temporário
rm -f "$TMP_SQL"
