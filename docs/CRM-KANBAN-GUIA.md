# 🎯 CRM KANBAN - SISTEMA DE VENDAS CONVERSACIONAIS

## 📋 Visão Geral

Sistema completo de CRM integrado ao chatbot WhatsApp, com pipeline visual Kanban, automação inteligente e análise de vendas em tempo real.

---

## 🚀 INSTALAÇÃO E CONFIGURAÇÃO

### 1. Instalar Schema do Banco de Dados

Execute o arquivo SQL para criar as tabelas necessárias:

```bash
mysql -u root -p wppbot_saas < database/crm-schema.sql
```

Ou via phpMyAdmin:
- Abra phpMyAdmin
- Selecione o banco `wppbot_saas`
- Vá em "SQL" e cole o conteúdo de `database/crm-schema.sql`
- Clique em "Executar"

### 2. Reiniciar o Servidor

```bash
npm start
```

### 3. Acessar o CRM

- **Kanban:** http://localhost:3000/crm-kanban.html
- **Dashboard:** http://localhost:3000/crm-dashboard.html

---

## 📊 FUNCIONALIDADES PRINCIPAIS

### 🎯 Kanban Board (Pipeline Visual)

**Acesso:** `/crm-kanban.html`

**Funcionalidades:**
- ✅ Visualização em colunas (7 estágios padrão)
- ✅ Drag & Drop para mover leads entre estágios
- ✅ Cards coloridos com informações do lead
- ✅ Badges de status do bot (Ativo/Pausado)
- ✅ Termômetro de temperatura (🔥 Quente / 🌤️ Morno / ❄️ Frio)
- ✅ Filtros por vendedor, temperatura e busca
- ✅ Modal de detalhes com histórico completo
- ✅ Botão de pausar/ativar bot individualmente
- ✅ Exportação para CSV

**Estágios Padrão:**
1. **Novos / Triagem** (Bot Ativo) - Lead chegou, bot coletando dados
2. **Nutrição / Apresentação** (Bot Ativo) - Bot apresentando curso
3. **Quente / Link Enviado** (Bot Pausado) - Link de pagamento enviado
4. **Em Negociação** (Humano) - Vendedor negociando
5. **Aguardando Pagamento** - Boleto/PIX gerado
6. **Venda Confirmada** ✅ - Pagamento aprovado
7. **Perdido / Arquivado** ❌ - Lead perdido (motivo obrigatório)

### 📈 Dashboard Gerencial

**Acesso:** `/crm-dashboard.html`

**KPIs Financeiros:**
- 💰 **Faturamento Realizado** - Vendas confirmadas (mês atual)
- 📊 **Pipeline Ponderado** - Previsão de fechamento (weighted forecast)
- ⏳ **Aguardando Pagamento** - Checkouts iniciados não concluídos
- 💸 **Dinheiro na Mesa** - Total de leads perdidos

**Análises:**
- 📉 **Gráfico de Motivos de Perda** (Pizza) - Por que os leads são perdidos
- 🎯 **Pipeline por Etapa** (Barras) - Valor total em cada estágio
- 🏆 **Ranking de Vendedores** - Conversão, faturamento e badges

**Badges de Gamificação:**
- 👑 **Alpha** - Maior volume de vendas (R$)
- 🎯 **Sniper** - Melhor taxa de conversão (%)

---

## 🤖 INTEGRAÇÃO COM CHATBOT

### Criação Automática de Leads

Quando um cliente envia mensagem no WhatsApp:
1. ✅ Sistema cria/atualiza lead automaticamente no CRM
2. ✅ Coleta: Nome, RQE, Especialidade, Curso de Interesse
3. ✅ Distribui para vendedor (se configurado)
4. ✅ Calcula score automaticamente (0-100)
5. ✅ Define temperatura (quente/morno/frio)

### Bot ON/OFF Automático

**Regras Inteligentes:**

1. **Bot PAUSA Automaticamente quando:**
   - Vendedor envia mensagem manual para o lead
   - Lead é movido para etapa de "Negociação"
   - Sistema detecta ex-aluno

2. **Bot ATIVA Automaticamente quando:**
   - Lead é movido para etapa com "Bot Ativo" (Triagem/Nutrição)
   - Vendedor usa comando `/despausar 5584999999999`

### Notificações para Vendedores

O bot notifica automaticamente quando:
- 💳 Link de pagamento é enviado
- 🎓 Ex-aluno é identificado
- 🔥 Lead está com score alto (>70)
- ⚠️ SLA violado (sem resposta há muito tempo)

