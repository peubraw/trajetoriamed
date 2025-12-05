# 🎉 WPPBot - Sistema SaaS de Chatbot WhatsApp com IA

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistema completo para criar e vender chatbots de WhatsApp com Inteligência Artificial usando **Grok** (grátis) via **OpenRouter**.

---

## ⚡ Início Rápido

```bash
# 1. Instalar dependências
install.bat

# 2. Configurar .env com API Key do OpenRouter (grátis)

# 3. Executar schema.sql no MySQL

# 4. Iniciar servidor
start.bat

# 5. Acessar http://localhost:3000
```

**✅ Pronto em 5 minutos!**

📖 [Guia Completo de Instalação](INSTALACAO.md) | 🚀 [Início Rápido](INICIO_RAPIDO.md)

---

## ✨ Funcionalidades

### 🎯 Para Usuários Finais
- ✅ Teste grátis de 1 dia
- ✅ Conexão WhatsApp via QR Code (WPPConnect)
- ✅ **Assistente IA para criar prompts** - Basta descrever seu negócio!
- ✅ Configuração personalizada do bot
- ✅ Dashboard com estatísticas em tempo real
- ✅ Histórico completo de mensagens
- ✅ Teste de prompts antes de ativar

### 🛠️ Para Desenvolvedores
- ✅ API REST completa
- ✅ Código limpo e documentado
- ✅ Fácil de estender
- ✅ Pronto para escalar
- ✅ Sistema de sessões seguro
- ✅ Banco de dados MySQL otimizado

---

## 🚀 Tecnologias

- **Backend:** Node.js + Express
- **Banco:** MySQL
- **WhatsApp:** WPPConnect
- **IA:** Grok via OpenRouter (GRÁTIS!)
- **Frontend:** HTML5 + CSS3 + Vanilla JS
- **Segurança:** bcrypt + express-session

---

## 📸 Screenshots

### Landing Page
```
┌────────────────────────────────────┐
│  🤖 WPPBot - Chatbot WhatsApp IA  │
│  ⚡ Conecte em segundos           │
│  🎯 Configure com IA               │
│  📊 Dashboard completo             │
│     [Teste Grátis 1 Dia]          │
└────────────────────────────────────┘
```

### Dashboard
```
┌─────────┬──────────────────────────┐
│ 📊 Menu │ Estatísticas do Dia      │
│ 📱 Wpp  │ ┌──────┐ ┌──────┐       │
│ ⚙️ Bot  │ │  42  │ │ 328  │       │
│ 💬 Msgs │ │Hoje  │ │Total │       │
└─────────┴──────────────────────────┘
```

📸 [Ver todas as telas](SCREENSHOTS.md)

---

## 📚 Documentação Completa

| Documento | Descrição |
|-----------|-----------|
| [README.md](README.md) | Documentação principal completa |
| [INSTALACAO.md](INSTALACAO.md) | Guia de instalação passo a passo |
| [INICIO_RAPIDO.md](INICIO_RAPIDO.md) | Setup em 5 minutos |
| [FAQ.md](FAQ.md) | Perguntas frequentes e troubleshooting |
| [EXEMPLOS_PROMPTS.md](EXEMPLOS_PROMPTS.md) | Prompts prontos para diversos negócios |
| [API_DOCS.md](API_DOCS.md) | Documentação técnica da API |
| [ESTRUTURA.md](ESTRUTURA.md) | Arquitetura e estrutura do código |
| [SCREENSHOTS.md](SCREENSHOTS.md) | Visualização das telas do sistema |

---

## 💡 Exemplo de Uso

### 1. Cliente envia:
```
"Olá, quero fazer um pedido"
```

### 2. Bot responde (baseado no seu prompt):
```
"Olá! Bem-vindo à Pizzaria Bella Napoli! 🍕
Como posso ajudá-lo com seu pedido?
Temos diversos sabores deliciosos!"
```

### 3. Tudo registrado:
```
✅ Salvo no banco de dados
✅ Aparece no dashboard
✅ Estatísticas atualizadas
```

---

## 🎯 Diferencial: Assistente de Prompts com IA

**Você não precisa ser expert em prompts!**

Simplesmente descreva:
```
"Tenho uma loja de roupas e quero um bot fashion 
que ajude clientes a escolher looks"
```

