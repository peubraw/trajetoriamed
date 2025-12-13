@echo off
REM ========================================
REM INSTALACAO DO CHAT - SERVIDOR REMOTO
REM ========================================

echo ========================================
echo INSTALANDO CHAT NO SERVIDOR REMOTO
echo ========================================
echo.

echo IMPORTANTE: Voce precisara digitar a senha do servidor remoto
echo Servidor: 165.22.158.58
echo Usuario: root
echo.
pause

echo [1/2] Copiando arquivo SQL para o servidor...
scp database\install-chat.sql root@165.22.158.58:/tmp/

if errorlevel 1 (
    echo ERRO ao copiar arquivo!
    pause
    exit /b 1
)

echo OK - Arquivo copiado!
echo.

echo [2/2] Executando instalacao no servidor remoto...
ssh root@165.22.158.58 "mysql -u root wppbot_saas < /tmp/install-chat.sql && echo 'INSTALACAO CONCLUIDA!' && mysql -u root wppbot_saas -e \"SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'wppbot_saas' AND TABLE_NAME LIKE 'crm_chat%%'\""

if errorlevel 1 (
    echo ERRO na instalacao remota!
    pause
    exit /b 1
)

echo.
echo ========================================
echo INSTALACAO REMOTA CONCLUIDA!
echo ========================================
echo.
echo O chat esta instalado em:
echo - Local: http://localhost:3000/crm-chat.html
echo - Remoto: http://165.22.158.58:3000/crm-chat.html
echo.
pause
