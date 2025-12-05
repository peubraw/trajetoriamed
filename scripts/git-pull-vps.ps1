# Script rapido para fazer pull das mudancas na VPS
# Execucao: .\scripts\git-pull-vps.ps1

$VPS_HOST = "165.22.158.58"
$VPS_USER = "root"
$VPS_PATH = "/var/www/wppbot"

Write-Host "[*] Atualizando codigo na VPS via Git..." -ForegroundColor Cyan

# Backup de arquivos sensiveis
Write-Host "`n[1/5] Backup de arquivos sensiveis..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && mkdir -p .backup-temp && cp .env .backup-temp/ 2>/dev/null; cp -r tokens .backup-temp/ 2>/dev/null"

# Pull das mudancas
Write-Host "`n[2/5] Fazendo git pull..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && git fetch origin main && git reset --hard origin/main"

# Restaurar arquivos sensiveis
Write-Host "`n[3/5] Restaurando arquivos..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && cp .backup-temp/.env . 2>/dev/null; cp -r .backup-temp/tokens . 2>/dev/null; rm -rf .backup-temp"

# Instalar novas dependencias se houver
Write-Host "`n[4/5] Verificando dependencias..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && npm install --production"

# Reiniciar servico
Write-Host "`n[5/5] Reiniciando servico..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && pm2 restart wppbot-saas; pm2 save"

Write-Host "`n[OK] Atualizacao concluida!" -ForegroundColor Green
Write-Host "Status: " -NoNewline
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && pm2 status wppbot-saas"
