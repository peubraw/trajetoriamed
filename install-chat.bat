@echo off
echo ========================================
echo INSTALACAO DO CHAT WHATSAPP - CRM
echo ========================================
echo.

echo [1/3] Verificando MySQL...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: MySQL nao encontrado!
    echo Certifique-se de que o XAMPP esta rodando.
    pause
    exit /b 1
)
echo OK - MySQL encontrado!
echo.

echo [2/3] Instalando banco de dados...
echo Digite a senha do MySQL (ou apenas Enter se nao tiver senha):
mysql -u root -p wppbot_saas < database\install-chat.sql
if errorlevel 1 (
    echo ERRO ao instalar banco de dados!
    pause
    exit /b 1
)
echo OK - Banco de dados instalado!
echo.

echo [3/3] Executando testes...
node test-chat-system.js
if errorlevel 1 (
    echo AVISO: Alguns testes falharam, mas o sistema pode estar funcional.
)
echo.

echo ========================================
echo INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Proximos passos:
echo 1. Inicie o servidor: node server.js
echo 2. Acesse: http://localhost:3000/crm-chat.html
echo 3. Faca login e comece a usar!
echo.
pause
