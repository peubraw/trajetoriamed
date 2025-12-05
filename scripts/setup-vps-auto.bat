@echo off
echo Configurando VPS automaticamente...
echo.

REM Adicionar host aos conhecidos
echo yes | ssh -o StrictHostKeyChecking=no root@165.22.158.58 "echo 'Conexao OK'"

REM Criar e executar script de setup
ssh root@165.22.158.58 << 'EOF'
#!/bin/bash
echo "🔧 Iniciando configuração do VPS..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# Instalar dependências
echo "📦 Instalando dependências..."
apt-get install -y curl git build-essential

# Instalar Node.js 18
echo "📦 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar versão
node -v
npm -v

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
echo "📁 Criando estrutura..."
mkdir -p /var/www/wppbot
cd /var/www/wppbot

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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

ln -sf /etc/nginx/sites-available/wppbot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
systemctl enable nginx

# Firewall
echo "🔥 Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

echo "✅ Setup concluído!"
echo ""
echo "📋 Informações:"
echo "   IP: 165.22.158.58"
echo "   DB: wppbot_saas"
echo "   User: wppbot"
echo "   Pass: wppbot@2025"
EOF

echo.
echo ✅ Configuração concluída!
pause
