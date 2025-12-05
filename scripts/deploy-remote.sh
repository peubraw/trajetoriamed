#!/bin/bash
# Deploy Completo - Execute no VPS via SSH
# ssh root@165.22.158.58 'bash -s' < deploy-remote.sh

set -e

VPS_PATH="/var/www/wppbot"
RESET_TEST=${1:-false}

echo "========================================="
echo "  DEPLOY WPPBOT - INICIANDO             "
echo "========================================="

cd $VPS_PATH

# Backup
echo "[BACKUP] Criando backup..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r tokens $BACKUP_DIR/ 2>/dev/null || true
cp .env $BACKUP_DIR/ 2>/dev/null || true
echo "[OK] Backup criado em $BACKUP_DIR"

# Atualizar código
echo "[GIT] Baixando atualizações..."
git fetch origin
git reset --hard origin/main
git pull origin main

# Instalar dependências
echo "[NPM] Instalando dependências..."
npm install --production

# Atualizar banco de dados
echo "[DB] Atualizando banco de dados..."
if [ -f "database/schema.sql" ]; then
    mysql -u wppbot -pwppbot@2025 wppbot_saas < database/schema.sql 2>/dev/null || true
    echo "[OK] Schema atualizado"
fi

# Executar script de atualização do prompt
if [ -f "scripts/update-leandro-prompt.sql" ]; then
    echo "[DB] Atualizando prompt do Leandro..."
    mysql -u wppbot -pwppbot@2025 wppbot_saas < scripts/update-leandro-prompt.sql 2>/dev/null
    echo "[OK] Prompt atualizado"
fi

# Reset do ambiente de teste (se solicitado)
if [ "$RESET_TEST" = "true" ]; then
    echo "[RESET] Resetando ambiente de teste..."
    
    # Limpar sessões do WhatsApp
    rm -rf tokens/session_1/* 2>/dev/null || true
    echo "[OK] Sessões do WhatsApp limpas"
    
    # SQL de reset
    mysql -u wppbot -pwppbot@2025 wppbot_saas << 'EOSQL'
SET @leandro_id = (SELECT id FROM users WHERE email = 'leandro.berti@gmail.com' LIMIT 1);
DELETE FROM messages WHERE user_id = @leandro_id;
DELETE FROM statistics WHERE user_id = @leandro_id;
UPDATE whatsapp_sessions SET status = 'disconnected', qr_code = NULL, phone_number = NULL WHERE user_id = @leandro_id;
SELECT CONCAT('[OK] Reset completo para usuario ID: ', @leandro_id) AS status;
EOSQL
    
    echo "[OK] Ambiente de teste resetado"
fi

# Reiniciar aplicação
echo "[PM2] Reiniciando aplicação..."
pm2 restart wppbot 2>/dev/null || pm2 start server.js --name wppbot --time
pm2 save

# Status
echo ""
echo "========================================="
echo "  DEPLOY CONCLUÍDO COM SUCESSO!         "
echo "========================================="
echo ""
pm2 status
echo ""
echo "[INFO] Aplicacao disponivel em: http://165.22.158.58"
echo "[INFO] Logs: pm2 logs wppbot"
echo ""
