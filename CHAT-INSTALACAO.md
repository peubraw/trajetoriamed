# 💬 INSTALAÇÃO RÁPIDA - CHAT WHATSAPP

## 🚀 Instalação em 3 Passos

### 1️⃣ Executar SQL no Banco de Dados

**Opção A - Via Terminal:**
```bash
cd c:\xampp\htdocs\projetos\wppbot
mysql -u root -p wppbot_saas < database/install-chat.sql
```

**Opção B - Via phpMyAdmin:**
1. Abra http://localhost/phpmyadmin
2. Selecione o banco `wppbot_saas`
3. Clique em "SQL"
4. Copie todo o conteúdo de `database/install-chat.sql`
5. Cole e clique em "Executar"

### 2️⃣ Reiniciar o Servidor (se estiver rodando)

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
node server.js
```

### 3️⃣ Acessar o Chat

Abra no navegador:
```
http://localhost:3000/crm-chat.html
```

Ou clique no menu lateral do CRM: **Chat WhatsApp** 💬

## ✅ Como Usar

### No CRM Kanban

1. Abra o CRM: `http://localhost:3000/crm-kanban.html`
2. Em cada card de lead, você verá um ícone do WhatsApp 📱
3. Clique no ícone para abrir o chat com aquele lead

### No Chat

1. **Lista de Conversas** (esquerda)
   - Veja todas as conversas ativas
   - Badge verde mostra mensagens não lidas
   - Busque por nome ou telefone
   - Clique em uma conversa para abrir

2. **Janela de Chat** (direita)
   - Digite mensagens no campo inferior
   - Pressione **Enter** para enviar
   - **Shift + Enter** para quebrar linha
   - Veja status: enviado ✓, entregue ✓✓, lido ✓✓ (azul)

3. **Notificações**
   - Badge no menu mostra total de mensagens não lidas
   - Notificações desktop (se permitir)
   - Mensagens em tempo real via Socket.IO

## 🎯 Funcionalidades

✅ Chat em tempo real  
✅ Histórico completo de conversas  
✅ Integração com CRM  
✅ Status de mensagens (enviado/entregue/lido)  
✅ Contador de mensagens não lidas  
✅ Busca de conversas  
✅ Design WhatsApp Web  
✅ Suporte a múltiplos vendedores  

## 🔧 Configuração Avançada

### Adicionar Usuários ao Chat

Os vendedores criados no sistema automaticamente terão acesso ao chat.

### Atribuir Vendedor a uma Conversa

Isso será feito automaticamente baseado no `assigned_to` do lead no CRM.

### Ver Estatísticas

```
http://localhost:3000/api/chat/stats
```

## 📱 Integração com WhatsApp

O chat funciona com:
- **Meta WhatsApp Business API** (principal)
- **WppConnect** (fallback automático)

As mensagens recebidas via webhook são automaticamente salvas no chat.

## 🐛 Problemas Comuns

### "Erro ao carregar conversas"
- Verifique se está logado no sistema
- Verifique se o banco de dados foi instalado corretamente

### "Erro ao enviar mensagem"
- Verifique se o WhatsApp está conectado (Meta API ou WppConnect)
- Verifique os logs do servidor

### Mensagens não aparecem em tempo real
- Verifique se Socket.IO está conectado (F12 → Console)
- Recarregue a página

## 📚 Documentação Completa

Para mais detalhes, consulte:
```
docs/CHAT-WHATSAPP-GUIA.md
```

## 🎉 Pronto!

Agora você pode conversar com seus leads diretamente da plataforma! 💬✨