**Formato da notificação:**
```
💳 LINK DE PAGAMENTO ENVIADO

👤 Cliente: João Silva
📱 Telefone: 5584999999999
📦 Produto: Pós Medicina do Trabalho
💬 Última mensagem: "Quero o link de pagamento"

✅ Link enviado com sucesso!
```

---

## 📊 LEAD SCORING (Pontuação Automática)

**Como funciona:**
O sistema calcula um score de 0-100 baseado em:

- **Dados preenchidos:**
  - Nome: +10 pontos
  - Email: +10 pontos
  - RQE: +15 pontos
  - Curso de interesse: +20 pontos

- **Engajamento:**
  - Mais de 5 mensagens: +15 pontos
  - Mais de 10 mensagens: +10 pontos adicionais

- **Recência:**
  - Última resposta <1h: +20 pontos
  - Última resposta <24h: +10 pontos

**Temperatura:**
- 🔥 **Quente (Hot):** Score ≥70 + respondeu nas últimas 24h
- 🌤️ **Morno (Warm):** Score entre 30-69
- ❄️ **Frio (Cold):** Score <30 ou sem resposta há +72h

---

## ⏱️ SLA (Service Level Agreement)

**Controle de Tempo de Resposta:**

- Quando ativado, monitora o tempo desde a última mensagem do lead
- Tempo padrão: 15 minutos
- Alerta visual no card quando SLA está próximo de vencer
- Notificação para gestor se SLA for violado

**Configuração:**
```sql
UPDATE crm_settings SET 
    sla_enabled = TRUE,
    sla_response_time = 900,  -- 900 segundos = 15 minutos
    sla_business_hours_only = TRUE
WHERE user_id = 1;
```

---

## 🔄 DISTRIBUIÇÃO DE LEADS

### Modo Manual
Gestor atribui manualmente cada lead a um vendedor.

### Modo Roleta (Round Robin)
Sistema distribui automaticamente de forma sequencial:
- Lead 1 → Vendedor A
- Lead 2 → Vendedor B
- Lead 3 → Vendedor C
- Lead 4 → Vendedor A (recomeça)

### Modo Shark Tank (Tubarão) 🦈
- Novo lead fica disponível para TODOS os vendedores
- Notificação enviada no grupo
- Primeiro vendedor que clicar em "Pegar Lead" assume a titularidade
- Timeout: Se ninguém pegar em 5 minutos, atribui automaticamente

**Configurar:**
```sql
UPDATE crm_settings SET distribution_mode = 'shark_tank' WHERE user_id = 1;
```

---

## 📥 EXPORTAÇÃO DE DADOS

### Formato CSV (Compatível com Excel)

**Endpoint:** `/api/crm/export`

**Colunas Exportadas:**
```
ID | Ex-aluno | Nome | Estado | Email | Telefone | Interesse | Curso | 
Canal | Data Entrada | Hora Entrada | Ultima Situação | Última Mensagem | 
Vendedor | Observação | Motivo Perda | Valor
```

**Como usar:**
1. No Kanban, clique em "📥 Exportar CSV"
2. Arquivo será baixado automaticamente
3. Abrir no Excel/Google Sheets

**Filtrar por estágio:**
```
GET /api/crm/export?stage=3
```

---

## 🔌 API ENDPOINTS

### Leads

```javascript
// Buscar todos os leads
GET /api/crm/leads
Query: ?stage=1&seller=2&temperature=hot&search=joão

// Buscar lead específico
GET /api/crm/leads/:id

// Criar lead manual
POST /api/crm/leads
Body: { phone, name, email, state, interestedCourse }

// Mover lead para estágio
POST /api/crm/leads/:id/move
Body: { stageId: 3 }

// Atribuir a vendedor
POST /api/crm/leads/:id/assign
Body: { sellerId: 2 }

// Pausar/Ativar bot
POST /api/crm/leads/:id/bot-toggle
Body: { active: false }

// Adicionar nota
POST /api/crm/leads/:id/notes
Body: { note: "Cliente pediu desconto", isPinned: false }
```

### Dashboard

```javascript
// Estatísticas financeiras
GET /api/crm/dashboard/stats

// Motivos de perda
GET /api/crm/dashboard/lost-reasons

// Ranking de vendedores
GET /api/crm/dashboard/sellers
```

---

## 🔔 EVENTOS SOCKET.IO (Tempo Real)

### Cliente (Frontend)

```javascript
const socket = io();

// Entrar na sala do CRM
socket.emit('join-crm', userId);

// Ouvir eventos
socket.on('new-lead', (data) => {
    console.log('Novo lead:', data.leadId);
    // Atualizar interface
});

socket.on('lead-moved', (data) => {
    console.log('Lead movido:', data);
});

socket.on('bot-toggled', (data) => {
    console.log('Bot alterado:', data);
});

socket.on('hot-lead', (data) => {
    console.log('Lead quente!', data);
});

socket.on('sla-breach', (data) => {
    console.log('SLA violado!', data);
});
```

