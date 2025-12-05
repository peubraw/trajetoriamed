# Milestones - CRM Conversacional (Conversational Commerce)

> **Projeto:** Sistema CRM híbrido Bot + Humano para Vendas Conversacionais  
> **Data de Criação:** 05/12/2025  
> **Status:** Planejamento

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Milestones Principais](#milestones-principais)
3. [Cronograma Sugerido](#cronograma-sugerido)
4. [Dependências Técnicas](#dependências-técnicas)
5. [Critérios de Aceitação](#critérios-de-aceitação)

---

## 🎯 Visão Geral

Este documento define os milestones para transformar o CRM atual em um sistema completo de **Vendas Conversacionais**, integrando automação inteligente (Bot) com gestão visual (Kanban) e analytics avançados.

### Objetivos Principais
- ✅ Fluxo híbrido Bot + Vendedor com transição fluida
- ✅ Kanban em tempo real com informações contextuais
- ✅ Dashboards gerenciais e estratégicos
- ✅ Automações inteligentes de recuperação e scoring
- ✅ Gamificação e gestão de equipe

---

## 🚀 Milestones Principais

### **MILESTONE 1: Fundação do Sistema Híbrido**
**Prazo Estimado:** 2-3 semanas  
**Prioridade:** 🔴 CRÍTICA

#### Objetivos
Implementar a base do sistema híbrido Bot + Humano com controle de estados.

#### Tasks

##### 1.1 Estrutura de Dados
- [ ] **1.1.1** Adicionar campo `bot_status` na tabela `leads`
  - Valores: `ACTIVE`, `PAUSED`, `INTERVENTION_NEEDED`
  - Incluir `bot_paused_by` (user_id ou 'auto')
  - Incluir `bot_paused_at` (timestamp)

- [ ] **1.1.2** Adicionar campo `lead_owner_id` (vendedor responsável)
  - Relação com tabela de usuários/vendedores
  - Permitir NULL (leads sem dono)

- [ ] **1.1.3** Adicionar campo `distribution_mode`
  - Valores: `ROUND_ROBIN`, `SHARK_TANK`, `MANUAL`
  - Configuração por workspace/time

##### 1.2 Lógica de Controle do Bot
- [ ] **1.2.1** Implementar serviço `bot-control.service.js`
  - Método `pauseBot(leadId, reason, userId)`
  - Método `resumeBot(leadId, userId)`
  - Método `checkBotStatus(leadId)`

- [ ] **1.2.2** Implementar gatilhos de pausa automática
  - Pausar quando vendedor digitar mensagem
  - Pausar quando lead for movido para etapa "Humano"
  - Pausar ao clicar em botão "Pausar Bot"

- [ ] **1.2.3** Implementar gatilhos de retomada automática
  - Retomar ao mover para etapas de automação
  - Retomar ao clicar em "Reativar Bot"

##### 1.3 Sistema de Distribuição de Leads
- [ ] **1.3.1** Implementar **Modo Roleta (Round Robin)**
  - Fila sequencial de vendedores ativos
  - Distribuição equitativa automática
  - Logs de distribuição

- [ ] **1.3.2** Implementar **Modo Shark Tank**
  - Notificação em grupo de vendedores
  - Interface "Pegar Atendimento"
  - Lock de lead ao primeiro clique
  - Timeout de 2 minutos para captura

- [ ] **1.3.3** Criar painel de configuração de distribuição
  - Toggle entre modos
  - Definir vendedores participantes
  - Configurar horários de operação

#### Entregáveis
- ✅ API endpoints para controle de bot
- ✅ Tabelas atualizadas com migrations
- ✅ Sistema de distribuição funcional
- ✅ Documentação técnica

---

### **MILESTONE 2: Kanban Inteligente**
**Prazo Estimado:** 3-4 semanas  
**Prioridade:** 🔴 CRÍTICA

#### Objetivos
Reconstruir o Kanban com cards ricos em informações e interface em tempo real.

#### Tasks

##### 2.1 Estrutura de Etapas (Pipeline)
- [ ] **2.1.1** Criar sistema de etapas customizáveis
  - Tabela `stages` com ordem, nome, cor
  - Campo `automation_enabled` (bool)
  - Campo `probability_percentage` (0-100)

- [ ] **2.1.2** Implementar etapas padrão
  - Novos/Triagem (Bot Ativo - 10%)
  - Nutrição/Apresentação (Bot Ativo - 30%)
  - Quente/Link Enviado (Transbordo - 80%)
  - Em Negociação (Humano - 60%)
  - Aguardando Pagamento (90%)
  - Venda Confirmada (100%)
  - Perdido/Arquivado (0%)

- [ ] **2.1.3** CRUD de etapas personalizado
  - Criar, editar, reordenar etapas
  - Definir regras de automação por etapa

##### 2.2 Anatomia do Card
- [ ] **2.2.1** Implementar layout visual do card
  ```
  ┌─────────────────────────────────┐
  │ 👤 João Silva      📱 WhatsApp  │
  │ 🟢 Bot Ativo       🔥🔥🔥        │
  │ 👨‍💼 Ana (Vendedora)              │
  │ 💰 R$ 2.197,00                  │
  │ ⏱️ Visualizou proposta (10min)  │
  │ ⚠️ Há 2h sem resposta           │
  └─────────────────────────────────┘
  ```

- [ ] **2.2.2** Implementar **Termômetro de Engajamento**
  - 🔥🔥🔥 (Quente) - Respondeu nas últimas 2h
  - 🔥🔥 (Morno) - Respondeu entre 2-8h
  - 🔥 (Frio) - Respondeu entre 8-24h
  - ❄️ (Congelado) - Mais de 24h sem resposta

- [ ] **2.2.3** Implementar badges de status
  - 🟢 Bot Ativo
  - 🔴 Bot Pausado
  - 🟡 Intervenção Necessária
  - ⚠️ Alerta de tempo

- [ ] **2.2.4** Implementar **Lead Scoring Visual** (Milestone 6)
  - Borda dourada (Hot Lead)
  - Borda prata (Warm Lead)
  - Sem borda (Cold Lead)

##### 2.3 Funcionalidades do Kanban
- [ ] **2.3.1** Drag & Drop entre colunas
  - Atualizar stage automaticamente
  - Aplicar regras de automação
  - Registrar no histórico

- [ ] **2.3.2** Filtros e buscas
  - Filtrar por vendedor
  - Filtrar por status do bot
  - Filtrar por temperatura
  - Buscar por nome/telefone

- [ ] **2.3.3** Modal de detalhes do lead
  - Histórico completo de conversas
  - Timeline de eventos
  - Formulário de edição rápida
  - Controles de bot

##### 2.4 WebSocket / Tempo Real
- [ ] **2.4.1** Implementar Socket.IO
  - Atualização de cards em tempo real
  - Notificações de novos leads
  - Indicador "Usuário digitando..."

- [ ] **2.4.2** Sistema de notificações in-app
  - Toast para novos leads (Shark Tank)
  - Alert de leads parados
  - Notificação de venda confirmada

#### Entregáveis
- ✅ Kanban funcional com drag & drop
- ✅ Cards com todas as informações visuais
- ✅ Sistema de tempo real
- ✅ Interface responsiva

---

### **MILESTONE 3: Dashboard Gerencial**
**Prazo Estimado:** 2 semanas  
**Prioridade:** 🟡 ALTA

#### Objetivos
Criar dashboards com métricas estratégicas e financeiras.

#### Tasks

##### 3.1 Painel Financeiro (Forecast)
- [ ] **3.1.1** Card "Faturamento Realizado"
  - Soma de vendas confirmadas (mês atual)
  - Comparativo com mês anterior (%)
  - Gráfico de linha (últimos 12 meses)

- [ ] **3.1.2** Card "Pipeline Ponderado"
  - Fórmula: `SUM(valor_lead × probability_stage)`
  - Breakdown por etapa
  - Previsão de fechamento

- [ ] **3.1.3** Card "Aguardando Pagamento"
  - Total em boletos gerados
  - Total em checkouts iniciados
  - Prazo de vencimento

- [ ] **3.1.4** Card "Dinheiro na Mesa"
  - Total de leads perdidos (valor acumulado)
  - Breakdown por motivo de perda

##### 3.2 Análise de Perdas
- [ ] **3.2.1** Gráfico de pizza - Motivos de perda
  - Integrar com campo `loss_reason`
  - Motivos padrão: Preço, Concorrência, Sem Limite, Desistiu, Sem RQE, Outros

- [ ] **3.2.2** Nuvem de palavras (Objeções)
  - Parser de mensagens de leads perdidos
  - Identificar palavras-chave (caro, limite, janeiro, etc)
  - Visualização com tamanho proporcional à frequência

##### 3.3 Ranking de Vendedores (Gamification)
- [ ] **3.3.1** Ranking "Vendedor Alpha"
  - Maior faturamento (R$)
  - Troféu e posição no pódio

- [ ] **3.3.2** Ranking "Sniper"
  - Melhor taxa de conversão
  - Fórmula: `vendas / leads_atendidos × 100`

- [ ] **3.3.3** Painel de Comissões
  - "A Receber" (vendas no prazo de garantia)
  - "Liberado" (disponível para saque)
  - Histórico de pagamentos

##### 3.4 Métricas Operacionais
- [ ] **3.4.1** Tempo médio de resposta (SLA)
- [ ] **3.4.2** Taxa de conversão por etapa
- [ ] **3.4.3** Ciclo médio de venda
- [ ] **3.4.4** Volume de leads por canal

#### Entregáveis
- ✅ Dashboard financeiro completo
- ✅ Painel de perdas e objeções
- ✅ Sistema de gamificação
- ✅ Relatórios exportáveis

---

### **MILESTONE 4: Exportação e Importação de Dados**
**Prazo Estimado:** 1 semana  
**Prioridade:** 🟢 MÉDIA

#### Objetivos
Sistema robusto de exportação/importação compatível com Excel.

#### Tasks

##### 4.1 Exportação
- [ ] **4.1.1** Endpoint de exportação
  - Formato CSV e XLSX
  - Filtros aplicados no Kanban
  - Layout padronizado conforme especificação

- [ ] **4.1.2** Estrutura de colunas
  ```
  ID | Ex-aluno | Nome | Estado | Email | Telefone | Interesse | 
  Curso | Canal | Data Entrada | Hora Entrada | Ultima Situação | 
  Última Mensagem | Vendedor | Observação | Motivo Perda | Valor
  ```

- [ ] **4.1.3** Agendamento de exportações
  - Exportação automática semanal/mensal
  - Envio por email

##### 4.2 Importação
- [ ] **4.2.1** Interface de upload
  - Validação de formato
  - Preview antes de importar

- [ ] **4.2.2** Mapeamento de colunas
  - Associar colunas do arquivo com campos do sistema
  - Detectar duplicados

- [ ] **4.2.3** Processamento em background
  - Queue para arquivos grandes
  - Relatório de erros e sucessos

#### Entregáveis
- ✅ Sistema de exportação funcional
- ✅ Sistema de importação com validação
- ✅ Template de exemplo

---

### **MILESTONE 5: Integração com Gateway de Pagamento**
**Prazo Estimado:** 2 semanas  
**Prioridade:** 🔴 CRÍTICA

#### Objetivos
Automação completa do ciclo de venda com webhooks de pagamento.

#### Tasks

##### 5.1 Webhooks de Pagamento
- [ ] **5.1.1** Integrar com Kiwify
  - Receber webhook de pagamento aprovado
  - Receber webhook de pagamento recusado
  - Receber webhook de chargeback

- [ ] **5.1.2** Integrar com Hotmart
  - Webhook de compra aprovada
  - Webhook de cancelamento
  - Webhook de reembolso

- [ ] **5.1.3** Outras plataformas (Opcional)
  - Eduzz
  - Monetizze
  - Stripe

##### 5.2 Automações de Pagamento
- [ ] **5.2.1** Movimentação automática de cards
  - Pagamento aprovado → "Venda Confirmada"
  - Pagamento recusado → "Aguardando Pagamento" (com alerta)
  - Chargeback → "Perdido" (motivo: Estorno)

- [ ] **5.2.2** Cálculo automático de comissões
  - Gerar registro de comissão ao confirmar venda
  - Status: Pendente → A Receber → Liberado
  - Integrar com prazo de garantia (ex: 7 dias)

- [ ] **5.2.3** Notificações de vendedor
  - Push notification de venda confirmada
  - Email com resumo da comissão
  - Toast in-app

##### 5.3 Rastreamento de Checkout
- [ ] **5.3.1** Capturar link de checkout
  - Detectar quando bot envia link de pagamento
  - Armazenar URL e ID do checkout

- [ ] **5.3.2** Status de checkout
  - Checkout iniciado (visitou página)
  - Checkout abandonado (não concluiu)
  - Timeout de abandono configurável

#### Entregáveis
- ✅ Webhooks implementados e testados
- ✅ Automação de movimentação de cards
- ✅ Sistema de comissões automático
- ✅ Documentação de integração

---

### **MILESTONE 6: Lead Scoring com IA**
**Prazo Estimado:** 2-3 semanas  
**Prioridade:** 🟡 ALTA

#### Objetivos
Sistema inteligente de pontuação e priorização de leads.

#### Tasks

##### 6.1 Análise de Sentimento
- [ ] **6.1.1** Integrar com OpenAI/OpenRouter
  - Analisar mensagens do lead
  - Detectar intenção de compra
  - Identificar objeções

- [ ] **6.1.2** Sistema de pontuação
  - **HOT (80-100 pontos):** Borda dourada
    - Frases: "Como pago?", "Quero comprar", "Pode parcelar?"
  - **WARM (50-79 pontos):** Borda prata
    - Frases: "Interessante", "Vou pensar", "Qual o preço?"
  - **COLD (0-49 pontos):** Sem borda
    - Frases: "Só olhando", "Depois eu vejo", "Caro"

##### 6.2 Fatores de Scoring
- [ ] **6.2.1** Implementar variáveis de pontuação
  - Recência de resposta (+10 se < 1h)
  - Volume de mensagens (+5 a cada 3 mensagens)
  - Menção de dinheiro/pagamento (+20)
  - Visualização de proposta (+15)
  - Perguntas sobre curso (+10 cada)
  - Ex-aluno (+30 pontos)

- [ ] **6.2.2** Recalcular score automaticamente
  - A cada nova mensagem
  - A cada mudança de etapa
  - Atualização visual em tempo real

##### 6.3 Priorização Inteligente
- [ ] **6.3.1** Ordenação automática no Kanban
  - Leads HOT no topo
  - Opção de ordenar por score
  - Filtro "Apenas Hot Leads"

- [ ] **6.3.2** Alertas de oportunidade
  - Notificar vendedor quando lead virar HOT
  - Destacar leads HOT não atendidos

#### Entregáveis
- ✅ Sistema de scoring funcional
- ✅ Visualização de pontuação nos cards
- ✅ Priorização automática
- ✅ Dashboard de performance do score

---

### **MILESTONE 7: Recuperação Automática (Remarketing)**
**Prazo Estimado:** 1-2 semanas  
**Prioridade:** 🟡 ALTA

#### Objetivos
Sistema de reengajamento automático para leads inativos.

#### Tasks

##### 7.1 Gatilhos de Recuperação
- [ ] **7.1.1** Identificar leads "esfriando"
  - Lead em "Link Enviado" há 48h sem resposta
  - Lead em "Nutrição" há 72h sem resposta
  - Lead em "Negociação" há 24h sem resposta

- [ ] **7.1.2** Sistema de automação condicional
  - Verificar se bot está pausado
  - Solicitar autorização para reativar
  - Configurar templates de mensagens

##### 7.2 Templates de Remarketing
- [ ] **7.2.1** Criar biblioteca de mensagens
  - "Dr(a), vi que não concluiu. Foi alguma dúvida no pagamento?"
  - "Olá! Ficou alguma dúvida sobre o curso?"
  - "Oi! Preparei uma condição especial para você..."

- [ ] **7.2.2** A/B Testing de mensagens
  - Testar diferentes abordagens
  - Medir taxa de resposta
  - Otimizar mensagens automaticamente

##### 7.3 Regras e Limites
- [ ] **7.3.1** Configurar limites de tentativas
  - Máximo 3 tentativas de recuperação
  - Intervalo mínimo entre tentativas (24h)
  - Mover para "Perdido" após 3 falhas

- [ ] **7.3.2** Horários permitidos
  - Não enviar fora do horário comercial
  - Não enviar fins de semana (opcional)
  - Respeitar fusos horários

#### Entregáveis
- ✅ Sistema de recuperação automática
- ✅ Biblioteca de templates
- ✅ Dashboard de performance de remarketing

---

### **MILESTONE 8: Biblioteca de Áudios e Respostas Rápidas**
**Prazo Estimado:** 1 semana  
**Prioridade:** 🟢 MÉDIA

#### Objetivos
Ferramentas para acelerar o atendimento humano mantendo personalização.

#### Tasks

##### 8.1 Respostas Rápidas
- [ ] **8.1.1** Sistema de snippets
  - Atalhos de texto (ex: `/preco` → envia tabela de preços)
  - Variáveis dinâmicas (`{nome}`, `{curso}`, `{valor}`)
  - Compartilhamento entre equipe

- [ ] **8.1.2** Interface de gerenciamento
  - CRUD de snippets
  - Categorização (Saudação, Objeção, Fechamento)
  - Contador de uso

##### 8.2 Áudios Pré-gravados
- [ ] **8.2.1** Gravação e armazenamento
  - Interface de gravação no navegador
  - Upload de áudios existentes
  - Conversão automática para formato WhatsApp

- [ ] **8.2.2** Envio "humanizado"
  - Simular delay de gravação
  - Mostrar "gravando áudio..." no WhatsApp
  - Variação aleatória de tempo (8-15s)

- [ ] **8.2.3** Biblioteca de áudios
  - Categorizar por situação
  - Preview antes de enviar
  - Editar/excluir áudios

#### Entregáveis
- ✅ Sistema de respostas rápidas
- ✅ Sistema de áudios pré-gravados
- ✅ Interface de gerenciamento

---

### **MILESTONE 9: Controle de SLA e Alertas**
**Prazo Estimado:** 1 semana  
**Prioridade:** 🟡 ALTA

#### Objetivos
Garantir qualidade no tempo de resposta e evitar perda de leads.

#### Tasks

##### 9.1 Definição de SLA
- [ ] **9.1.1** Configuração de tempos-limite
  - SLA por etapa (ex: "Link Enviado" = 15 min)
  - SLA por horário (comercial vs. fora do expediente)
  - SLA por prioridade do lead (HOT = 5 min)

##### 9.2 Cronômetro Visual
- [ ] **9.2.1** Implementar timer no card
  - Contagem regressiva após última mensagem do lead
  - Mudar de cor conforme proximidade do limite
    - Verde: > 50% do tempo
    - Amarelo: 25-50% do tempo
    - Vermelho: < 25% do tempo

##### 9.3 Sistema de Escalação
- [ ] **9.3.1** Regras de escalação automática
  - Se vendedor não responder em X minutos → Notificar gestor
  - Se vendedor não responder em Y minutos → Devolver para pool (Shark Tank)
  - Registrar no histórico

- [ ] **9.3.2** Notificações escalonadas
  - 1ª notificação: Toast no sistema
  - 2ª notificação: Email/SMS para vendedor
  - 3ª notificação: Gestor assume ou redistribui

##### 9.4 Métricas de SLA
- [ ] **9.4.1** Dashboard de performance
  - % de SLA cumprido por vendedor
  - Tempo médio de primeira resposta
  - Tempo médio de resolução

#### Entregáveis
- ✅ Sistema de SLA configurável
- ✅ Cronômetros visuais nos cards
- ✅ Sistema de escalação automática
- ✅ Dashboard de métricas de SLA

---

### **MILESTONE 10: Agendamento de Follow-up**
**Prazo Estimado:** 1 semana  
**Prioridade:** 🟢 MÉDIA

#### Objetivos
Permitir que vendedores organizem retornos futuros sem perder leads.

#### Tasks

##### 10.1 Interface de Agendamento
- [ ] **10.1.1** Modal de agendamento no card
  - Seletor de data e hora
  - Campo de observação/motivo
  - Opção de pausar bot até o retorno

- [ ] **10.1.2** Visualização de agendamentos
  - Calendário de follow-ups
  - Lista de tarefas do dia
  - Filtro por vendedor

##### 10.2 Comportamento do Card
- [ ] **10.2.1** Card "snooze"
  - Ficar translúcido no Kanban
  - Exibir ícone de relógio e data de retorno
  - Opção de ocultar completamente

- [ ] **10.2.2** Reativação automática
  - Na data/hora agendada, card volta ao normal
  - Notificação push para vendedor
  - Retomar bot (se configurado)

##### 10.3 Lembretes
- [ ] **10.3.1** Sistema de notificações
  - 15 minutos antes do horário agendado
  - Notificação in-app + email
  - Opção de adiar (+30 min, +1h, +1 dia)

#### Entregáveis
- ✅ Sistema de agendamento funcional
- ✅ Calendário de follow-ups
- ✅ Notificações automáticas

---

### **MILESTONE 11: Ações em Massa (Bulk Actions)**
**Prazo Estimado:** 1 semana  
**Prioridade:** 🟢 MÉDIA

#### Objetivos
Operações em lote para aumentar produtividade da equipe.

#### Tasks

##### 11.1 Seleção Múltipla
- [ ] **11.1.1** Interface de seleção
  - Checkbox nos cards
  - "Selecionar todos" por coluna
  - Contador de selecionados

##### 11.2 Ações Disponíveis
- [ ] **11.2.1** Mover em massa
  - Mover X leads para outra etapa
  - Aplicar regras de automação em lote

- [ ] **11.2.2** Atribuir vendedor
  - Mudar responsável de múltiplos leads
  - Notificar novo vendedor

- [ ] **11.2.3** Enviar mensagem broadcast
  - Template com variáveis
  - Fila de envio (evitar bloqueio WhatsApp)
  - Respeitar intervalos entre mensagens

- [ ] **11.2.4** Pausar/Retomar bot
  - Pausar bot em múltiplos leads
  - Retomar automação em lote

- [ ] **11.2.5** Adicionar tags
  - Aplicar tags/labels em massa
  - Filtrar por tags

##### 11.3 Segurança
- [ ] **11.3.1** Confirmação de ações críticas
  - Modal de confirmação para ações irreversíveis
  - Preview das ações antes de executar
  - Registrar no log de auditoria

#### Entregáveis
- ✅ Sistema de seleção múltipla
- ✅ Ações em massa implementadas
- ✅ Interface de confirmação

---

### **MILESTONE 12: Log de Auditoria e Histórico**
**Prazo Estimado:** 1 semana  
**Prioridade:** 🔴 CRÍTICA

#### Objetivos
Rastreabilidade completa de ações e prevenção de conflitos.

#### Tasks

##### 12.1 Estrutura de Log
- [ ] **12.1.1** Tabela de auditoria
  - Campos: `id`, `lead_id`, `user_id`, `action`, `old_value`, `new_value`, `timestamp`, `ip_address`
  - Indexação por lead_id e user_id

- [ ] **12.1.2** Ações rastreadas
  - Mudança de etapa
  - Mudança de vendedor responsável
  - Pausa/retomada de bot
  - Edição de dados do lead
  - Envio de mensagens manuais
  - Ações em massa

##### 12.2 Interface de Visualização
- [ ] **12.2.1** Timeline no modal do lead
  - Histórico cronológico de eventos
  - Filtro por tipo de ação
  - Visualização de quem fez o quê

- [ ] **12.2.2** Painel de auditoria (Admin)
  - Busca avançada de logs
  - Exportação de relatórios
  - Filtro por usuário, período, tipo de ação

##### 12.3 Prevenção de Conflitos
- [ ] **12.3.1** Lock de edição simultânea
  - Detectar quando 2 usuários editam mesmo lead
  - Exibir aviso de conflito
  - Opção de forçar ou cancelar edição

- [ ] **12.3.2** Regras de permissão
  - Vendedor só pode editar seus próprios leads
  - Gestores podem editar todos
  - Bloqueio de roubo de leads

#### Entregáveis
- ✅ Sistema de auditoria completo
- ✅ Timeline de histórico
- ✅ Painel de logs administrativo
- ✅ Sistema de prevenção de conflitos

---

### **MILESTONE 13: Testes e Qualidade**
**Prazo Estimado:** 2 semanas  
**Prioridade:** 🔴 CRÍTICA

#### Objetivos
Garantir estabilidade, performance e confiabilidade do sistema.

#### Tasks

##### 13.1 Testes Automatizados
- [ ] **13.1.1** Testes unitários
  - Serviços críticos (bot-control, scoring, crm)
  - Cobertura mínima de 70%

- [ ] **13.1.2** Testes de integração
  - Fluxos completos de venda
  - Integrações com gateways
  - Webhooks

- [ ] **13.1.3** Testes E2E
  - Fluxo completo no Kanban
  - Criação e movimentação de leads
  - Automações

##### 13.2 Performance
- [ ] **13.2.1** Otimização de queries
  - Identificar queries lentas
  - Adicionar índices necessários
  - Implementar cache (Redis)

- [ ] **13.2.2** Load testing
  - Simular 100+ usuários simultâneos
  - Testar com 10.000+ leads no Kanban
  - Medir tempo de resposta

##### 13.3 Segurança
- [ ] **13.3.1** Auditoria de segurança
  - Validação de inputs
  - Proteção contra SQL injection
  - Rate limiting em APIs

- [ ] **13.3.2** Controle de acesso
  - Revisão de permissões
  - Testes de autorização
  - Logs de tentativas de acesso

#### Entregáveis
- ✅ Suite de testes automatizados
- ✅ Relatório de performance
- ✅ Auditoria de segurança aprovada

---

### **MILESTONE 14: Documentação e Treinamento**
**Prazo Estimado:** 1 semana  
**Prioridade:** 🟡 ALTA

#### Objetivos
Garantir adoção e uso correto do sistema pela equipe.

#### Tasks

##### 14.1 Documentação Técnica
- [ ] **14.1.1** Atualizar docs/API_DOCS.md
- [ ] **14.1.2** Documentar arquitetura do sistema híbrido
- [ ] **14.1.3** Guia de troubleshooting

##### 14.2 Documentação de Usuário
- [ ] **14.2.1** Manual do vendedor
  - Como usar o Kanban
  - Como pausar/retomar bot
  - Como usar respostas rápidas

- [ ] **14.2.2** Manual do gestor
  - Como configurar distribuição
  - Como analisar dashboards
  - Como gerenciar equipe

- [ ] **14.2.3** Vídeos tutoriais
  - Walkthrough do sistema
  - Casos de uso práticos

##### 14.3 Treinamento
- [ ] **14.3.1** Sessões de onboarding
  - Treinamento inicial da equipe
  - Hands-on com ambiente de teste

- [ ] **14.3.2** Base de conhecimento
  - FAQ expandido
  - Troubleshooting comum
  - Best practices

#### Entregáveis
- ✅ Documentação completa atualizada
- ✅ Vídeos tutoriais
- ✅ Equipe treinada

---

## 📅 Cronograma Sugerido

### Fase 1: Fundação (4-5 semanas)
- ✅ Milestone 1: Sistema Híbrido
- ✅ Milestone 2: Kanban Inteligente

### Fase 2: Inteligência (4-5 semanas)
- ✅ Milestone 3: Dashboard Gerencial
- ✅ Milestone 5: Gateway de Pagamento
- ✅ Milestone 6: Lead Scoring

### Fase 3: Automação (3-4 semanas)
- ✅ Milestone 7: Recuperação Automática
- ✅ Milestone 9: Controle de SLA
- ✅ Milestone 10: Agendamento

### Fase 4: Produtividade (3 semanas)
- ✅ Milestone 4: Exportação de Dados
- ✅ Milestone 8: Biblioteca de Áudios
- ✅ Milestone 11: Ações em Massa

### Fase 5: Governança (3 semanas)
- ✅ Milestone 12: Log de Auditoria
- ✅ Milestone 13: Testes e Qualidade
- ✅ Milestone 14: Documentação

**Prazo Total Estimado:** 17-20 semanas (~4-5 meses)

---

## 🔧 Dependências Técnicas

### Backend
- Node.js + Express (existente)
- Socket.IO (tempo real)
- Redis (cache e filas)
- MySQL (existente)
- OpenAI API / OpenRouter (scoring)

### Frontend
- React/Vue (recomendado para Kanban)
- Socket.IO Client
- Chart.js / Recharts (dashboards)
- DnD Kit (drag and drop)

### Infraestrutura
- Queue system (Bull/BullMQ)
- Cron jobs (node-cron)
- File storage (AWS S3 / local)

### Integrações
- WhatsApp Business API (existente)
- Kiwify API
- Hotmart API
- Gateway de pagamento (Stripe/outros)

---

## ✅ Critérios de Aceitação

### Por Milestone

#### Milestone 1-2 (Fundação)
- [ ] Vendedor consegue pausar/retomar bot manualmente
- [ ] Bot pausa automaticamente ao vendedor digitar
- [ ] Distribuição Round Robin funciona corretamente
- [ ] Modo Shark Tank permite captura de leads
- [ ] Kanban exibe todas as informações do card
- [ ] Drag & drop atualiza etapa corretamente
- [ ] WebSocket atualiza cards em tempo real

#### Milestone 3 (Dashboard)
- [ ] Forecast financeiro calcula valores corretamente
- [ ] Gráficos de perdas exibem dados reais
- [ ] Ranking de vendedores atualiza diariamente
- [ ] Comissões calculam automaticamente

#### Milestone 5 (Pagamento)
- [ ] Webhook de pagamento move card automaticamente
- [ ] Comissão é gerada ao confirmar venda
- [ ] Vendedor recebe notificação de venda

#### Milestone 6 (Scoring)
- [ ] Score é calculado em tempo real
- [ ] Cards HOT têm borda dourada
- [ ] Priorização automática funciona

#### Milestone 7 (Recuperação)
- [ ] Leads inativos recebem mensagem automática
- [ ] Máximo de 3 tentativas é respeitado
- [ ] Não envia fora do horário comercial

#### Milestone 9 (SLA)
- [ ] Cronômetro visual funciona corretamente
- [ ] Escalação automática dispara após timeout
- [ ] Gestor é notificado de violações de SLA

#### Milestone 12 (Auditoria)
- [ ] Todas as ações são registradas no log
- [ ] Timeline exibe histórico completo
- [ ] Sistema impede roubo de leads

---

## 📊 Indicadores de Sucesso

### KPIs do Sistema
- **Taxa de conversão:** Aumento de 30% nos primeiros 3 meses
- **Tempo de resposta:** Redução de 40% no tempo médio
- **Recuperação de leads:** 15% dos leads "frios" voltam a engajar
- **Produtividade do vendedor:** 50% mais atendimentos simultâneos
- **Perda por timeout:** Redução de 60% em leads perdidos por falta de resposta

### Métricas de Adoção
- **Uso do Kanban:** 100% dos vendedores ativos diariamente
- **Uso de respostas rápidas:** 80% dos vendedores usam snippets
- **Agendamentos:** Média de 5+ follow-ups por vendedor/dia
- **Satisfação da equipe:** NPS > 8.0

---

## 🚨 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Integração WhatsApp instável | Alta | Alto | Implementar retry logic e fallback |
| Performance com 10k+ leads | Média | Alto | Paginação, lazy loading, cache |
| Conflito de edição simultânea | Média | Médio | Sistema de lock e alertas |
| Webhook de pagamento falhar | Baixa | Crítico | Retry automático + alertas |
| Resistência da equipe | Média | Alto | Treinamento intensivo + suporte |

---

## 📝 Notas Finais

Este documento é um **guia vivo** e deve ser atualizado conforme o projeto evolui. Prioridades podem mudar baseado em feedback dos usuários e necessidades do negócio.

### Próximos Passos
1. ✅ Validar milestones com stakeholders
2. ✅ Definir equipe e responsáveis
3. ✅ Criar primeiro sprint (Milestone 1)
4. ✅ Configurar ambiente de desenvolvimento
5. ✅ Iniciar implementação

---

**Documento criado em:** 05/12/2025  
**Última atualização:** 05/12/2025  
**Versão:** 1.0  
**Responsável:** Equipe de Desenvolvimento
