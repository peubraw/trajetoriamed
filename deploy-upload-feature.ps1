# Script de deployment com upload de mídia (Windows PowerShell)

Write-Host "🚀 Iniciando deployment com funcionalidade de upload..." -ForegroundColor Green
Write-Host ""

# 1. Adicionar mudanças ao git
Write-Host "📝 Adicionando mudanças ao git..." -ForegroundColor Yellow
git add .

# 2. Commit
Write-Host "💾 Criando commit..." -ForegroundColor Yellow
git commit -m "feat: implementar upload de mídia no chat WhatsApp

- Adicionar suporte para upload de imagens, vídeos, áudios e documentos
- Integrar multer para processamento de arquivos
- Criar rota /api/chat/send-media
- Adicionar coluna file_name na tabela crm_chat_messages
- Melhorar renderização de mídia no frontend com lightbox
- Atualizar chat.service e meta-whatsapp.service para enviar mídia"

# 3. Push para repositório
Write-Host "⬆️ Enviando para o repositório..." -ForegroundColor Yellow
git push origin main

Write-Host "✅ Código enviado para o repositório!" -ForegroundColor Green
Write-Host ""

# 4. Conectar ao servidor e fazer deployment
Write-Host "📦 Conectando ao servidor para deployment..." -ForegroundColor Yellow
Write-Host ""

$commands = @"
cd /root/wppbot
echo '📥 Baixando atualizações...'
git pull
echo '📦 Instalando dependências (multer)...'
npm install
echo '🗄️ Executando migração do banco de dados...'
mysql -u root -p'#Giraffas2024' wppbot_saas < database/migrations/add-file-name-column.sql
echo '📁 Criando diretório de uploads...'
mkdir -p public/uploads
chmod 755 public/uploads
echo '🔄 Reiniciando aplicação...'
pm2 restart wppbot
echo '✅ Deployment concluído!'
pm2 status
"@

ssh root@165.22.158.58 $commands

Write-Host ""
Write-Host "✅ DEPLOYMENT COMPLETO!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Testar upload de imagem pelo chat"
Write-Host "2. Verificar se a mídia é enviada via Meta API"
Write-Host "3. Confirmar que mensagens aparecem com visualização inline"
Write-Host ""
Write-Host "🌐 Acesse: http://165.22.158.58/crm-chat.html" -ForegroundColor Yellow
