# Deploy Simplificado via Git
# Este script faz commit e push, e então puxa as alterações no servidor

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           DEPLOY VIA GIT - META WHATSAPP API                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$REMOTE_USER = "root"
$REMOTE_HOST = "165.22.158.58"
$REMOTE_PATH = "/var/www/wppbot"

# 1. Verificar mudanças locais
Write-Host "📝 Verificando alterações..." -ForegroundColor Yellow
git status --short

Write-Host ""
$commit = Read-Host "Digite a mensagem do commit (ou Enter para 'Deploy Meta API')"
if ([string]::IsNullOrWhiteSpace($commit)) {
    $commit = "Deploy Meta API - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

# 2. Commit e Push
Write-Host ""
Write-Host "📤 Fazendo commit e push..." -ForegroundColor Yellow
git add .
git commit -m "$commit"
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer push" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green

# 3. Pull no servidor
Write-Host ""
Write-Host "📥 Atualizando código no servidor..." -ForegroundColor Yellow
ssh $REMOTE_USER@$REMOTE_HOST @"
    cd $REMOTE_PATH
    
    echo '📥 Fazendo pull das alterações...'
    git pull origin main
    
    echo '📦 Instalando/atualizando dependências...'
    npm install --production
    
    echo '🔄 Reiniciando aplicação...'
    pm2 restart wppbot
    
    echo '✅ Deploy concluído!'
    
    echo ''
    echo '📊 Status da aplicação:'
    pm2 status wppbot
    
    echo ''
    echo '📋 Últimas 15 linhas do log:'
    pm2 logs wppbot --lines 15 --nostream
"@

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "                    DEPLOY CONCLUIDO!                           " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "TESTAR AGORA:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Envie uma mensagem WhatsApp para: +55 61 9903-3732" -ForegroundColor White
Write-Host "2. Acesse: https://165.22.158.58:3001" -ForegroundColor White
Write-Host "3. Ver logs no servidor" -ForegroundColor White
Write-Host ""