### Servidor (Backend)

```javascript
const crmService = require('./services/crm.service');

// Emitir evento personalizado
crmService.emitCRMEvent(userId, 'custom-event', { data: 'valor' });
```

---

## 🎨 PERSONALIZAÇÃO

### Adicionar Novo Estágio

```sql
INSERT INTO crm_stages (user_id, name, position, color, bot_enabled, conversion_probability)
VALUES (1, 'Follow-up 30 dias', 8, '#F472B6', FALSE, 20.00);
```

### Adicionar Tag Personalizada

```sql
INSERT INTO crm_tags (user_id, name, color)
VALUES (1, 'Urgente', '#EF4444');
```

### Configurar Webhook de Pagamento

```javascript
// Kiwify/Hotmart envia notificação para:
POST /api/crm/webhook/payment

// Sistema processa e move lead automaticamente para "Venda Confirmada"
```

---

## 🛠️ TROUBLESHOOTING

### Problema: Leads não aparecem no Kanban

**Solução:**
1. Verificar se estágios foram criados:
```sql
SELECT * FROM crm_stages WHERE user_id = 1;
```
2. Se vazio, criar estágios padrão:
```
POST /api/crm/stages/init
```

### Problema: Bot não pausa automaticamente

**Verificar:**
1. `whatsapp.service.js` possui integração CRM (linha ~168)
2. Teste movendo lead manualmente via Kanban
3. Verifique logs do servidor: `⏸️ Bot pausado`

### Problema: Socket.IO não conecta

**Solução:**
1. Verificar se servidor usa `server.listen()` (não `app.listen()`)
2. Verificar se Socket.IO script está carregado:
```html
<script src="/socket.io/socket.io.js"></script>
```

---

## 📝 FEATURES FUTURAS (Roadmap)

### Próximas Implementações:

1. **✅ Recuperação Automática (Remarketing)**
   - Bot reenvia mensagem automática após 48h sem resposta
   - Exemplo: "Dr(a), vi que não concluiu. Foi alguma dúvida no pagamento?"

2. **✅ Biblioteca de Áudios Rápidos**
   - Vendedor grava áudio genérico uma vez
   - Sistema envia "como se fosse gravado na hora"
   - Economiza tempo em mensagens repetitivas

3. **✅ Agendamento de Follow-up**
   - Vendedor agenda retorno: "Lembrar dia 10/12 às 09h"
   - Card fica translúcido e reaparece na data/hora marcada
   - Notificação automática

4. **✅ Edição em Massa (Bulk Actions)**
   - Selecionar múltiplos leads
   - Mudar vendedor de todos de uma vez
   - Enviar broadcast para grupo selecionado

5. **✅ Histórico de Edições (Audit Log)**
   - Saber quem moveu o card
   - Prevenir "roubo" de leads entre vendedores
   - Rastreabilidade completa

6. **✅ Webhook de Pagamento (Kiwify/Hotmart)**
   - Pagamento aprovado → Lead move automaticamente
   - Atualiza comissão do vendedor em tempo real
   - Sem atualização manual

---

## 📞 SUPORTE

**Desenvolvedor:** GitHub Copilot + Leandro (Admin)  
**Versão:** 1.0.0  
**Data:** Dezembro 2025  

**Tecnologias:**
- Node.js + Express
- MySQL (MariaDB)
- Socket.IO (WebSocket)
- Vanilla JavaScript (Frontend)
- @wppconnect-team/wppconnect

---

## 🎯 EXEMPLO DE FLUXO COMPLETO

1. **Lead entra via WhatsApp:** "Olá, quero saber sobre o curso"
2. **Bot coleta dados:** Nome, RQE, Especialidade → **Cria lead no CRM**
3. **Lead fica em "Triagem"** com score inicial de 35
4. **Bot envia apresentação do curso** → Score sobe para 55
5. **Lead pede preço** → Bot envia link → **Move para "Link Enviado"** → Bot PAUSA
6. **Vendedor recebe notificação** com dados completos
7. **Vendedor envia mensagem manual** → Card fica vermelho (bot pausado)
8. **Vendedor negocia parcelamento** → Move para "Em Negociação"
9. **Cliente envia comprovante PIX** → Move para "Aguardando Pagamento"
10. **Webhook confirma pagamento** → Move para "Venda Confirmada" ✅
11. **Dashboard atualiza:** Faturamento +R$ 2.197,00 | Vendedor ganha comissão

---

**✨ Sistema pronto para uso! Boa sorte nas vendas! 🚀**
