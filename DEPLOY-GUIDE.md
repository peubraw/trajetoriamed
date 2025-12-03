# 🚀 Guia Rápido de Deploy - VPS DigitalOcean

## 📋 Informações do Servidor

- **IP:** 165.22.158.58
- **Usuário:** root
- **Senha:** !Bouar4ngo
- **Caminho:** /var/www/wppbot
- **Porta:** 3001 (Node.js) → 80 (Nginx)

## 🎯 Deploy em 3 Passos

### 1️⃣ Deploy Normal (Atualizar código)

```powershell
.\deploy-remote-full.ps1
```

**O que faz:**
- ✅ Commit e push para GitHub
- ✅ Pull no VPS
- ✅ Instala dependências
- ✅ Atualiza banco de dados
- ✅ Atualiza prompt MASTER
- ✅ Reinicia PM2

---

### 2️⃣ Deploy com Reset Completo (Ambiente de Teste)

```powershell
.\deploy-remote-full.ps1 -ResetTest
```

**O que faz (adicional):**
- 🗑️ Deleta TODAS as mensagens do Leandro
- 🗑️ Deleta todas as estatísticas
- 🗑️ Limpa sessões do WhatsApp
- ✅ Ambiente 100% limpo para testar

---

### 3️⃣ Deploy sem Git (apenas atualizar VPS)

```powershell
.\deploy-remote-full.ps1 -SkipGit
```

**Quando usar:** Se você já fez o commit/push manualmente

---

## 🔧 Comandos Úteis no VPS

### Conectar via SSH

```bash
ssh root@165.22.158.58
# Senha: !Bouar4ngo
```

### Ver logs em tempo real

```bash
pm2 logs wppbot --lines 100
```

### Reiniciar aplicação

```bash
pm2 restart wppbot
```

### Status da aplicação

```bash
pm2 status
pm2 monit
```

### Acessar diretório do projeto

```bash
cd /var/www/wppbot
```

### Ver logs do Nginx

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Verificar banco de dados

```bash
mysql -u wppbot -pwppbot@2025 wppbot_saas

# Dentro do MySQL:
USE wppbot_saas;
SHOW TABLES;

# Ver mensagens do Leandro
SELECT * FROM messages 
WHERE user_id = (SELECT id FROM users WHERE email = 'leandro.berti@gmail.com')
ORDER BY timestamp DESC LIMIT 10;

# Ver configuração do bot
SELECT bot_name, is_active, LENGTH(system_prompt) as prompt_size
FROM bot_configs 
WHERE user_id = (SELECT id FROM users WHERE email = 'leandro.berti@gmail.com');
```

---

## 🌐 Acessar Sistema

1. **URL:** http://165.22.158.58
2. **Login:** leandro.berti@gmail.com
3. **Senha:** (a que foi cadastrada)

---

## 🔄 Workflow Recomendado

### Para Testar do Zero

```powershell
# 1. Deploy com reset
.\deploy-remote-full.ps1 -ResetTest

# 2. Acessar sistema
# http://165.22.158.58

# 3. Fazer login
# leandro.berti@gmail.com

# 4. Conectar WhatsApp
# Escanear QR Code

# 5. Enviar mensagens de teste
# Simular leads chegando via WhatsApp
```

### Para Atualizar Apenas o Código

```powershell
# Fazer alterações no código localmente
# ...

# Deploy
.\deploy-remote-full.ps1
```

### Para Atualizar Apenas o Prompt

```powershell
# 1. Editar o arquivo
notepad prompt-templates\MASTER-Bot-Trajetoria-Med-UNIFIED.txt

# 2. Deploy
.\deploy-remote-full.ps1
```

---

## 🆘 Troubleshooting

### Aplicação não está respondendo

```bash
ssh root@165.22.158.58
pm2 restart wppbot
pm2 logs wppbot --err
```

### Banco de dados com problema

```bash
ssh root@165.22.158.58
cd /var/www/wppbot
mysql -u wppbot -pwppbot@2025 wppbot_saas < database/schema.sql
```

### Nginx com problema

```bash
ssh root@165.22.158.58
sudo nginx -t
sudo systemctl restart nginx
```

### Limpar tudo e começar do zero

```bash
ssh root@165.22.158.58

# Parar aplicação
pm2 stop wppbot
pm2 delete wppbot

# Limpar banco
mysql -u wppbot -pwppbot@2025 wppbot_saas -e "
  DELETE FROM messages;
  DELETE FROM statistics;
  UPDATE whatsapp_sessions SET status = 'disconnected', qr_code = NULL;
"

# Limpar sessões WhatsApp
cd /var/www/wppbot
rm -rf tokens/session_1/*

# Reiniciar
pm2 start server.js --name wppbot
pm2 save
```

---

## 📝 Configuração do .env no VPS

O arquivo já está configurado. Se precisar alterar:

```bash
ssh root@165.22.158.58
cd /var/www/wppbot
nano .env
```

Configurações atuais:
```env
DB_HOST=localhost
DB_USER=wppbot
DB_PASSWORD=wppbot@2025
DB_NAME=wppbot_saas
PORT=3001
OPENROUTER_API_KEY=sua-chave-aqui
```

---

## 🔐 Credenciais do Banco

- **Host:** localhost
- **Database:** wppbot_saas
- **User:** wppbot
- **Password:** wppbot@2025

---

## 📊 Monitoramento

### CPU e Memória

```bash
ssh root@165.22.158.58
pm2 monit
```

### Espaço em disco

```bash
ssh root@165.22.158.58
df -h
```

### Processos

```bash
ssh root@165.22.158.58
htop
```

---

## ✅ Checklist Pós-Deploy

Após executar o deploy, verifique:

- [ ] Aplicação está rodando: `pm2 status`
- [ ] Nginx está ativo: `systemctl status nginx`
- [ ] Site acessível: http://165.22.158.58
- [ ] Login funcionando
- [ ] WhatsApp conectado
- [ ] Bot respondendo mensagens
- [ ] Prompt MASTER carregado corretamente

---

## 💡 Dicas

1. **Sempre faça backup** antes de alterações críticas
2. **Use PM2** para manter a aplicação rodando
3. **Monitore os logs** regularmente
4. **Teste em ambiente limpo** antes de liberar para produção
5. **Documente mudanças** importantes

---

**Última atualização:** 28/11/2025
