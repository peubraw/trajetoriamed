#!/bin/bash
# Script de deployment com upload de mídia

echo "🚀 Iniciando deployment com funcionalidade de upload..."

# 1. Adicionar mudanças ao git
git add .

# 2. Commit
git commit -m "feat: implementar upload de mídia no chat WhatsApp

- Adicionar suporte para upload de imagens, vídeos, áudios e documentos
- Integrar multer para processamento de arquivos
- Criar rota /api/chat/send-media
- Adicionar coluna file_name na tabela crm_chat_messages
- Melhorar renderização de mídia no frontend com lightbox
- Atualizar chat.service e meta-whatsapp.service para enviar mídia"

# 3. Push para repositório
git push origin main

echo "✅ Código enviado para o repositório!"
echo ""
echo "📦 Conectando ao servidor para deployment..."

# 4. SSH no servidor e executar deployment
ssh root@165.22.158.58 << 'EOF'
cd /root/wppbot

echo "📥 Baixando atualizações..."
git pull

echo "📦 Instalando dependências (multer)..."
npm install

echo "🗄️ Executando migração do banco de dados..."
mysql -u root -p'#Giraffas2024' wppbot_saas < database/migrations/add-file-name-column.sql

echo "📁 Criando diretório de uploads..."
mkdir -p public/uploads
chmod 755 public/uploads

echo "🔄 Reiniciando aplicação..."
pm2 restart wppbot

echo "✅ Deployment concluído!"
pm2 status
EOF

echo ""
echo "✅ DEPLOYMENT COMPLETO!"
echo ""
echo "📋 Próximos passos:"
echo "1. Testar upload de imagem pelo chat"
echo "2. Verificar se a mídia é enviada via Meta API"
echo "3. Confirmar que mensagens aparecem com visualização inline"
