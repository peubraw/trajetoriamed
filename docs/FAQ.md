# ❓ PERGUNTAS FREQUENTES (FAQ)

## 📱 Sobre o Sistema

### O que é o WPPBot?
É uma plataforma SaaS (Software as a Service) que permite criar e gerenciar chatbots de WhatsApp com Inteligência Artificial para atender seus clientes automaticamente 24/7.

### Como funciona?
1. Você cria uma conta
2. Conecta seu WhatsApp via QR Code
3. Configura como quer que seu bot atenda (com ajuda de IA)
4. Pronto! Seu bot passa a responder mensagens automaticamente

### Preciso de conhecimento técnico?
**NÃO!** O sistema foi feito para qualquer pessoa usar. Você só precisa:
- Saber usar WhatsApp
- Descrever como quer que seu bot funcione
- A IA faz o resto!

---

## 💰 Preços e Planos

### Tem teste grátis?
**SIM!** Todo novo usuário tem **1 dia completo de teste grátis** sem precisar cadastrar cartão.

### Quanto custa depois do teste?
Este é um projeto de código aberto para você hospedar. Você só paga:
- Servidor (se hospedar online) - opcional
- API do OpenRouter - **GRÁTIS** com limite ou pago conforme uso

### O Grok é realmente grátis?
**SIM!** O OpenRouter oferece o modelo Grok gratuitamente com limite de uso. Você pode monitorar seu uso no painel do OpenRouter.

---

## 🔧 Instalação e Configuração

### Quais os requisitos para rodar?
- Windows (com XAMPP) ou Linux/Mac
- Node.js instalado
- MySQL/MariaDB rodando
- Conta gratuita no OpenRouter

### Não consigo instalar as dependências
Execute no PowerShell:
```powershell
cd c:\xampp\htdocs\projetos\wppbot
npm install --force
```

Se persistir, delete a pasta `node_modules` e tente novamente.

### O banco de dados não conecta
Verifique:
1. XAMPP está rodando? (Apache e MySQL)
2. O banco `wppbot_saas` foi criado?
3. As credenciais no `.env` estão corretas?
4. MySQL está na porta padrão 3306?

### Erro "Cannot find module"
Provavelmente faltou instalar as dependências:
```powershell
npm install
```

---

## 📱 WhatsApp

### Posso usar meu WhatsApp pessoal?
**NÃO É RECOMENDADO!** Use um número comercial separado para evitar problemas.

### Preciso do WhatsApp Business?
**NÃO!** Funciona com WhatsApp normal ou Business.

### O QR Code não aparece
1. Aguarde alguns segundos após clicar em "Conectar"
2. Verifique se não há erros no console do navegador (F12)
3. Reinicie o servidor e tente novamente

### WhatsApp desconecta sozinho
Isso pode acontecer se:
- O celular ficou muito tempo sem internet
- Você fez logout no WhatsApp
- O servidor foi reiniciado

**Solução:** Reconecte escaneando o QR Code novamente.

### Posso usar em múltiplos dispositivos?
Cada conta pode conectar 1 WhatsApp por vez. Para múltiplos números, crie múltiplas contas.

### O bot responde mensagens de grupos?
Por padrão **NÃO**. O código ignora mensagens de grupos para evitar spam. Você pode modificar isso no arquivo `services/whatsapp.service.js`.

---

## 🤖 Inteligência Artificial

### Qual IA é usada?
**Grok 2** da xAI (empresa do Elon Musk), acessado via OpenRouter.

### Posso trocar para outra IA?
**SIM!** Você pode modificar no arquivo `services/openrouter.service.js`:
```javascript
this.model = 'x-ai/grok-2-1212'; // Troque para outro modelo
```

Modelos disponíveis: GPT-4, Claude, Gemini, etc.

### O bot não responde corretamente
Possíveis causas:
1. **Prompt mal configurado** - Refaça usando o Assistente de IA
2. **API Key inválida** - Verifique no OpenRouter
3. **Limite de uso atingido** - Veja seu dashboard do OpenRouter
4. **Bot desativado** - Marque "Bot Ativo" nas configurações

### Como melhorar as respostas?
1. Use o **Assistente de Prompts** para criar um prompt melhor
2. Seja específico sobre como quer que o bot responda
3. Teste várias vezes e ajuste
4. Adicione exemplos de conversas no prompt

### O bot pode aprender com conversas?
Não automaticamente. Cada conversa é independente. Para memória, você precisaria implementar um sistema de contexto (funcionalidade avançada).

---

## ⚙️ Configurações

### O que é "Temperatura"?
Controla a criatividade das respostas:
- **0.1-0.3**: Muito consistente, pouca variação
- **0.5-0.7**: Balanceado (recomendado)
- **0.8-1.0**: Criativo, mais variação

### O que é "Max Tokens"?
Define o tamanho máximo da resposta:
- **100-300**: Respostas curtas
- **400-600**: Respostas médias (recomendado)
- **700-1000**: Respostas longas

**OBS:** Mais tokens = mais custo (se estiver pagando)

### Como desativar o bot temporariamente?
Vá em "Configurar Bot" e desmarque "Bot Ativo". As mensagens não serão mais respondidas automaticamente.

