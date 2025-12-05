# 🚀 GUIA RÁPIDO DE INSTALAÇÃO

## Passo a Passo para Rodar o Projeto

### 1️⃣ Instalar Node.js
- Baixe em: https://nodejs.org/
- Instale a versão LTS (recomendada)
- Verifique: abra PowerShell e digite `node --version`

### 2️⃣ Iniciar XAMPP
- Abra o XAMPP Control Panel
- Inicie **Apache** e **MySQL**

### 3️⃣ Criar Banco de Dados
1. Acesse: http://localhost/phpmyadmin
2. Clique em "SQL" no topo
3. Copie TODO o conteúdo do arquivo `database/schema.sql`
4. Cole na área de texto e clique em "Executar"
5. Verifique se o banco `wppbot_saas` foi criado

### 4️⃣ Instalar Dependências
Abra PowerShell nesta pasta e execute:
```powershell
npm install
```

### 5️⃣ Obter API Key do OpenRouter (GRÁTIS)
1. Acesse: https://openrouter.ai/
2. Clique em "Sign In" (pode usar conta Google)
3. Vá em "Keys" no menu
4. Clique em "Create Key"
5. Dê um nome (ex: "WPPBot") e copie a chave
6. Abra o arquivo `.env` nesta pasta
7. Cole a chave na linha: `OPENROUTER_API_KEY=cole_aqui`

### 6️⃣ Iniciar o Servidor
No PowerShell, execute:
```powershell
npm start
```

Você verá:
```
🚀 Servidor rodando na porta 3000
📱 Acesse: http://localhost:3000
```

### 7️⃣ Acessar o Site
Abra seu navegador e vá para: **http://localhost:3000**

---

## ✅ Checklist Antes de Começar

- [ ] Node.js instalado
- [ ] XAMPP rodando (Apache + MySQL)
- [ ] Banco de dados criado
- [ ] `npm install` executado
- [ ] API Key do OpenRouter no arquivo `.env`
- [ ] Servidor iniciado com `npm start`

---

## 🎯 Primeira Utilização

1. **Criar Conta**
   - Clique em "Teste Grátis"
   - Preencha: Nome, Email, Senha
   - Clique em "Começar Teste Grátis"

2. **Conectar WhatsApp**
   - No menu lateral, clique em "📱 WhatsApp"
   - Clique em "Conectar WhatsApp"
   - Escaneie o QR Code com seu celular:
     - Abra WhatsApp
     - Vá em Menu (⋮) > Aparelhos conectados
     - Toque em "Conectar aparelho"
     - Escaneie o QR Code da tela

3. **Configurar o Bot** (A melhor parte!)
   - Vá em "✏️ Configurar Bot"
   - Na seção roxa "Assistente de Prompt":
     - Descreva seu negócio e como quer que o bot atenda
     - Exemplo: "Tenho uma pizzaria e quero um bot amigável que ajude os clientes a fazer pedidos"
   - Clique em "✨ Gerar Prompt com IA"
   - A IA criará um prompt completo para você!
   - Revise, ajuste se quiser
   - Marque "Bot Ativo"
   - Clique em "Salvar Configuração"

4. **Testar**
   - Envie uma mensagem para o número do WhatsApp conectado
   - O bot responderá automaticamente!
   - Veja o histórico em "💬 Mensagens"

---

## ❓ Problemas Comuns

### "Cannot find module"
```powershell
npm install
```

### "EADDRINUSE: address already in use"
Algo já está usando a porta 3000. Mude no `.env`:
```
PORT=3001
```

### "ER_BAD_DB_ERROR: Unknown database"
Execute o `schema.sql` no phpMyAdmin novamente.

### "Invalid API Key"
Verifique se copiou a chave completa no `.env` sem espaços.

### WhatsApp não conecta
- Feche outras sessões do WhatsApp Web
- Delete a pasta `.wppconnect` e tente novamente
- Reinicie o servidor

---

## 📞 Testando o Bot

Depois de configurado, envie mensagens para o WhatsApp conectado:

**Exemplos:**
- "Olá"
- "Quero fazer um pedido"
- "Qual o horário de funcionamento?"
- "Quais as promoções?"

O bot responderá de acordo com o prompt que você configurou!

---

## 🎉 Pronto!

Seu sistema de chatbot WhatsApp com IA está funcionando!

Explore o dashboard para ver:
- 📊 Estatísticas de mensagens
- 💬 Histórico de conversas
- ⚙️ Ajustes de configuração

---

**Dica Pro:** Use o Assistente de Prompts (IA) sempre que quiser ajustar o comportamento do bot. É muito mais fácil do que criar prompts manualmente!
