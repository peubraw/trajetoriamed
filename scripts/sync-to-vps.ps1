# Script para sincronizar codigo local com VPS via rsync
# Mais simples e rapido que Git para repositorios privados
# Execucao: .\scripts\sync-to-vps.ps1

$VPS_HOST = "165.22.158.58"
$VPS_USER = "root"
$VPS_PATH = "/var/www/wppbot"
$LOCAL_PATH = "C:\xampp\htdocs\projetos\wppbot"

Write-Host "[*] Sincronizando codigo local com VPS..." -ForegroundColor Cyan

# Arquivos e pastas para excluir
$excludes = @(
    ".git",
    "node_modules",
    ".env",
    ".env.*",
    "tokens",
    "sql-backups",
    "*.log",
    ".vscode"
)

# Fazer backup na VPS antes de sincronizar
Write-Host "`n[1/4] Fazendo backup na VPS..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && mkdir -p .backup-temp && cp .env .backup-temp/ 2>/dev/null; cp -r tokens .backup-temp/ 2>/dev/null"

# Criar arquivo temporario de exclusoes para rsync
$excludeFile = "$env:TEMP\rsync-exclude-$((Get-Date).Ticks).txt"
$excludes | ForEach-Object { $_ } | Out-File -FilePath $excludeFile -Encoding ASCII

# Sincronizar arquivos via rsync sobre SSH
Write-Host "`n[2/4] Sincronizando arquivos..." -ForegroundColor Yellow

# Usar scp recursivo se rsync nao estiver disponivel no Windows
Write-Host "Enviando arquivos via SCP..." -ForegroundColor Gray

# Pastas principais a sincronizar
$folders = @("config", "database", "docs", "prompt-templates", "public", "routes", "scripts", "services")
$files = @("server.js", "package.json", "package-lock.json", "README.md", "LICENSE", "start.bat", "install.bat")

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "  -> Sincronizando $folder..." -ForegroundColor DarkGray
        scp -r "$folder" "${VPS_USER}@${VPS_HOST}:$VPS_PATH/"
    }
}

foreach ($file in $files) {
    if (Test-Path $file) {
        scp "$file" "${VPS_USER}@${VPS_HOST}:$VPS_PATH/"
    }
}

Remove-Item $excludeFile -ErrorAction SilentlyContinue

# Restaurar arquivos sensiveis
Write-Host "`n[3/4] Restaurando arquivos sensiveis..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && cp .backup-temp/.env . 2>/dev/null; cp -r .backup-temp/tokens . 2>/dev/null; rm -rf .backup-temp"

# Instalar dependencias e reiniciar
Write-Host "`n[4/4] Instalando dependencias e reiniciando..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_HOST" "cd $VPS_PATH && npm install --production && pm2 restart wppbot-saas; pm2 save"

Write-Host "`n[OK] Sincronizacao concluida!" -ForegroundColor Green
Write-Host "Status: " -NoNewline
ssh "$VPS_USER@$VPS_HOST" "pm2 status wppbot-saas"
