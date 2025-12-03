@echo off
title WPPBot - Instalar Dependencias
color 0B

echo ========================================
echo       INSTALACAO DE DEPENDENCIAS
echo           WPPBot Sistema
echo ========================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Baixe e instale de: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detectado:
node --version
echo.
echo [OK] NPM versao:
npm --version
echo.

echo Instalando dependencias do projeto...
echo Isso pode levar alguns minutos...
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na instalacao!
    echo.
    echo Tentando novamente com --force...
    call npm install --force
)

echo.
echo ========================================
if %errorlevel% equ 0 (
    echo [SUCESSO] Dependencias instaladas!
    echo.
    echo Proximos passos:
    echo 1. Configure o arquivo .env
    echo 2. Execute o schema.sql no MySQL
    echo 3. Execute start.bat para iniciar
) else (
    echo [ERRO] Falha na instalacao!
    echo.
    echo Tente manualmente: npm install
)
echo ========================================
echo.

pause
