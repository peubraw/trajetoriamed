# Script para instalar Git na VPS e configurar repositorio
# Execucao: .\scripts\setup-git-vps.ps1

$VPS_HOST = "165.22.158.58"
$VPS_USER = "root"
$VPS_PATH = "/var/www/wppbot"
$REPO_URL = "https://github.com/peubraw/trajetoriamed.git"

Write-Host "[*] Configurando Git na VPS..." -ForegroundColor Cyan

# 1. Instalar Git se nao estiver instalado
Write-Host "`n[1/7] Instalando Git na VPS..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "if ! command -v git > /dev/null 2>&1; then echo 'Instalando Git...'; apt-get update && apt-get install -y git; else echo 'Git ja instalado'; git --version; fi"

# 2. Verificar se ja existe repositorio Git
Write-Host "`n[2/7] Verificando repositorio existente..." -ForegroundColor Yellow
$repoExists = ssh "$VPS_USER@$VPS_HOST" "if [ -d $VPS_PATH/.git ]; then echo 'exists'; else echo 'not_exists'; fi"

if ($repoExists -match "exists") {
    Write-Host "Repositorio Git ja existe. Configurando remote..." -ForegroundColor Green
    ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && git remote set-url origin $REPO_URL 2>/dev/null || git remote add origin $REPO_URL && git config pull.rebase false && echo 'Remote configurado'"
} else {
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Yellow
    ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && git init && git remote add origin $REPO_URL && git config pull.rebase false && echo 'Repositorio inicializado'"
}

# 3. Fazer backup dos arquivos sensiveis antes do pull
Write-Host "`n[3/7] Fazendo backup de arquivos sensiveis..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && mkdir -p .backup-temp && cp .env .backup-temp/ 2>/dev/null; cp -r tokens .backup-temp/ 2>/dev/null; echo 'Backup criado'"

# 4. Fetch e pull do repositorio
Write-Host "`n[4/7] Baixando mudancas do repositorio..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && git fetch origin main && git reset --hard origin/main && echo 'Codigo atualizado'"

# 5. Restaurar arquivos sensiveis
Write-Host "`n[5/7] Restaurando arquivos sensiveis..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && cp .backup-temp/.env . 2>/dev/null; cp -r .backup-temp/tokens . 2>/dev/null; rm -rf .backup-temp && echo 'Arquivos restaurados'"

# 6. Instalar dependencias
Write-Host "`n[6/7] Instalando dependencias..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && npm install --production && echo 'Dependencias instaladas'"

# 7. Reiniciar servico
Write-Host "`n[7/7] Reiniciando servico..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && pm2 restart wppbot-saas 2>/dev/null || pm2 start server.js --name wppbot-saas; pm2 save && echo 'Servico reiniciado'"

Write-Host "`n[OK] Git configurado na VPS com sucesso!" -ForegroundColor Green
Write-Host "Para futuras atualizacoes, use: .\scripts\git-pull-vps.ps1" -ForegroundColor Cyan
