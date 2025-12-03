# Scripts de Deploy e Manutenção - WPPBot Trajetória Med

Este diretório contém scripts para facilitar o deploy, atualização e reset do ambiente.

## 📋 Scripts Disponíveis

### 1. `deploy-and-update.ps1` (Windows)
**Deploy completo e atualização do sistema**

```powershell
.\scripts\deploy-and-update.ps1
```

**O que faz:**
- ✅ Verifica e inicia MySQL
- ✅ Instala/atualiza dependências npm
- ✅ Verifica arquivo .env
- ✅ Executa scripts SQL de atualização
- ✅ Copia prompt MASTER para o local correto
- ✅ Verifica processos Node.js
- ✅ Prepara ambiente para iniciar servidor

**Quando usar:** Sempre que atualizar o código ou fazer deploy inicial

---

### 2. `deploy-linux.sh` (Linux/VPS)
**Deploy para servidores Linux**

```bash
chmod +x scripts/deploy-linux.sh
./scripts/deploy-linux.sh
```

**O que faz:**
- ✅ Instala/atualiza dependências
- ✅ Verifica .env
- ✅ Atualiza banco de dados
- ✅ Copia prompt MASTER
- ✅ Integração com PM2 (se instalado)

**Quando usar:** Deploy em VPS ou servidor Linux

---

### 3. `reset-test-environment.ps1` (Windows)
**Reset completo do ambiente de teste**

```powershell
.\scripts\reset-test-environment.ps1
# Ou especificar email:
.\scripts\reset-test-environment.ps1 -Email "outro@email.com"
```

**⚠️ ATENÇÃO: Este script DELETA dados!**

**O que faz:**
- 🗑️ Deleta TODAS as mensagens do usuário
- 🗑️ Deleta TODAS as estatísticas
- 🗑️ Reseta sessão do WhatsApp
- ✅ Atualiza prompt MASTER
- ✅ Limpa arquivos de sessão

**Quando usar:** 
- Antes de começar testes do zero
- Quando quiser limpar o histórico de conversas
- Para resetar ambiente de desenvolvimento

---

### 4. `update-leandro-prompt.sql`
**Script SQL para atualizar prompt do usuário específico**

```bash
# MySQL (Linux)
mysql -u root -p wppbot_saas < scripts/update-leandro-prompt.sql

# MySQL (Windows)
C:\xampp\mysql\bin\mysql.exe -u root wppbot_saas < scripts\update-leandro-prompt.sql
```

**O que faz:**
- 📝 Atualiza o prompt MASTER para leandro.berti@gmail.com
- 🗑️ Deleta mensagens antigas
- 🗑️ Deleta estatísticas antigas

**Quando usar:** 
- Quando atualizar apenas o prompt (sem reset completo)
- Para deploy apenas da configuração do bot

---

## 🚀 Workflow Recomendado

### Primeiro Deploy (Instalação)
```powershell
# 1. Deploy completo
.\scripts\deploy-and-update.ps1

# 2. Iniciar servidor
npm start

# 3. Acessar http://localhost:3000
# 4. Login: leandro.berti@gmail.com
# 5. Conectar WhatsApp
```

### Atualização de Código
```powershell
# 1. Atualizar repositório (se usar git)
git pull

# 2. Deploy/atualização
.\scripts\deploy-and-update.ps1

# 3. Reiniciar servidor
```

### Teste Limpo (Do Zero)
```powershell
# 1. Reset completo
.\scripts\reset-test-environment.ps1

# 2. Iniciar servidor
npm start

# 3. Reconectar WhatsApp (novo QR Code)
# 4. Testar fluxos
```

### Atualização Apenas do Prompt
```bash
# Opção 1: Via SQL direto
mysql -u root -p wppbot_saas < scripts/update-leandro-prompt.sql

# Opção 2: Via interface do sistema
# - Login no sistema
# - Configurações do Bot
# - Colar novo prompt
# - Salvar
```

---

## 🔧 Configuração Necessária

### Arquivo .env
Certifique-se de que o `.env` existe e está configurado:

```env
# Banco de Dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=wppbot_saas

# Servidor
PORT=3000
SESSION_SECRET=sua_secret_key_aqui

# OpenRouter (IA)
OPENROUTER_API_KEY=sua_chave_openrouter_aqui

# Ambiente
NODE_ENV=production
```

---

## 📊 Verificação de Status

### Verificar se o MySQL está rodando
```powershell
# Windows
Get-Service -Name "MySQL*"

# Linux
systemctl status mysql
```

### Verificar se o Node está rodando
```powershell
# Windows
Get-Process -Name "node"

# Linux
ps aux | grep node
```

### Verificar logs do servidor
```bash
# Se usando PM2
pm2 logs wppbot

# Se rodando direto
# Verificar o console onde executou npm start
```

---

## 🐛 Troubleshooting

### Erro: "MySQL não está rodando"
```powershell
# Windows - Iniciar XAMPP Control Panel
# Ou via PowerShell:
Start-Service -Name "MySQL*"

# Linux
sudo systemctl start mysql
```

### Erro: "Banco de dados não encontrado"
```bash
# Criar banco de dados
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS wppbot_saas;"

# Executar schema
mysql -u root -p wppbot_saas < database/schema.sql
```

### Erro: "Porta 3000 já em uso"
```powershell
# Windows - Encontrar processo
netstat -ano | findstr :3000

# Matar processo
taskkill /PID [numero_do_pid] /F

# Linux
lsof -ti:3000 | xargs kill -9
```

### Erro: "Dependências não instaladas"
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Logs Importantes

### Localização dos Logs
- **Mensagens:** Tabela `messages` no banco
- **Sessões WhatsApp:** Tabela `whatsapp_sessions`
- **Configurações Bot:** Tabela `bot_configs`

### Consultas SQL Úteis
```sql
-- Ver mensagens recentes
SELECT * FROM messages 
WHERE user_id = (SELECT id FROM users WHERE email = 'leandro.berti@gmail.com')
ORDER BY timestamp DESC 
LIMIT 50;

-- Ver status da sessão WhatsApp
SELECT * FROM whatsapp_sessions 
WHERE user_id = (SELECT id FROM users WHERE email = 'leandro.berti@gmail.com');

-- Ver configuração do bot
SELECT bot_name, is_active, updated_at, LENGTH(system_prompt) as prompt_length
FROM bot_configs 
WHERE user_id = (SELECT id FROM users WHERE email = 'leandro.berti@gmail.com');
```

---

## 🔐 Segurança

### Antes de fazer deploy em produção:
- [ ] Alterar `SESSION_SECRET` no .env
- [ ] Configurar senha do MySQL
- [ ] Usar HTTPS (certificado SSL)
- [ ] Configurar firewall
- [ ] Fazer backup do banco de dados regularmente
- [ ] Não versionar o arquivo .env (já no .gitignore)

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do servidor
2. Verificar logs do MySQL
3. Consultar tabela `messages` para ver se há erros
4. Verificar se a API do OpenRouter está respondendo

---

## 📚 Documentação Adicional

- [README.md](../README.md) - Documentação principal do projeto
- [API_DOCS.md](../API_DOCS.md) - Documentação das APIs
- [INSTALACAO.md](../INSTALACAO.md) - Guia de instalação detalhado

---

**Última atualização:** 28/11/2025
