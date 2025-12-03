# Script de deploy para Windows PowerShell
# Uso: .\deploy.ps1

Write-Host "🚀 Iniciando deploy para DigitalOcean..." -ForegroundColor Green

# Variáveis
$VPS_HOST = "165.22.158.58"
$VPS_USER = "root"
$VPS_PATH = "/var/www/wppbot"
$VPS_PASSWORD = "!Bouar4ngo"

# Verificar se git está instalado
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git não está instalado" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Fazendo commit local..." -ForegroundColor Yellow
git add .
git commit -m "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Host "⬆️  Enviando para GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "🔄 Conectando ao VPS e atualizando..." -ForegroundColor Yellow

# Comandos para executar no VPS
$commands = @"
cd /var/www/wppbot
echo '📥 Baixando atualizações...'
git pull origin main
echo '📦 Instalando dependências...'
npm install --production
echo '🔄 Reiniciando aplicação...'
pm2 restart wppbot || pm2 start server.js --name wppbot
pm2 save
echo '✅ Deploy concluído!'
pm2 status
"@

# Executar via SSH
if (Test-Path $SSH_KEY) {
    ssh -i $SSH_KEY "$VPS_USER@$VPS_HOST" $commands
} else {
    ssh "$VPS_USER@$VPS_HOST" $commands
}

Write-Host "🎉 Deploy finalizado com sucesso!" -ForegroundColor Green