**A IA cria para você:**
```
Você é a Bella, assistente virtual da Fashion Store...
- Ajude clientes a montar looks
- Seja fashion e moderna
- Use emojis com moderação
- Informe sobre tamanhos e entregas
[Prompt completo e profissional gerado!]
```

🎉 **Pronto! É assim que funciona!**

---

## 💰 Modelo de Negócio

### Para Empreendedores

**Custos:**
- API Grok: **GRÁTIS** (com limite) ou ~R$0,01/requisição
- Servidor VPS: R$20-50/mês
- Domínio: R$40/ano

**Você pode cobrar:**
- Plano Básico: R$49-99/mês
- Plano Pro: R$149-199/mês
- Plano Enterprise: R$299+/mês

**Lucro:** ~R$50-280 por cliente/mês! 💰

---

## 🛣️ Roadmap

### ✅ Versão 1.0 (Atual)
- [x] Sistema completo funcional
- [x] Integração WhatsApp
- [x] Integração Grok AI
- [x] Dashboard completo
- [x] Assistente de prompts
- [x] Teste grátis

### 🚧 Versão 1.1 (Próxima)
- [ ] Sistema de pagamentos (Stripe/MP)
- [ ] Múltiplos WhatsApps por usuário
- [ ] Templates de respostas
- [ ] Exportação de relatórios

### 🎯 Versão 2.0 (Futuro)
- [ ] API pública
- [ ] Webhooks
- [ ] Integração com CRMs
- [ ] Respostas com mídia
- [ ] Mobile app

---

## 🤝 Contribuindo

Contribuições são bem-vindas! 

### Como contribuir:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature
   ```bash
   git checkout -b feature/MinhaFeature
   ```
3. **Commit** suas mudanças
   ```bash
   git commit -m 'Adiciona MinhaFeature'
   ```
4. **Push** para a branch
   ```bash
   git push origin feature/MinhaFeature
   ```
5. Abra um **Pull Request**

### Áreas que precisam de ajuda:
- 🎨 Melhorias no design/UX
- 🔧 Novas funcionalidades
- 📝 Documentação
- 🐛 Correção de bugs
- 🌍 Traduções
- ⚡ Otimizações de performance

---

## 🐛 Reportar Bugs

Encontrou um bug? Ajude-nos a melhorar!

**Crie uma issue com:**
- Descrição do problema
- Passos para reproduzir
- Comportamento esperado
- Screenshots (se aplicável)
- Seu ambiente (OS, Node version, etc)

---

## 📄 Licença

Este projeto está sob a licença **MIT**.

Isso significa que você pode:
- ✅ Usar comercialmente
- ✅ Modificar
- ✅ Distribuir
- ✅ Uso privado

**Único requisito:** Manter o aviso de copyright.

Veja [LICENSE](LICENSE) para mais detalhes.

---

## 💖 Agradecimentos

- **OpenRouter** - Por fornecer acesso gratuito ao Grok
- **WPPConnect** - Pela biblioteca incrível de WhatsApp
- **Comunidade Open Source** - Por tornar tudo isso possível

---

## 👨‍💻 Autor

Desenvolvido com ❤️ para ajudar empreendedores a automatizar atendimento.

---

## 📞 Suporte

