# Script de Deploy Completo para VPS Linux
# Inclui: Upload de código, atualização do banco, reset do ambiente de teste

param(
    [Parameter(Mandatory=$false)]
    [switch]$ResetTest = $false,
    [Parameter(Mandatory=$false)]
    [switch]$SkipGit = $false
)

# Configurações do VPS
$VPS_HOST = "165.22.158.58"
$VPS_USER = "root"
$VPS_PASSWORD = "!Bouar4ngo"
$VPS_PATH = "/var/www/wppbot"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY COMPLETO - VPS DIGITALOCEAN   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Host: $VPS_HOST" -ForegroundColor White
Write-Host "Path: $VPS_PATH" -ForegroundColor White
Write-Host "Reset Test: $ResetTest" -ForegroundColor White
Write-Host ""

# 1. Commit e Push (se não skipado)
if (-not $SkipGit) {
    Write-Host "[GIT] Fazendo commit e push..." -ForegroundColor Yellow
    git add .
    $commitMsg = "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git commit -m $commitMsg -a 2>$null
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Código enviado para GitHub" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] Sem alterações para commit ou erro no push" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Skip Git habilitado" -ForegroundColor Cyan
}

# 2. Preparar script de deploy para o VPS
Write-Host "`n[VPS] Preparando script de deploy..." -ForegroundColor Yellow

$deployScript = @"
#!/bin/bash
set -e

echo "========================================="
echo "  DEPLOY WPPBOT - ATUALIZANDO SERVIDOR  "
echo "========================================="

cd $VPS_PATH

# Backup antes de atualizar
echo "[BACKUP] Criando backup..."
BACKUP_DIR="backups/\$(date +%Y%m%d_%H%M%S)"
mkdir -p \$BACKUP_DIR
cp -r tokens \$BACKUP_DIR/ 2>/dev/null || true
cp .env \$BACKUP_DIR/ 2>/dev/null || true
echo "[OK] Backup criado em \$BACKUP_DIR"

# Atualizar código
echo "[GIT] Baixando atualizações..."
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

# Executar script de atualização do prompt (se existir)
if [ -f "scripts/update-leandro-prompt.sql" ]; then
    echo "[DB] Atualizando prompt do Leandro..."
    mysql -u wppbot -pwppbot@2025 wppbot_saas < scripts/update-leandro-prompt.sql
    echo "[OK] Prompt atualizado"
fi

# Reset do ambiente de teste (se solicitado)
if [ "$ResetTest" = "True" ]; then
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
SELECT CONCAT('[OK] Reset completo para usuário ID: ', @leandro_id) AS status;
EOSQL
    
    echo "[OK] Ambiente de teste resetado"
fi

# Reiniciar aplicação
echo "[PM2] Reiniciando aplicação..."
pm2 restart wppbot || pm2 start server.js --name wppbot --time
pm2 save

# Status
echo ""
echo "========================================="
echo "  DEPLOY CONCLUÍDO COM SUCESSO!         "
echo "========================================="
echo ""
pm2 status
echo ""
echo "[INFO] Aplicação disponível em: http://$VPS_HOST"
echo "[INFO] Logs: pm2 logs wppbot"
"@

# Salvar script temporário
$tempScript = "$env:TEMP\deploy-vps-$(Get-Date -Format 'yyyyMMddHHmmss').sh"
$deployScript | Out-File -FilePath $tempScript -Encoding ASCII -NoNewline

# 3. Enviar e executar no VPS
Write-Host "[VPS] Conectando e executando deploy..." -ForegroundColor Yellow
Write-Host ""

# Criar comando SSH
$sshCommand = @"
cat > /tmp/deploy.sh << 'EODEPLOY'
$deployScript
EODEPLOY
chmod +x /tmp/deploy.sh
bash /tmp/deploy.sh
"@

# Executar via SSH
try {
    # Tentar com senha (usando sshpass se disponível, senão SSH interativo)
    if (Get-Command sshpass -ErrorAction SilentlyContinue) {
        $sshCommand | sshpass -p $VPS_PASSWORD ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST"
    } else {
        Write-Host "[INFO] Digite a senha quando solicitado: $VPS_PASSWORD" -ForegroundColor Cyan
        $sshCommand | ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST"
    }
    
    Write-Host "`n[OK] Deploy executado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "`n[ERRO] Falha ao conectar no VPS: $_" -ForegroundColor Red
    exit 1
} finally {
    # Limpar arquivo temporário
    if (Test-Path $tempScript) {
        Remove-Item $tempScript -Force
    }
}

# 4. Resumo final
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  DEPLOY FINALIZADO                     " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nACESSOS:" -ForegroundColor Cyan
Write-Host "  Web: http://$VPS_HOST" -ForegroundColor White
Write-Host "  SSH: ssh $VPS_USER@$VPS_HOST" -ForegroundColor White
Write-Host "`nCOMANDOS ÚTEIS NO VPS:" -ForegroundColor Cyan
Write-Host "  pm2 logs wppbot --lines 100" -ForegroundColor White
Write-Host "  pm2 restart wppbot" -ForegroundColor White
Write-Host "  pm2 monit" -ForegroundColor White
Write-Host "  cd $VPS_PATH" -ForegroundColor White
Write-Host "`nLOGIN SISTEMA:" -ForegroundColor Cyan
Write-Host "  Email: leandro.berti@gmail.com" -ForegroundColor White
Write-Host "  (Use a senha cadastrada no sistema)" -ForegroundColor White

if ($ResetTest) {
    Write-Host "`n[RESET] Ambiente de teste foi resetado!" -ForegroundColor Yellow
    Write-Host "  - Todas as mensagens deletadas" -ForegroundColor White
    Write-Host "  - Estatísticas resetadas" -ForegroundColor White
    Write-Host "  - Sessão WhatsApp desconectada" -ForegroundColor White
    Write-Host "  - Prompt MASTER atualizado" -ForegroundColor White
}

Write-Host ""
