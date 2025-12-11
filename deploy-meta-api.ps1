# Script de Deploy para Servidor Remoto - Meta WhatsApp API
# Execute: .\deploy-meta-api.ps1

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       DEPLOY WPPBOT - META WHATSAPP API - TrajetóriaMed       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$REMOTE_USER = "root"
$REMOTE_HOST = "165.22.158.58"
$REMOTE_PATH = "/var/www/wppbot"
$LOCAL_PATH = "c:\xampp\htdocs\projetos\wppbot"

# Arquivos e pastas essenciais para deploy
$filesToDeploy = @(
    "server.js",
    "package.json",
    ".env",
    "config/",
    "routes/",
    "services/",
    "middleware/",
    "public/",
    "prompt-templates/",
    "database/",
    "test-meta-send.js",
    "test-meta-diagnostico.js"
)

Write-Host "📋 CHECKLIST PRÉ-DEPLOY" -ForegroundColor Yellow
Write-Host ""

# 1. Verificar se está no diretório correto
Write-Host "1️⃣  Verificando diretório..." -NoNewline
if (Test-Path $LOCAL_PATH) {
    Write-Host " ✅" -ForegroundColor Green
    Set-Location $LOCAL_PATH
} else {
    Write-Host " ❌" -ForegroundColor Red
    Write-Host "   Diretório não encontrado: $LOCAL_PATH" -ForegroundColor Red
    exit 1
}

# 2. Verificar arquivo .env
Write-Host "2️⃣  Verificando .env..." -NoNewline
if (Test-Path ".env") {
    Write-Host " ✅" -ForegroundColor Green
    
    # Mostrar configurações da Meta API
    $envContent = Get-Content ".env" -Raw
    Write-Host ""
    Write-Host "   📱 Configurações Meta API:" -ForegroundColor Cyan
    if ($envContent -match 'META_PHONE_NUMBER_ID=(.+)') { 
        Write-Host "      Phone ID: $($matches[1].Trim())" -ForegroundColor Gray
    }
    if ($envContent -match 'META_WABA_ID=(.+)') { 
        Write-Host "      WABA ID: $($matches[1].Trim())" -ForegroundColor Gray
    }
    Write-Host ""
} else {
    Write-Host " ❌" -ForegroundColor Red
    Write-Host "   Arquivo .env não encontrado!" -ForegroundColor Red
    exit 1
}

# 3. Verificar dependências
Write-Host "3️⃣  Verificando node_modules..." -NoNewline
if (Test-Path "node_modules") {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ⚠️  Instalando..." -ForegroundColor Yellow
    npm install --silent
    Write-Host "   ✅ Dependências instaladas" -ForegroundColor Green
}

# 4. Testar conexão SSH
Write-Host "4️⃣  Testando conexão SSH..." -NoNewline
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes $REMOTE_USER@$REMOTE_HOST "echo OK" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ❌" -ForegroundColor Red
    Write-Host "   Não foi possível conectar ao servidor" -ForegroundColor Red
    Write-Host "   Certifique-se de que a chave SSH está configurada" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  INICIANDO DEPLOY...                           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# 5. Criar backup no servidor
Write-Host "📦 Criando backup no servidor..." -ForegroundColor Yellow
ssh $REMOTE_USER@$REMOTE_HOST @"
    if [ -d $REMOTE_PATH ]; then
        BACKUP_DIR=/var/www/backups/wppbot_\$(date +%Y%m%d_%H%M%S)
        mkdir -p /var/www/backups
        cp -r $REMOTE_PATH \$BACKUP_DIR
        echo '✅ Backup criado: '\$BACKUP_DIR
    else
        mkdir -p $REMOTE_PATH
        echo '✅ Diretório criado: $REMOTE_PATH'
    fi
"@

# 6. Sincronizar arquivos
Write-Host ""
Write-Host "🚀 Sincronizando arquivos com rsync..." -ForegroundColor Yellow

# Usar rsync (se disponível) ou SCP
$rsyncAvailable = Get-Command rsync -ErrorAction SilentlyContinue
if ($rsyncAvailable) {
    rsync -avz --progress `
        --exclude 'node_modules' `
        --exclude 'tokens' `
        --exclude '.git' `
        --exclude 'sql-backups' `
        --exclude 'tests' `
        --exclude '*.log' `
        $LOCAL_PATH/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Arquivos sincronizados com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao sincronizar arquivos" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  rsync não encontrado. Usando scp..." -ForegroundColor Yellow
    
    foreach ($item in $filesToDeploy) {
        if (Test-Path $item) {
            Write-Host "   Copiando: $item" -ForegroundColor Gray
            scp -r $item ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/
        }
    }
}

# 7. Instalar dependências no servidor
Write-Host ""
Write-Host "📦 Instalando dependências no servidor..." -ForegroundColor Yellow
ssh $REMOTE_USER@$REMOTE_HOST @"
    cd $REMOTE_PATH
    npm install --production
    echo '✅ Dependências instaladas'
"@

# 8. Configurar PM2
Write-Host ""
Write-Host "⚙️  Configurando PM2..." -ForegroundColor Yellow
ssh $REMOTE_USER@$REMOTE_HOST @"
    cd $REMOTE_PATH
    
    # Parar processo anterior se existir
    pm2 stop wppbot 2>/dev/null || true
    pm2 delete wppbot 2>/dev/null || true
    
    # Iniciar novo processo
    pm2 start server.js --name wppbot --time --log-date-format 'YYYY-MM-DD HH:mm:ss'
    
    # Salvar configuração
    pm2 save
    
    # Configurar auto-start
    pm2 startup | tail -n 1 | bash
    
    echo '✅ PM2 configurado'
"@

# 9. Verificar status
Write-Host ""
Write-Host "🔍 Verificando status do servidor..." -ForegroundColor Yellow
ssh $REMOTE_USER@$REMOTE_HOST "pm2 status wppbot"

# 10. Mostrar logs
Write-Host ""
Write-Host "📋 Últimas linhas do log:" -ForegroundColor Yellow
ssh $REMOTE_USER@$REMOTE_HOST "pm2 logs wppbot --lines 20 --nostream"

# 11. Testar webhook
Write-Host ""
Write-Host "🧪 Testando webhook..." -ForegroundColor Yellow
$webhookTest = Invoke-WebRequest -Uri "https://${REMOTE_HOST}:3001/api/meta/webhook-test" -SkipCertificateCheck -ErrorAction SilentlyContinue

if ($webhookTest.StatusCode -eq 200) {
    $response = $webhookTest.Content | ConvertFrom-Json
    Write-Host "✅ Webhook está respondendo!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Token: $($response.verifyToken)" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Não foi possível acessar o webhook" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  DEPLOY CONCLUÍDO!                             ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📝 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Webhook URL configurada no Facebook:" -ForegroundColor White
Write-Host "   https://165.22.158.58:3001/api/meta/webhook" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 📱 Testar enviando mensagem para:" -ForegroundColor White
Write-Host "   +55 61 9903-3732" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 📊 Acessar dashboard:" -ForegroundColor White
Write-Host "   https://165.22.158.58:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 📋 Ver logs em tempo real:" -ForegroundColor White
Write-Host "   ssh $REMOTE_USER@$REMOTE_HOST 'pm2 logs wppbot'" -ForegroundColor Gray
Write-Host ""

Write-Host "🎉 Sistema pronto para uso!" -ForegroundColor Green
