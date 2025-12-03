# 🤖 WPPBot SaaS - Chatbot WhatsApp com IA

Sistema completo para venda de chatbots de WhatsApp com Inteligência Artificial usando Grok via OpenRouter.

## 📋 Funcionalidades

✅ **Landing Page** com informações do produto
✅ **Sistema de Autenticação** (Login/Registro)
✅ **1 Dia de Teste Grátis** para novos usuários
✅ **Conexão WhatsApp via QR Code** usando WPPConnect
✅ **Integração com Grok AI** (grátis) via OpenRouter
✅ **Assistente de Criação de Prompts** - IA ajuda a criar o prompt perfeito
✅ **Configuração Personalizada** do bot
✅ **Dashboard Completo** com estatísticas
✅ **Histórico de Mensagens**
✅ **Teste de Prompts** em tempo real

## 🚀 Instalação

### Pré-requisitos

- Node.js (v14+)
- MySQL/MariaDB (XAMPP)
- Conta no OpenRouter (https://openrouter.ai/)

### Passo 1: Clonar/Baixar o Projeto

O projeto já está em: `c:\xampp\htdocs\projetos\wppbot`

### Passo 2: Instalar Dependências

```bash
cd c:\xampp\htdocs\projetos\wppbot
npm install
```

### Passo 3: Configurar Banco de Dados

1. Inicie o XAMPP (Apache e MySQL)
2. Acesse phpMyAdmin: http://localhost/phpmyadmin
3. Execute o script SQL em: `database/schema.sql`

### Passo 4: Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`
2. Configure as variáveis:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=wppbot_saas

# Server
PORT=3000
SESSION_SECRET=sua_chave_secreta_aqui

# OpenRouter API (GRÁTIS COM GROK)
OPENROUTER_API_KEY=sua_api_key_aqui

# App Settings
TRIAL_DAYS=1
```

### Passo 5: Obter API Key do OpenRouter (GRÁTIS)

1. Acesse: https://openrouter.ai/
2. Crie uma conta
3. Vá em "Keys" e crie uma nova chave
4. Cole a chave no arquivo `.env`

**OBS:** O modelo Grok é GRATUITO no OpenRouter!

### Passo 6: Iniciar o Servidor

```bash
npm start
```

Ou para desenvolvimento (auto-restart):

```bash
npm run dev
```

### Passo 7: Acessar o Sistema

Abra no navegador: **http://localhost:3000**

## 📱 Como Usar

### 1. Criar Conta
- Clique em "Teste Grátis"
- Preencha seus dados
- Você terá 1 dia de teste completo

### 2. Conectar WhatsApp
- Vá em "WhatsApp" no menu
- Clique em "Conectar WhatsApp"
- Escaneie o QR Code com seu celular
- Abra WhatsApp > Menu (⋮) > Aparelhos conectados > Conectar aparelho

### 3. Configurar o Bot

**Opção A: Usar Assistente de IA (Recomendado)**
1. Vá em "Configurar Bot"
2. No card roxo "Assistente de Prompt", descreva seu negócio
   - Exemplo: "Tenho uma pizzaria e quero um bot simpático que ajude clientes a fazer pedidos, informe promoções e responda sobre horário de funcionamento"
3. Clique em "Gerar Prompt com IA"
4. A IA criará um prompt completo e profissional
5. Revise e ajuste se necessário

**Opção B: Criar Manualmente**
1. Digite diretamente o prompt no campo "Prompt do Sistema"
2. Configure temperatura e max tokens
3. Ative o bot

### 4. Testar o Bot
- Clique em "Testar Prompt"
- Digite uma mensagem de exemplo
- Veja como o bot responderá

### 5. Salvar e Ativar
- Marque "Bot Ativo"
- Clique em "Salvar Configuração"
- Pronto! Seu bot está funcionando

### 6. Monitorar
- Dashboard mostra estatísticas em tempo real
- Veja todas as conversas em "Mensagens"
- Acompanhe quantas pessoas seu bot atendeu

## 🎯 Exemplo de Uso do Assistente de Prompts

**Você descreve:**
> "Tenho uma loja de roupas femininas. Quero um bot que seja fashion, use emojis, ajude as clientes a escolher looks, informe sobre promoções e tire dúvidas sobre tamanhos e entregas."

**A IA gera:**
> "Você é a assistente virtual da [Nome da Loja], uma loja de moda feminina. Seu nome é Bella e você é super fashion, amigável e usa emojis para deixar a conversa mais divertida! 👗✨
>
> Suas responsabilidades:
> - Ajudar clientes a escolher looks perfeitos baseado no estilo delas
> - Informar sobre as promoções atuais com entusiasmo
> - Tirar dúvidas sobre tamanhos, tecidos e modelagens
> - Explicar formas de pagamento e prazos de entrega
> - Ser sempre gentil e dar sugestões personalizadas
>
> Tom de voz: Amigável, fashion, empolgada mas profissional
> Use emojis moderadamente
> Seja objetiva mas acolhedora
> Se não souber algo, seja honesta e ofereça ajuda para falar com um humano"

## 🛠️ Estrutura do Projeto

```
wppbot/
├── config/
│   └── database.js          # Configuração MySQL
├── database/
│   └── schema.sql           # Schema do banco
├── routes/
│   ├── auth.routes.js       # Rotas de autenticação
│   ├── whatsapp.routes.js   # Rotas WhatsApp
│   ├── bot.routes.js        # Rotas do bot (prompts, config)
│   └── dashboard.routes.js  # Rotas do dashboard
├── services/
│   ├── openrouter.service.js   # Integração OpenRouter/Grok
│   └── whatsapp.service.js     # Integração WPPConnect
├── public/
│   ├── index.html           # Página principal
│   ├── css/
│   │   └── style.css        # Estilos
│   └── js/
│       └── app.js           # JavaScript frontend
├── .env                     # Variáveis de ambiente
├── .gitignore
├── package.json
└── server.js                # Servidor Express
```

## 🔑 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/logout` - Sair
- `GET /api/auth/check` - Verificar sessão

### WhatsApp
- `POST /api/whatsapp/connect` - Conectar WhatsApp
- `GET /api/whatsapp/qrcode` - Obter QR Code
- `GET /api/whatsapp/status` - Status da conexão
- `POST /api/whatsapp/disconnect` - Desconectar

### Bot
- `GET /api/bot/config` - Obter configuração
- `POST /api/bot/config` - Salvar configuração
- `POST /api/bot/generate-prompt` - Gerar prompt com IA ⭐
- `POST /api/bot/test-prompt` - Testar prompt

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas
- `GET /api/dashboard/user-info` - Info do usuário

## 🎨 Personalização

### Alterar Cores
Edite as variáveis CSS em `public/css/style.css`:

```css
:root {
    --primary-color: #25D366;  /* Verde WhatsApp */
    --secondary-color: #128C7E;
    --dark-color: #075E54;
}
```

### Alterar Período de Teste
No arquivo `.env`:
```
TRIAL_DAYS=1  # Altere para o número de dias desejado
```

## 🐛 Troubleshooting

### Erro ao conectar WhatsApp
- Certifique-se que não há outra instância do WhatsApp Web aberta
- Limpe a pasta `.wppconnect/` e tente novamente
- Reinicie o servidor

### Erro de API Key
- Verifique se a chave está correta no `.env`
- Teste a chave em: https://openrouter.ai/playground

### Banco de dados não conecta
- Verifique se o MySQL está rodando no XAMPP
- Confirme usuário/senha no `.env`
- Execute o schema.sql novamente

## 📝 Observações Importantes

1. **Sessões do WhatsApp**: Ficam salvas na pasta `.wppconnect/`. Não delete enquanto estiver usando
2. **Teste Grátis**: Após 1 dia, a conta expira. Implemente sistema de pagamento conforme sua necessidade
3. **Grok Grátis**: O modelo Grok no OpenRouter tem uso gratuito limitado. Monitore em sua conta
4. **Segurança**: Em produção, use HTTPS e altere o SESSION_SECRET

## 🚀 Próximos Passos (Melhorias Futuras)

- [ ] Sistema de pagamento (Stripe/PayPal)
- [ ] Múltiplos planos de assinatura
- [ ] Webhook para notificações
- [ ] Suporte a múltiplos WhatsApps por usuário
- [ ] Respostas com mídia (imagens, áudios)
- [ ] Integração com banco de conhecimento
- [ ] Analytics avançados
- [ ] Temas personalizados

## 📄 Licença

Este projeto é de código aberto para fins educacionais.

## 🤝 Suporte

Para dúvidas ou problemas, crie uma issue no repositório.

---

**Desenvolvido com ❤️ usando Node.js, WPPConnect e Grok AI**
