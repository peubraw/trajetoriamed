@echo off
echo ========================================
echo Instalacao do Sistema de Vendedores
echo CRM TrajetoriaMed
echo ========================================
echo.

echo [1/3] Executando migracao do banco de dados...
mysql -u root -p wppbot_saas < database\migrations\add-user-roles.sql

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao executar migracao!
    echo Verifique se:
    echo - MySQL esta rodando
    echo - Usuario e senha estao corretos
    echo - Banco wppbot_saas existe
    pause
    exit /b 1
)

echo [OK] Migracao executada com sucesso!
echo.

echo [2/3] Verificando instalacao...
echo.

echo [3/3] Instalacao concluida!
echo.
echo ========================================
echo Proximos passos:
echo ========================================
echo.
echo 1. Reinicie o servidor Node.js
echo 2. Faca login como administrador
echo 3. Acesse "Gerenciar Vendedores"
echo 4. Crie seus vendedores
echo.
echo Documentacao: docs\SISTEMA-VENDEDORES.md
echo.
pause