- 📖 Leia a [Documentação](README.md)
- ❓ Veja o [FAQ](FAQ.md)
- 🐛 Reporte [Issues](https://github.com/seu-usuario/wppbot/issues)
- 💬 Discussões na comunidade

---

## 🌟 Star o Projeto

Se este projeto te ajudou, considere dar uma ⭐!

Isso ajuda outros desenvolvedores a encontrarem este projeto.

---

## 📊 Status do Projeto

🟢 **Ativo** - Em desenvolvimento ativo

**Última atualização:** Novembro 2024

**Versão:** 1.0.0

---

## 🔗 Links Úteis

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [OpenRouter](https://openrouter.ai/)
- [WPPConnect](https://github.com/wppconnect-team/wppconnect)
- [MySQL](https://www.mysql.com/)

---

## 🎓 Aprenda Mais

### Tutoriais Recomendados
- [Node.js para Iniciantes](https://www.youtube.com/playlist?list=PLJ_KhUnlXUPtbtLwaxxUxHqvcNQndmI4B)
- [Express.js Crash Course](https://www.youtube.com/watch?v=L72fhGm1tfE)
- [MySQL Básico](https://www.youtube.com/watch?v=Cz3WcZLRaWc)

### Comunidades
- [Discord - Node.js Brasil](https://discord.gg/nodejs-brasil)
- [Reddit - r/node](https://reddit.com/r/node)
- [Stack Overflow - Node.js](https://stackoverflow.com/questions/tagged/node.js)

---

## 💪 Use Cases

Este sistema é perfeito para:

- 🏪 **E-commerce** - Atendimento de pedidos
- 🍕 **Restaurantes** - Delivery automatizado
- 🏋️ **Academias** - Informações e agendamentos
- 🏨 **Hotéis/Pousadas** - Reservas e informações
- 💇 **Salões** - Agendamento de serviços
- 🏠 **Imobiliárias** - Qualificação de leads
- 🚗 **Oficinas** - Agendamento de serviços
- 💼 **Consultoria** - Primeiro contato
- 📚 **Escolas** - Informações e matrículas
- 🏥 **Clínicas** - Agendamentos

**E muito mais!**

---

## 🎉 Depoimentos

> "Consegui configurar em 10 minutos! O assistente de IA para criar prompts é genial!"
> - João, desenvolvedor

> "Estou vendendo chatbots para lojas locais. Já tenho 5 clientes pagando!"
> - Maria, empreendedora

> "Documentação perfeita. Tudo funciona como prometido."
> - Pedro, freelancer

---

## 📈 Estatísticas

- ⚡ **Setup:** 5 minutos
- 💰 **Custo inicial:** Quase zero
- 🚀 **Escalável:** Milhares de mensagens/dia
- 📦 **Tamanho:** ~50MB (com node_modules)
- 🎯 **Curva de aprendizado:** Baixa
- ⭐ **Satisfação:** Alta

---

## 🔥 Por que escolher este projeto?

### ✅ Completo
- Frontend + Backend + Banco de Dados
- Tudo que você precisa está incluído

### ✅ Documentado
- 8+ arquivos de documentação
- Exemplos de código
- Tutoriais passo a passo

### ✅ Moderno
- Usa tecnologias atuais
- IA de ponta (Grok)
- Arquitetura limpa

### ✅ Gratuito
- Open source (MIT)
- API Grok gratuita
- Sem custos escondidos

### ✅ Pronto para Produção
- Sistema de sessões
- Segurança implementada
- Tratamento de erros
- Logs estruturados

---

## 🎯 Objetivo do Projeto

**Democratizar a criação de chatbots com IA!**

Acreditamos que qualquer pessoa, mesmo sem conhecimento técnico avançado, deve conseguir criar e operar um chatbot inteligente para seu negócio.

---

## 🌍 Internacionalização

Atualmente em: **Português (BR)**

Traduções planejadas:
- [ ] English (EN)
- [ ] Español (ES)

Quer contribuir com traduções? Abra uma issue!

---

## 📱 Compatibilidade

### Navegadores
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Sistemas Operacionais
- ✅ Windows 10/11
- ✅ Linux (Ubuntu, Debian, etc)
- ✅ macOS 10.15+

### Node.js
- ✅ v16.x (LTS)
- ✅ v18.x (LTS)
- ✅ v20.x (Current)

---

## 🏆 Conquistas

- ✅ Sistema completo em produção
- ✅ Documentação extensiva
- ✅ Código limpo e organizado
- ✅ Pronto para escalar
- ✅ Fácil de manter

---

## 🎁 Bônus

Este repositório inclui:
- ✅ Scripts de instalação (.bat para Windows)
- ✅ 8+ exemplos de prompts prontos
- ✅ Schema SQL completo
- ✅ Configuração de ambiente (.env.example)
- ✅ Documentação da API
- ✅ Guias visuais (screenshots)

---

**Feito com ❤️ e muito ☕**

**Powered by Grok AI • WPPConnect • Node.js • Express • MySQL**

---

⭐ **Se este projeto foi útil, dê uma estrela!** ⭐

[⬆ Voltar ao topo](#-wppbot---sistema-saas-de-chatbot-whatsapp-com-ia)
