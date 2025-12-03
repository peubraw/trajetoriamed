#!/bin/bash

# Script de deploy manual para VPS DigitalOcean
# Uso: ./deploy.sh

echo "🚀 Iniciando deploy para DigitalOcean..."

# Variáveis
VPS_HOST="165.22.158.58"
VPS_USER="root"
VPS_PATH="/var/www/wppbot"
VPS_PASSWORD="!Bouar4ngo"

echo "📦 Fazendo commit local..."
git add .
git commit -m "Deploy $(date '+%Y-%m-%d %H:%M:%S')" || echo "Nada para commitar"

echo "⬆️  Enviando para GitHub..."
git push origin main

echo "🔄 Conectando ao VPS..."
ssh -i ~/.ssh/digitalocean $VPS_USER@$VPS_HOST << 'EOF'
    cd /var/www/wppbot
    echo "📥 Baixando atualizações..."
    git pull origin main
    
    echo "📦 Instalando dependências..."
    npm install --production
    
    echo "🔄 Reiniciando aplicação..."
    pm2 restart wppbot || pm2 start server.js --name wppbot
    pm2 save
    
    echo "✅ Deploy concluído!"
    pm2 status
EOF

echo "🎉 Deploy finalizado com sucesso!"