---

## 📊 Dashboard e Estatísticas

### As estatísticas não atualizam
Elas atualizam em tempo real quando você recarrega a página. Se não aparecem:
1. Verifique se há mensagens sendo trocadas
2. Confirme que o bot está ativo
3. Veja se o WhatsApp está conectado

### Onde vejo o histórico completo?
Em "Mensagens" no menu lateral. Mostra as últimas conversas.

### Posso exportar os dados?
Atualmente não há função de exportação nativa, mas os dados estão no MySQL. Você pode exportar via phpMyAdmin.

---

## 🔒 Segurança

### Os dados são seguros?
Os dados ficam no SEU servidor/banco de dados. Você tem controle total.

### As conversas são privadas?
Sim, ficam apenas no seu banco de dados. A OpenRouter processa as mensagens mas não as armazena permanentemente.

### Devo usar HTTPS?
**SIM**, especialmente em produção! Configure um certificado SSL.

### Como proteger a API Key?
- Nunca compartilhe o arquivo `.env`
- Não suba para repositórios públicos
- Use variáveis de ambiente em produção

---

## 🚀 Produção e Hospedagem

### Como colocar online?
Opções:
1. **DigitalOcean, AWS, Azure** - VPS tradicional
2. **Heroku** - Plataforma fácil (porém paga)
3. **Railway, Render** - Alternativas modernas
4. **VPS nacional** - Hostinger, UmbleHost, etc.

### Preciso de um servidor dedicado?
Não necessariamente. Um VPS básico (1GB RAM) já funciona.

### Como fazer backup?
1. **Banco de dados**: Export via phpMyAdmin ou mysqldump
2. **Sessões WhatsApp**: Backup da pasta `.wppconnect/`
3. **Código**: Use Git

---

## 💳 Monetização

### Como cobrar dos clientes?
Você precisa implementar um gateway de pagamento:
- **Mercado Pago** - Brasileiro, fácil integração
- **Stripe** - Internacional, muito usado
- **PagSeguro** - Nacional, popular

### Quanto cobrar?
Exemplos do mercado:
- R$49-99/mês - Plano básico
- R$149-199/mês - Plano profissional
- R$299+/mês - Plano empresarial

### Como controlar assinaturas?
Você precisará adicionar:
1. Lógica para verificar pagamento
2. Sistema de planos (básico, pro, etc)
3. Renovações automáticas
4. Sistema de cancelamento

---

## 🐛 Problemas Comuns

### "EADDRINUSE: address already in use"
A porta 3000 já está em uso. Opções:
1. Mude a porta no `.env`: `PORT=3001`
2. Ou mate o processo na porta 3000

### Módulos não encontrados
```powershell
npm install
```

### Erro de permissão no Windows
Execute o PowerShell como Administrador

### Bot responde devagar
Possíveis causas:
1. Internet lenta
2. Servidor sobrecarregado
3. API do OpenRouter com delay
4. Muitas requisições simultâneas

### Sessão do WhatsApp expira constantemente
- Use um número dedicado (não pessoal)
- Mantenha o celular com internet estável
- Não use WhatsApp Web em outros lugares simultaneamente

---

## 📚 Aprendizado

### Onde aprendo mais sobre Node.js?
- **YouTube**: Curso em Vídeo, Rocketseat
- **Documentação**: nodejs.org
- **Udemy**: Cursos completos

### Como customizar o sistema?
Estude:
1. **Frontend**: HTML, CSS, JavaScript
2. **Backend**: Node.js, Express
3. **Banco**: MySQL
4. **APIs**: WPPConnect, OpenRouter

### Posso vender este sistema?
Sim, é código aberto! Você pode:
- Hospedar e cobrar mensalidade
- Revender como white-label
- Customizar para clientes

---

## 🤝 Suporte

### Onde peço ajuda?
1. Leia a documentação (README.md, INSTALACAO.md)
2. Veja os exemplos (EXEMPLOS_PROMPTS.md)
3. Busque o erro no Google
4. Pergunte em comunidades (Stack Overflow, Reddit)

### Como reportar bugs?
Crie uma issue detalhando:
- O que você tentou fazer
- O erro que apareceu
- Passos para reproduzir
- Seu ambiente (Windows/Linux, Node version, etc)

### Aceita contribuições?
Sim! Pull requests são bem-vindos.

---

## 🎯 Dicas Pro

### Otimize seu prompt
- Seja específico
- Dê exemplos de conversas
- Defina limites claros
- Use o Assistente de IA

### Monitore seus custos
- Acompanhe uso no OpenRouter
- Configure limites de gastos
- Considere cache de respostas comuns

### Faça backups regulares
- Banco de dados semanalmente
- Sessões WhatsApp antes de updates
- Código em repositório Git

### Teste antes de ativar
- Use a função "Testar Prompt"
- Envie mensagens de teste
- Peça feedback de amigos

### Melhore continuamente
- Analise conversas
- Identifique perguntas frequentes
- Ajuste o prompt conforme necessário

---

## 📞 Contato

Tem uma pergunta que não está aqui? 

Crie uma issue no GitHub ou abra uma discussão na comunidade!

---

**Última atualização:** Novembro 2024
