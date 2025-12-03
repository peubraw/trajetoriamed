# Deploy Direto via SCP - Sem Git
param(
    [switch]$ResetTest = $false
)

$VPS_HOST = "165.22.158.58"
$VPS_USER = "root"
$VPS_PATH = "/var/www/wppbot"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY DIRETO - SEM GIT               " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Arquivos e diretórios para enviar
$filesToCopy = @(
    "server.js",
    "package.json",
    "config",
    "database",
    "public",
    "routes",
    "services",
    "prompt-templates",
    "scripts"
)

Write-Host "[BACKUP] Fazendo backup remoto..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && mkdir -p backups/`$(date +%Y%m%d_%H%M%S) && cp -r tokens backups/`$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true"

Write-Host "[SCP] Enviando arquivos..." -ForegroundColor Yellow
foreach ($item in $filesToCopy) {
    if (Test-Path $item) {
        Write-Host "  -> $item" -ForegroundColor Gray
        if (Test-Path $item -PathType Container) {
            scp -r $item "$VPS_USER@${VPS_HOST}:$VPS_PATH/"
        } else {
            scp $item "$VPS_USER@${VPS_HOST}:$VPS_PATH/"
        }
    }
}

Write-Host "`n[NPM] Instalando dependências no VPS..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && npm install --production"

Write-Host "[DB] Atualizando banco de dados..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && mysql -u wppbot -pwppbot@2025 wppbot_saas < database/schema.sql 2>/dev/null || true"

if (Test-Path "scripts\update-leandro-prompt.sql") {
    Write-Host "[DB] Atualizando prompt do Leandro..." -ForegroundColor Yellow
    ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && mysql -u wppbot -pwppbot@2025 wppbot_saas < scripts/update-leandro-prompt.sql 2>/dev/null"
}

if ($ResetTest) {
    Write-Host "`n[RESET] Resetando ambiente de teste..." -ForegroundColor Yellow
    
    $resetSQL = @"
SET @leandro_id = (SELECT id FROM users WHERE email = 'leandro.berti@gmail.com' LIMIT 1);
DELETE FROM messages WHERE user_id = @leandro_id;
DELETE FROM statistics WHERE user_id = @leandro_id;
UPDATE whatsapp_sessions SET status = 'disconnected', qr_code = NULL, phone_number = NULL WHERE user_id = @leandro_id;
SELECT 'Reset completo executado' AS status;
"@
    
    $resetSQL | ssh "$VPS_USER@$VPS_HOST" "mysql -u wppbot -pwppbot@2025 wppbot_saas"
    
    ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && rm -rf tokens/session_1/* 2>/dev/null || true"
    
    Write-Host "[OK] Ambiente resetado!" -ForegroundColor Green
}

Write-Host "`n[PM2] Reiniciando aplicação..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && pm2 restart wppbot 2>/dev/null || pm2 start server.js --name wppbot --time && pm2 save"

Write-Host "`n[STATUS] Verificando aplicação..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "pm2 status"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  DEPLOY CONCLUÍDO COM SUCESSO!         " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "ACESSOS:" -ForegroundColor Cyan
Write-Host "  Web: http://$VPS_HOST" -ForegroundColor White
Write-Host "  SSH: ssh $VPS_USER@$VPS_HOST" -ForegroundColor White
Write-Host "  Senha: !Bouar4ngo" -ForegroundColor Yellow
Write-Host ""
Write-Host "LOGIN SISTEMA:" -ForegroundColor Cyan
Write-Host "  Email: leandro.berti@gmail.com" -ForegroundColor White
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "  1. Acesse http://$VPS_HOST" -ForegroundColor White
Write-Host "  2. Faça login" -ForegroundColor White
Write-Host "  3. Conecte o WhatsApp (escanear QR Code)" -ForegroundColor White
Write-Host "  4. Teste enviando mensagens" -ForegroundColor White
Write-Host ""

if ($ResetTest) {
    Write-Host "[AVISO] Ambiente foi resetado - Reconecte o WhatsApp!" -ForegroundColor Yellow
    Write-Host ""
}
