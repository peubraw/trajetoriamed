# 📋 GUIA DE CONFIGURAÇÃO DO WEBHOOK - META WHATSAPP API

## ✅ Status Atual
- ✅ Credenciais configuradas
- ✅ API funcionando
- ✅ Mensagens sendo enviadas com sucesso
- ⚠️ Webhook pendente de configuração

## 🔗 Configuração do Webhook no Facebook Developers

### Passo 1: Iniciar o Servidor
Primeiro, inicie seu servidor local ou em produção:

```bash
npm start
```

O servidor vai rodar na porta **3001** (conforme seu .env).

### Passo 2: Expor o Servidor (Se estiver testando localmente)

**Opção A - Usar ngrok (Recomendado para testes):**
```bash
ngrok http 3001
```

Você receberá uma URL como: `https://abcd-1234.ngrok-free.app`

**Opção B - Servidor em Produção:**
Use: `https://165.22.158.58` (seu servidor já configurado)

### Passo 3: Configurar no Facebook Developers

1. Acesse: https://developers.facebook.com/apps/1115367907182650/whatsapp-business/wa-settings/

2. Na seção **Webhook**, clique em **Configurar**

3. Preencha:
   - **URL de Retorno de Chamada**: 
     ```
     https://165.22.158.58:3001/api/meta/webhook
     ```
     OU (se estiver usando ngrok):
     ```
     https://seu-ngrok-url.ngrok-free.app/api/meta/webhook
     ```
   
   - **Verificar Token**:
     ```
     TrajetoriaMed_Webhook_2025
     ```

4. Clique em **Verificar e salvar**

5. Na seção **Campos do webhook**, ative:
   - ✅ messages (Mensagens recebidas)
   - ✅ message_status (Status de mensagens)
   - ✅ message_template_status_update (Status de templates)

### Passo 4: Testar o Webhook

Após configurar, envie uma mensagem para o WhatsApp Business:
**+55 61 9903-3732**

Você verá os logs no terminal do servidor mostrando a mensagem recebida.

## 🧪 Testar Recebimento de Mensagens

### 1. Envie uma mensagem do seu WhatsApp pessoal para:
```
+55 61 9903-3732
```

### 2. O servidor vai processar e responder automaticamente (se o bot estiver ativo)

### 3. Verificar logs:
No terminal onde o servidor está rodando, você verá:
```
🔔 Webhook recebido da Meta
📨 Mensagem recebida de: 558496464766
💬 Texto: Olá!
```

## 📝 URLs Importantes

### Webhook URL:
```
https://165.22.158.58:3001/api/meta/webhook
```

### Teste do Webhook (GET):
```
https://165.22.158.58:3001/api/meta/webhook-test
```

### Dashboard do Sistema:
```
http://localhost:3001/whatsapp.html
```

## 🔐 Credenciais Configuradas

- **App ID**: 1115367907182650
- **Phone Number ID**: 858789420659191
- **WABA ID**: 4211071149107697
- **Webhook Verify Token**: TrajetoriaMed_Webhook_2025

## ⚠️ IMPORTANTE - Limitações da Meta API

### Para ENVIAR mensagens, você tem 2 opções:

#### Opção 1: Janela de 24 horas
- O usuário envia uma mensagem primeiro
- Você tem 24 horas para responder com mensagens de texto livre

#### Opção 2: Templates Aprovados
- Crie templates em: https://business.facebook.com/wa/manage/message-templates/
- Templates precisam ser aprovados pela Meta (leva ~15 minutos)
- Podem ser enviados a qualquer momento

### Template Atual Disponível:
- ✅ **hello_world** (en_US) - Aprovado

## 🚀 Próximos Passos

1. **Criar Templates Personalizados**
   - Acesse: https://business.facebook.com/wa/manage/message-templates/
   - Crie templates para:
     - Boas-vindas
     - Confirmação de inscrição
     - Lembretes
     - Promoções

2. **Configurar Fluxo do Bot**
   - Acesse: http://localhost:3001/bot-config.html
   - Configure as respostas automáticas
   - Defina palavras-chave

3. **Ativar CRM**
   - Acesse: http://localhost:3001/crm-kanban.html
   - Gerencie leads
   - Acompanhe conversões

## 📞 Teste Final

Execute este comando para fazer um teste completo:

```bash
node test-meta-send-debug.js
```

## 🆘 Solução de Problemas

### Mensagem não chega:
- ✅ API funcionando (confirmado)
- ⚠️ Precisa usar template OU usuário iniciar conversa

### Webhook não verifica:
- Verifique se o servidor está rodando
- Confirme que a URL está acessível
- Verifique se o token está correto: `TrajetoriaMed_Webhook_2025`

### Erro 131047:
- Usuário precisa enviar mensagem primeiro, OU
- Use um template aprovado

## ✅ Checklist de Configuração

- [x] Credenciais configuradas no .env
- [x] API testada e funcionando
- [x] Mensagem enviada com sucesso
- [ ] Webhook configurado no Facebook
- [ ] Servidor em produção rodando
- [ ] Teste de recebimento de mensagens
- [ ] Templates personalizados criados

---

**Documentação Oficial:**
- https://developers.facebook.com/docs/whatsapp/cloud-api
- https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
