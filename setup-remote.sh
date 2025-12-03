#!/bin/bash

# Script de setup inicial automatizado
# Execute: bash setup-remote.sh

VPS_HOST="165.22.158.58"
VPS_USER="root"
VPS_PASSWORD="!Bouar4ngo"

echo "🔧 Configurando VPS DigitalOcean..."
echo "📡 Host: $VPS_HOST"

# Criar script de setup no VPS
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'ENDSSH'
#!/bin/bash

echo "🔧 Iniciando configuração do VPS..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y

# Instalar dependências básicas
echo "📦 Instalando dependências..."
apt-get install -y curl git build-essential

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

# Criar diretório do projeto
echo "📁 Criando estrutura de diretórios..."
mkdir -p /var/www/wppbot
cd /var/www

# Gerar chave SSH para GitHub (opcional)
echo "🔑 Gerando chave SSH..."
ssh-keygen -t ed25519 -C "deploy@wppbot" -f ~/.ssh/id_ed25519 -N ""

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
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
EOL

# Ativar site no Nginx
ln -sf /etc/nginx/sites-available/wppbot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar e reiniciar Nginx
nginx -t && systemctl restart nginx
systemctl enable nginx

# Configurar firewall
echo "🔥 Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Configuração inicial concluída!"
echo ""
echo "📋 Informações importantes:"
echo "   Banco de dados: wppbot_saas"
echo "   Usuário MySQL: wppbot"
echo "   Senha MySQL: wppbot@2025"
echo ""
echo "🔑 Chave SSH pública (adicione no GitHub):"
cat ~/.ssh/id_ed25519.pub

ENDSSH

echo ""
echo "✅ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Copie a chave SSH exibida acima"
echo "2. Adicione no GitHub: Settings → Deploy Keys"
echo "3. Execute: .\deploy.ps1 para fazer o primeiro deploy"
