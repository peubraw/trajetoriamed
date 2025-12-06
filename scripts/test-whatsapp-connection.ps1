# 🧪 Script de Teste - Conexão WhatsApp via QR Code

# Teste 1: Verificar se o servidor está rodando
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE 1: Verificando servidor..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Servidor está rodando na porta 3001" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ERRO: Servidor não está rodando!" -ForegroundColor Red
    Write-Host "Execute: npm start" -ForegroundColor Yellow
    exit 1
}

# Teste 2: Verificar se Socket.IO está ativo
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE 2: Verificando Socket.IO..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/socket.io/socket.io.js" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Socket.IO está ativo e funcionando" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ AVISO: Socket.IO pode não estar configurado corretamente" -ForegroundColor Yellow
}

# Teste 3: Verificar arquivos modificados
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE 3: Verificando arquivos..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$files = @(
    "services\whatsapp.service.js",
    "public\js\app.js",
    "docs\WHATSAPP-QRCODE-FIX.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $file NÃO encontrado" -ForegroundColor Red
    }
}

# Teste 4: Verificar Socket.IO no código
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE 4: Verificando código Socket.IO..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$whatsappService = Get-Content "services\whatsapp.service.js" -Raw
if ($whatsappService -match "global\.io\.emit") {
    Write-Host "✅ Socket.IO configurado no whatsapp.service.js" -ForegroundColor Green
} else {
    Write-Host "❌ Socket.IO NÃO encontrado no whatsapp.service.js" -ForegroundColor Red
}

$appJs = Get-Content "public\js\app.js" -Raw
if ($appJs -match "initializeSocketIO") {
    Write-Host "✅ Socket.IO configurado no app.js" -ForegroundColor Green
} else {
    Write-Host "❌ Socket.IO NÃO encontrado no app.js" -ForegroundColor Red
}

# Teste 5: Verificar Chrome/Chromium
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE 5: Verificando Chrome..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$chromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$chromeFound = $false
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        Write-Host "✅ Chrome encontrado em: $path" -ForegroundColor Green
        $chromeFound = $true
        break
    }
}

if (-not $chromeFound) {
    Write-Host "⚠️ AVISO: Chrome não encontrado nos caminhos padrão" -ForegroundColor Yellow
    Write-Host "   Instale o Google Chrome: https://www.google.com/chrome/" -ForegroundColor Yellow
}

# Teste 6: Verificar tokens WhatsApp
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE 6: Verificando tokens..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

if (Test-Path "tokens") {
    $tokenFiles = Get-ChildItem "tokens" -Recurse -File
    Write-Host "✅ Pasta tokens existe" -ForegroundColor Green
    Write-Host "   Arquivos de token: $($tokenFiles.Count)" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ Pasta tokens não existe (será criada automaticamente)" -ForegroundColor Yellow
}

# Resumo Final
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 RESUMO DOS TESTES" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎯 PRÓXIMOS PASSOS PARA TESTAR:" -ForegroundColor Green
Write-Host "1. Acesse: http://localhost:3001" -ForegroundColor White
Write-Host "2. Faça login no sistema" -ForegroundColor White
Write-Host "3. Vá para aba 'WhatsApp'" -ForegroundColor White
Write-Host "4. Clique em 'Conectar WhatsApp'" -ForegroundColor White
Write-Host "5. O QR Code deve aparecer em menos de 5 segundos" -ForegroundColor White
Write-Host "6. Escaneie com WhatsApp > Dispositivos Conectados" -ForegroundColor White

Write-Host ""
Write-Host "DEBUGGING:" -ForegroundColor Green
Write-Host "- Console Backend: Procure por 'QR Code emitido via Socket.IO'" -ForegroundColor White
Write-Host "- Console Frontend (F12): Procure por 'QR Code recebido via Socket.IO'" -ForegroundColor White
Write-Host "- Network (F12): Verifique WebSocket em WS tab" -ForegroundColor White

Write-Host ""
Write-Host "Testes concluidos!" -ForegroundColor Green
Write-Host ""
