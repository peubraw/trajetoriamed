# Script para Resetar Completamente o Ambiente de Teste
# ATENÇÃO: Este script irá DELETAR TODOS os dados de teste

param(
    [Parameter(Mandatory=$false)]
    [string]$Email = "leandro.berti@gmail.com"
)

Write-Host "[AVISO] RESET COMPLETO DO AMBIENTE DE TESTE" -ForegroundColor Red
Write-Host "=" * 60 -ForegroundColor Red
Write-Host "Este script irá:" -ForegroundColor Yellow
Write-Host "  - Deletar TODAS as mensagens do usuário: $Email" -ForegroundColor White
Write-Host "  - Deletar TODAS as estatísticas" -ForegroundColor White
Write-Host "  - Resetar a sessão do WhatsApp" -ForegroundColor White
Write-Host "  - Atualizar o prompt MASTER" -ForegroundColor White
Write-Host ""
Write-Host "Deseja continuar? (S/N)" -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "[X] Operacao cancelada" -ForegroundColor Red
    exit 0
}

# Mudar para diretório do projeto
$projectPath = "c:\xampp\htdocs\projetos\wppbot"
if (-not (Test-Path $projectPath)) {
    Write-Host "[X] Diretorio do projeto nao encontrado: $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath

# Ler credenciais do .env
Write-Host "`n[CONFIG] Lendo configuracoes..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "[X] Arquivo .env nao encontrado!" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content ".env" -Raw
$dbHost = if ($envContent -match 'DB_HOST=(.+)') { $matches[1].Trim() } else { "localhost" }
$dbUser = if ($envContent -match 'DB_USER=(.+)') { $matches[1].Trim() } else { "root" }
$dbPassword = if ($envContent -match 'DB_PASSWORD=(.+)') { $matches[1].Trim() } else { "" }
$dbName = if ($envContent -match 'DB_NAME=(.+)') { $matches[1].Trim() } else { "wppbot_saas" }

Write-Host "[OK] Configuracoes carregadas" -ForegroundColor Green
Write-Host "   Host: $dbHost" -ForegroundColor Gray
Write-Host "   User: $dbUser" -ForegroundColor Gray
Write-Host "   Database: $dbName" -ForegroundColor Gray

# Criar script SQL temporário
$tempSqlScript = "scripts\temp-reset-$([guid]::NewGuid().ToString()).sql"
Write-Host "`n[SQL] Criando script de reset..." -ForegroundColor Yellow

$sqlContent = @"
-- SCRIPT DE RESET COMPLETO PARA TESTES
USE $dbName;

-- Buscar ID do usuário
SET @user_id = (SELECT id FROM users WHERE email = '$Email' LIMIT 1);

-- Verificar se o usuário existe
SELECT @user_id AS user_id_found;

-- Se o usuário não foi encontrado, abortar
-- (Descomente a linha abaixo se quiser forçar erro quando usuário não existir)
-- SELECT IF(@user_id IS NULL, (SELECT 'ERRO: Usuário não encontrado' FROM dual), 'OK');

-- 1. DELETAR TODAS AS MENSAGENS
DELETE FROM messages WHERE user_id = @user_id;
SELECT ROW_COUNT() AS messages_deleted;

-- 2. DELETAR TODAS AS ESTATÍSTICAS
DELETE FROM statistics WHERE user_id = @user_id;
SELECT ROW_COUNT() AS statistics_deleted;

-- 3. RESETAR SESSÃO DO WHATSAPP (marcar como desconectada)
UPDATE whatsapp_sessions 
SET status = 'disconnected', qr_code = NULL, phone_number = NULL
WHERE user_id = @user_id;
SELECT ROW_COUNT() AS sessions_reset;

-- 4. ATUALIZAR PROMPT MASTER
UPDATE bot_configs 
SET 
    bot_name = 'Assistente Trajetória Med',
    system_prompt = 'PROMPT_PLACEHOLDER',
    temperature = 0.7,
    max_tokens = 1000,
    is_active = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = @user_id;
SELECT ROW_COUNT() AS config_updated;

-- 5. RESUMO FINAL
SELECT 
    u.name AS usuario_nome,
    u.email AS usuario_email,
    bc.bot_name AS bot_nome,
    bc.is_active AS bot_ativo,
    bc.updated_at AS ultima_atualizacao,
    LENGTH(bc.system_prompt) AS tamanho_prompt,
    (SELECT COUNT(*) FROM messages WHERE user_id = @user_id) AS total_mensagens,
    (SELECT COUNT(*) FROM statistics WHERE user_id = @user_id) AS total_estatisticas,
    ws.status AS whatsapp_status
FROM users u
LEFT JOIN bot_configs bc ON u.id = bc.user_id
LEFT JOIN whatsapp_sessions ws ON u.id = ws.user_id
WHERE u.email = '$Email';

SELECT '✅ RESET COMPLETO REALIZADO COM SUCESSO!' AS status;
"@

# Ler o prompt completo do arquivo
$promptFile = "prompt-templates\MASTER-Bot-Trajetoria-Med-UNIFIED.txt"
if (Test-Path $promptFile) {
    $promptContent = Get-Content $promptFile -Raw
    # Escapar aspas simples para SQL
    $promptContent = $promptContent -replace "'", "''"
    # Substituir no script SQL
    $sqlContent = $sqlContent -replace "PROMPT_PLACEHOLDER", $promptContent
    Write-Host "[OK] Prompt MASTER carregado" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Arquivo de prompt nao encontrado. Usando prompt resumido." -ForegroundColor Yellow
    $sqlContent = $sqlContent -replace "PROMPT_PLACEHOLDER", "Você é o Assistente da Trajetória Med. Atenda médicos de forma profissional."
}

# Salvar script temporário
$sqlContent | Out-File -FilePath $tempSqlScript -Encoding UTF8

# Executar script SQL
Write-Host "`n[DB] Executando reset no banco de dados..." -ForegroundColor Yellow

$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
if (-not (Test-Path $mysqlPath)) {
    $mysqlPath = "mysql"
}

try {
    if ($dbPassword) {
        & $mysqlPath -h $dbHost -u $dbUser -p"$dbPassword" $dbName -e "source $tempSqlScript" 2>&1
    } else {
        & $mysqlPath -h $dbHost -u $dbUser $dbName -e "source $tempSqlScript" 2>&1
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Reset executado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] Houve um aviso durante a execucao" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERRO] Erro ao executar script: $_" -ForegroundColor Red
} finally {
    # Limpar script temporário
    if (Test-Path $tempSqlScript) {
        Remove-Item $tempSqlScript -Force
        Write-Host "✅ Arquivo temporário removido" -ForegroundColor Green
    }
}

# Limpar diretório de sessões do WhatsApp
Write-Host "`n🗑️  Limpando sessões do WhatsApp..." -ForegroundColor Yellow
$tokensPath = "tokens\session_1"
if (Test-Path $tokensPath) {
    try {
        Remove-Item "$tokensPath\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Sessão do WhatsApp limpa" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Não foi possível limpar completamente a sessão: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Diretório de tokens não encontrado" -ForegroundColor Yellow
}

# Resumo final
Write-Host "`n" + ("=" * 60) -ForegroundColor Green
Write-Host "✅ RESET COMPLETO CONCLUÍDO!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Green

Write-Host "`n📋 O QUE FOI FEITO:" -ForegroundColor Cyan
Write-Host "✅ Todas as mensagens deletadas" -ForegroundColor White
Write-Host "✅ Todas as estatísticas resetadas" -ForegroundColor White
Write-Host "✅ Sessão do WhatsApp desconectada" -ForegroundColor White
Write-Host "✅ Prompt MASTER atualizado" -ForegroundColor White
Write-Host "✅ Ambiente pronto para testes limpos" -ForegroundColor White

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Iniciar o servidor: npm start" -ForegroundColor White
Write-Host "2. Fazer login com: $Email" -ForegroundColor White
Write-Host "3. Reconectar o WhatsApp (escanear QR Code)" -ForegroundColor White
Write-Host "4. Enviar mensagens de teste" -ForegroundColor White

Write-Host "`nDICA: Use numeros de teste diferentes para simular novos leads" -ForegroundColor Cyan
Write-Host ""
