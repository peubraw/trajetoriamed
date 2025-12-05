# Scripts de Sincronizacao Git - VPS

Scripts para facilitar a sincronizacao do codigo entre o repositorio Git e a VPS.

## Scripts Disponiveis

### 1. `setup-git-vps.ps1`
**Uso inicial** - Configura o Git na VPS pela primeira vez.

```powershell
.\scripts\setup-git-vps.ps1
```

**O que faz:**
- Instala Git na VPS (se necessario)
- Inicializa repositorio Git
- Configura remote do GitHub
- Faz pull do codigo
- Restaura arquivos sensiveis (.env, tokens)
- Instala dependencias
- Reinicia o servico PM2

### 2. `git-pull-vps.ps1`
**Uso diario** - Atualiza o codigo na VPS com as mudancas do Git.

```powershell
.\scripts\git-pull-vps.ps1
```

**O que faz:**
- Backup de .env e tokens
- Git pull das mudancas
- Restaura arquivos sensiveis
- Instala novas dependencias
- Reinicia o servico

### 3. `sync-to-vps.ps1`
**Alternativa** - Sincroniza via SCP (nao usa Git).

```powershell
.\scripts\sync-to-vps.ps1
```

**O que faz:**
- Envia arquivos via SCP
- Preserva .env e tokens
- Instala dependencias
- Reinicia o servico

## Fluxo de Trabalho Recomendado

### 1. Fazer mudancas locais
```powershell
# Edite os arquivos necessarios
# Teste localmente
```

### 2. Commit e push para GitHub
```powershell
git add .
git commit -m "feat: descricao das mudancas"
git push origin main
```

### 3. Atualizar na VPS
```powershell
.\scripts\git-pull-vps.ps1
```

## Configuracao

Os scripts usam as seguintes configuracoes (edite se necessario):

```powershell
$VPS_HOST = "165.22.158.58"
$VPS_USER = "root"
$VPS_PATH = "/var/www/wppbot"
$REPO_URL = "https://github.com/peubraw/trajetoriamed.git"
```

## Arquivos Protegidos

Os seguintes arquivos/pastas sao automaticamente preservados durante atualizacoes:
- `.env` - Configuracoes de ambiente
- `tokens/` - Tokens do WhatsApp
- `node_modules/` - Dependencias (reinstaladas se necessario)

## Resolucao de Problemas

### Erro: "could not read Username for 'https://github.com'"
O repositorio precisa ser publico ou configurar autenticacao SSH.

**Solucao:** Tornar o repositorio publico ou usar `sync-to-vps.ps1`

### Erro: "port already in use"
Outro processo esta usando a porta 3001.

**Solucao:**
```bash
ssh root@165.22.158.58 "pm2 stop all && pm2 restart wppbot-saas"
```

### Erro: "No such file or directory"
Caminho da VPS incorreto.

**Solucao:** Verificar e ajustar `$VPS_PATH` nos scripts.

## Comandos Uteis

### Verificar status na VPS
```powershell
ssh root@165.22.158.58 "pm2 status"
```

### Ver logs em tempo real
```powershell
ssh root@165.22.158.58 "pm2 logs wppbot-saas"
```

### Reiniciar servico manualmente
```powershell
ssh root@165.22.158.58 "cd /var/www/wppbot && pm2 restart wppbot-saas"
```

### Verificar estrutura atualizada
```powershell
ssh root@165.22.158.58 "ls -la /var/www/wppbot"
```
