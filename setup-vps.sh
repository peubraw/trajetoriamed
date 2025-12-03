#!/bin/bash

# Script de configuração inicial do VPS DigitalOcean
# Execute APENAS UMA VEZ no VPS

echo "🔧 Configurando VPS para WPPBot..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar Node.js 18
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar MySQL
echo "📦 Instalando MySQL..."
apt install -y mysql-server

# Configurar MySQL
echo "🔐 Configurando MySQL..."
mysql -e "CREATE DATABASE IF NOT EXISTS wppbot_saas;"
mysql -e "CREATE USER IF NOT EXISTS 'wppbot'@'localhost' IDENTIFIED BY 'senha_segura_aqui';"
mysql -e "GRANT ALL PRIVILEGES ON wppbot_saas.* TO 'wppbot'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Instalar PM2
echo "📦 Instalando PM2..."
npm install -g pm2

# Instalar Nginx
echo "📦 Instalando Nginx..."
apt install -y nginx

# Criar diretório do projeto
echo "📁 Criando diretório..."
mkdir -p /var/www/wppbot
cd /var/www/wppbot

# Configurar Git
echo "🔐 Configurando Git..."
git config --global --add safe.directory /var/www/wppbot

# Criar arquivo .env de produção
echo "📝 Criando arquivo .env..."
cat > /var/www/wppbot/.env.production << 'EOL'
PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_USER=wppbot
DB_PASSWORD=senha_segura_aqui
DB_NAME=wppbot_saas
SESSION_SECRET=$(openssl rand -base64 32)
OPENROUTER_API_KEY=sua-chave-aqui
EOL

# Configurar Nginx
echo "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/wppbot << 'EOL'
server {
    listen 80;
    server_name seu-dominio.com;

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
nginx -t && systemctl restart nginx

# Instalar Certbot para SSL
echo "🔒 Instalando Certbot..."
apt install -y certbot python3-certbot-nginx

echo "✅ VPS configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Clone seu repositório: git clone https://github.com/seu-usuario/wppbot.git /var/www/wppbot"
echo "2. Entre no diretório: cd /var/www/wppbot"
echo "3. Instale dependências: npm install --production"
echo "4. Configure o .env.production com suas chaves"
echo "5. Importe o banco: mysql -u wppbot -p wppbot_saas < schema.sql"
echo "6. Inicie com PM2: pm2 start server.js --name wppbot"
echo "7. Configure SSL: certbot --nginx -d seu-dominio.com"
echo "8. Salve PM2: pm2 save && pm2 startup"
