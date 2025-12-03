@echo off
title WPPBot - Sistema de Chatbot WhatsApp
color 0A

echo ========================================
echo       WPPBOT - CHATBOT WHATSAPP
echo           Powered by Grok AI
echo ========================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js de: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detectado
node --version
echo.

REM Verificar se package.json existe
if not exist "package.json" (
    echo [ERRO] Arquivo package.json nao encontrado!
    echo.
    echo Certifique-se de estar na pasta correta do projeto.
    echo.
    pause
    exit /b 1
)

REM Verificar se node_modules existe
if not exist "node_modules\" (
    echo [AVISO] Dependencias nao instaladas!
    echo.
    echo Instalando dependencias... (pode demorar alguns minutos)
    echo.
    call npm install
    echo.
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependencias!
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas com sucesso!
    echo.
)

REM Verificar se .env existe
if not exist ".env" (
    echo [AVISO] Arquivo .env nao encontrado!
    echo.
    echo Copiando .env.example para .env...
    copy .env.example .env >nul
    echo.
    echo [IMPORTANTE] Configure o arquivo .env com suas credenciais!
    echo - Obtenha API Key em: https://openrouter.ai/
    echo - Configure o banco de dados MySQL
    echo.
    echo Pressione qualquer tecla apos configurar o .env...
    pause >nul
    echo.
)

echo ========================================
echo       INICIANDO SERVIDOR...
echo ========================================
echo.
echo Servidor rodara em: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.
echo ========================================
echo.

REM Iniciar o servidor
node server.js

pause
