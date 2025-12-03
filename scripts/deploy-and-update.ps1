# Script para Deploy e Atualização Completa
# Execute no PowerShell como Administrador

Write-Host "🚀 INICIANDO DEPLOY - WPPBOT TRAJETÓRIA MED" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Verificar se está no diretório correto
$projectPath = "c:\xampp\htdocs\projetos\wppbot"
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ Diretório do projeto não encontrado: $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath
Write-Host "✅ Diretório do projeto localizado" -ForegroundColor Green

# 1. Verificar se o MySQL está rodando
Write-Host "`n📊 Verificando MySQL..." -ForegroundColor Yellow
$mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
if ($mysqlService -and $mysqlService.Status -eq "Running") {
    Write-Host "✅ MySQL está rodando" -ForegroundColor Green
} else {
    Write-Host "⚠️  MySQL não está rodando. Tentando iniciar..." -ForegroundColor Yellow
    Start-Service -Name "MySQL*" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

# 2. Atualizar dependências
Write-Host "`n📦 Atualizando dependências..." -ForegroundColor Yellow
npm install

# 3. Verificar arquivo .env
Write-Host "`n🔧 Verificando configurações..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado. Criando a partir do .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Arquivo .env criado. CONFIGURE AS CREDENCIAIS!" -ForegroundColor Green
    } else {
        Write-Host "❌ Arquivo .env.example não encontrado" -ForegroundColor Red
    }
}

# 4. Criar diretório de scripts se não existir
if (-not (Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts" | Out-Null
    Write-Host "✅ Diretório scripts criado" -ForegroundColor Green
}

# 5. Executar script SQL de atualização
Write-Host "`n💾 Atualizando banco de dados..." -ForegroundColor Yellow

# Ler credenciais do .env
$envContent = Get-Content ".env" -Raw
$dbHost = if ($envContent -match 'DB_HOST=(.+)') { $matches[1].Trim() } else { "localhost" }
$dbUser = if ($envContent -match 'DB_USER=(.+)') { $matches[1].Trim() } else { "root" }
$dbPassword = if ($envContent -match 'DB_PASSWORD=(.+)') { $matches[1].Trim() } else { "" }
$dbName = if ($envContent -match 'DB_NAME=(.+)') { $matches[1].Trim() } else { "wppbot_saas" }

# Caminho do MySQL
$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
if (-not (Test-Path $mysqlPath)) {
    $mysqlPath = "mysql" # Tentar comando global
}

# Executar script SQL
$sqlScript = "scripts\update-leandro-prompt.sql"
if (Test-Path $sqlScript) {
    Write-Host "Executando: $sqlScript" -ForegroundColor Cyan
    
    if ($dbPassword) {
        & $mysqlPath -h $dbHost -u $dbUser -p"$dbPassword" $dbName -e "source $sqlScript" 2>&1
    } else {
        & $mysqlPath -h $dbHost -u $dbUser $dbName -e "source $sqlScript" 2>&1
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Banco de dados atualizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Houve um problema ao atualizar o banco. Verifique as credenciais." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Script SQL não encontrado: $sqlScript" -ForegroundColor Yellow
}

# 6. Copiar prompt MASTER para o local correto
Write-Host "`n📝 Copiando prompt MASTER..." -ForegroundColor Yellow
$promptSource = "prompt-templates\MASTER-Bot-Trajetoria-Med-UNIFIED.txt"
if (Test-Path $promptSource) {
    # Criar backup do prompt atual se existir
    if (Test-Path "prompt-templates\MASTER-Bot-Trajetoria-Med.txt") {
        Copy-Item "prompt-templates\MASTER-Bot-Trajetoria-Med.txt" "prompt-templates\MASTER-Bot-Trajetoria-Med.BACKUP.txt" -Force
        Write-Host "✅ Backup do prompt anterior criado" -ForegroundColor Green
    }
    
    # Copiar novo prompt
    Copy-Item $promptSource "prompt-templates\MASTER-Bot-Trajetoria-Med.txt" -Force
    Write-Host "✅ Prompt MASTER atualizado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Arquivo de prompt não encontrado: $promptSource" -ForegroundColor Yellow
}

# 7. Verificar processos Node.js rodando
Write-Host "`n🔍 Verificando processos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "⚠️  Encontrados $($nodeProcesses.Count) processo(s) Node.js rodando" -ForegroundColor Yellow
    Write-Host "Deseja encerrar todos os processos Node.js? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        Stop-Process -Name "node" -Force
        Write-Host "✅ Processos Node.js encerrados" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

# 8. Iniciar servidor
Write-Host "`n🚀 Iniciando servidor..." -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "COMANDOS DISPONÍVEIS:" -ForegroundColor Cyan
Write-Host "  npm start          - Iniciar servidor normalmente" -ForegroundColor White
Write-Host "  npm run dev        - Iniciar com nodemon (auto-reload)" -ForegroundColor White
Write-Host "  node server.js     - Iniciar diretamente" -ForegroundColor White
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host "`n✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Verificar o arquivo .env e configurar credenciais se necessário" -ForegroundColor White
Write-Host "2. Executar: npm start" -ForegroundColor White
Write-Host "3. Acessar: http://localhost:3000" -ForegroundColor White
Write-Host "4. Fazer login com: leandro.berti@gmail.com" -ForegroundColor White
Write-Host "5. Conectar o WhatsApp" -ForegroundColor White
Write-Host "6. Testar o bot enviando mensagens" -ForegroundColor White

Write-Host "`n💡 DICA: Use 'npm run dev' para desenvolvimento com auto-reload" -ForegroundColor Cyan
Write-Host ""
