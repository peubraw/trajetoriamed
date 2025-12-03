# Script de setup inicial via PowerShell
# Execute: .\setup-remote.ps1

$VPS_HOST = "165.22.158.58"
$VPS_USER = "root"
$VPS_PASSWORD = "!Bouar4ngo"

Write-Host "🔧 Configurando VPS DigitalOcean..." -ForegroundColor Green
Write-Host "📡 Host: $VPS_HOST" -ForegroundColor Cyan

# Criar script temporário
$setupScript = @'
#!/bin/bash
echo "🔧 Iniciando configuração do VPS..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# Instalar dependências
echo "📦 Instalando dependências..."
apt-get install -y curl git build-essential software-properties-common

# Instalar Node.js 18
echo "📦 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Instalar MySQL
echo "📦 Instalando MySQL..."
apt-get install -y mysql-server

# Iniciar MySQL
systemctl start mysql
systemctl enable mysql

# Configurar MySQL
echo "🔐 Configurando MySQL..."
mysql -e "CREATE DATABASE IF NOT EXISTS wppbot_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'wppbot'@'localhost' IDENTIFIED BY 'wppbot@2025';"
mysql -e "GRANT ALL PRIVILEGES ON wppbot_saas.* TO 'wppbot'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Instalar PM2
echo "📦 Instalando PM2..."
npm install -g pm2

# Instalar Nginx
echo "📦 Instalando Nginx..."
apt-get install -y nginx

# Criar diretório
echo "📁 Criando diretório do projeto..."
mkdir -p /var/www/wppbot

# Configurar Nginx
echo "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/wppbot << 'EOL'
server {
    listen 80;
    server_name 165.22.158.58;
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

ln -sf /etc/nginx/sites-available/wppbot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Firewall
echo "🔥 Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

echo "✅ Setup concluído!"
'@

# Salvar script
$setupScript | Out-File -FilePath "$env:TEMP\vps-setup.sh" -Encoding ASCII

# Enviar e executar via plink (PuTTY)
Write-Host "📤 Enviando script para VPS..." -ForegroundColor Yellow

# Usando plink se disponível, senão usa ssh nativo do Windows
if (Get-Command plink -ErrorAction SilentlyContinue) {
    # Com PuTTY
    echo y | plink -ssh -pw $VPS_PASSWORD $VPS_USER@$VPS_HOST "cat > /tmp/setup.sh && chmod +x /tmp/setup.sh && bash /tmp/setup.sh" < "$env:TEMP\vps-setup.sh"
} else {
    # Com SSH nativo do Windows
    Write-Host "⚠️  Usando SSH nativo. Você precisará digitar a senha: $VPS_PASSWORD" -ForegroundColor Yellow
    
    # Criar script de comandos
    $commands = @"
cat > /tmp/setup.sh << 'ENDSETUP'
$setupScript
ENDSETUP
chmod +x /tmp/setup.sh
bash /tmp/setup.sh
"@
    
    $commands | ssh "$VPS_USER@$VPS_HOST"
}

Write-Host ""
Write-Host "✅ Configuração inicial concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Credenciais do Banco:" -ForegroundColor Cyan
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Database: wppbot_saas" -ForegroundColor White
Write-Host "   User: wppbot" -ForegroundColor White
Write-Host "   Password: wppbot@2025" -ForegroundColor White
