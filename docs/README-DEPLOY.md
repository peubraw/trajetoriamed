# 🚀 Guia de Deploy - WPPBot SaaS

## Opção 1: Deploy Automático via GitHub Actions (Recomendado)

### 1. Configurar GitHub Repository

```bash
# No seu PC (Windows)
cd C:\xampp\htdocs\projetos\wppbot
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/wppbot.git
git push -u origin main
```

### 2. Configurar Secrets no GitHub

Vá em: **GitHub Repository → Settings → Secrets and variables → Actions**

Adicione os seguintes secrets:

- `VPS_HOST`: IP do seu VPS (ex: 164.92.123.45)
- `VPS_USERNAME`: root
- `VPS_SSH_KEY`: Conteúdo da chave privada SSH

Para gerar a chave SSH no VPS:

```bash
# No VPS
ssh-keygen -t ed25519 -C "deploy@wppbot"
cat ~/.ssh/id_ed25519  # Copie este conteúdo para VPS_SSH_KEY
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
```

### 3. Deploy Automático

Agora, sempre que você fizer push para a branch `main`, o deploy será automático!

```bash
git add .
git commit -m "Atualizando bot"
git push origin main
```

---

## Opção 2: Deploy Manual via Script PowerShell

### 1. Configurar o script

Edite `deploy.ps1` e configure:

```powershell
$VPS_HOST = "164.92.123.45"  # Seu IP
$VPS_USER = "root"
```

### 2. Executar deploy

```powershell
.\deploy.ps1
```

---

## Configuração Inicial do VPS (Apenas 1ª vez)

### 1. Conectar no VPS

```bash
ssh root@seu-ip-aqui
```

### 2. Executar script de setup

```bash
# Copie o conteúdo de setup-vps.sh para o VPS
curl -o setup-vps.sh https://raw.githubusercontent.com/seu-usuario/wppbot/main/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

### 3. Clonar repositório

```bash
cd /var/www
git clone https://github.com/seu-usuario/wppbot.git
cd wppbot
```

### 4. Configurar ambiente

```bash
# Editar .env
nano .env

# Cole suas configurações:
PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_USER=wppbot
DB_PASSWORD=sua-senha-mysql
DB_NAME=wppbot_saas
SESSION_SECRET=$(openssl rand -base64 32)
OPENROUTER_API_KEY=sk-or-v1-sua-chave-aqui
```

### 5. Instalar dependências

```bash
npm install --production
```

### 6. Criar banco de dados

```bash
mysql -u wppbot -p wppbot_saas < schema.sql
```

### 7. Iniciar aplicação

```bash
pm2 start server.js --name wppbot
pm2 save
pm2 startup
```

### 8. Configurar domínio (opcional)

```bash
# Editar configuração do Nginx
nano /etc/nginx/sites-available/wppbot

# Altere: server_name seu-dominio.com;
# Teste e reinicie
nginx -t
systemctl restart nginx

# Configurar SSL grátis
certbot --nginx -d seu-dominio.com
```

---

## Comandos Úteis no VPS

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs wppbot

# Reiniciar
pm2 restart wppbot

# Parar
pm2 stop wppbot

# Ver logs do Nginx
tail -f /var/log/nginx/error.log
```

---

## Fluxo de Trabalho Diário

1. **Fazer alterações no código (Windows)**
2. **Testar localmente**
3. **Commitar e fazer push:**

```bash
git add .
git commit -m "Descrição da alteração"
git push origin main
```

4. **GitHub Actions faz deploy automaticamente** ✨

---

## Troubleshooting

### Erro de conexão SSH

```bash
# Verificar se SSH está rodando no VPS
systemctl status ssh

# Testar conexão
ssh -v root@seu-ip
```

### Aplicação não inicia

```bash
# Ver logs completos
pm2 logs wppbot --lines 100

# Verificar portas
netstat -tlnp | grep 3001

# Reiniciar tudo
pm2 restart all
```

### Banco não conecta

```bash
# Verificar MySQL
systemctl status mysql

# Testar conexão
mysql -u wppbot -p wppbot_saas
```
