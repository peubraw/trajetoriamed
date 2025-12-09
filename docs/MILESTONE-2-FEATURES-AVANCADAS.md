# 🚀 MILESTONE 2 - Features Avançadas e Automação Completa

**Data de Criação**: 9 de Dezembro de 2025  
**Status Geral**: 🟡 Em Planejamento

---

## 📊 Resumo Executivo

Esta milestone foca em expandir o sistema com recursos avançados de automação, análise de dados, gestão de vendedores e integração completa com meios de pagamento e Meta API.

**Progresso Geral**: 15/31 features (48%)

---

## ✅ FASE 1: CRM e Gestão de Vendedores (60% Completo)

### 1.1 Links do Instagram ✅
- **Status**: ✅ Implementado - Testar com todos os cursos
- **Descrição**: Sistema de links personalizados do Instagram por curso
- **Prioridade**: Alta
- **Arquivos**: `routes/webhook.routes.js`, `services/chatbot-flow.service.js`

### 1.2 CRM com Kanban ✅
- **Status**: ✅ Implementado
- **Descrição**: Sistema completo de pipeline visual com drag & drop
- **Features**:
  - 7 estágios configuráveis
  - Drag & drop de leads entre estágios
  - Filtros por vendedor, temperatura, busca
  - Histórico de atividades
  - Pausar/retomar bot automaticamente
- **Arquivos**: `public/crm-kanban.html`, `services/crm.service.js`

### 1.3 Acesso por Vendedor ao CRM ⏳
- **Status**: 🟡 Em Desenvolvimento
- **Descrição**: Sistema de permissões e visualização por vendedor
- **Tarefas**:
  - [ ] Criar tabela `vendors` (vendedores)
  - [ ] Sistema de login específico para vendedores
  - [ ] Filtrar leads apenas do vendedor logado
  - [ ] Dashboard individual por vendedor
  - [ ] Metas e comissões por vendedor
- **Prioridade**: Alta

### 1.4 Chat Integrado na Plataforma ⏳
- **Status**: 🟡 Planejado
- **Descrição**: Chat em tempo real dentro do CRM
- **Tarefas**:
  - [ ] Interface de chat no modal do lead
  - [ ] Histórico completo de mensagens
  - [ ] Envio de mensagens direto da plataforma
  - [ ] Notificações em tempo real (Socket.IO)
  - [ ] Indicador de "digitando..."
  - [ ] Suporte a mídia (imagens, PDFs)
- **Prioridade**: Alta

### 1.5 Somente Admin Designa Vendedor ✅
- **Status**: ✅ Implementado
- **Descrição**: Controle de atribuição de leads
- **Features**:
  - Admin atribui leads manualmente
  - Distribuição automática opcional
  - Reatribuição de leads
- **Arquivos**: `services/lead-distribution.service.js`

### 1.6 Exportar Leads para Excel ✅
- **Status**: ✅ Implementado
- **Descrição**: Exportação CSV com dados completos
- **Campos**: Nome, telefone, email, curso, estágio, data, última interação
- **Arquivos**: `public/crm-kanban.html` (função exportLeads)

---

## 📚 FASE 2: Conteúdo e Cursos (0% Completo)

### 2.1 Lista de Professores por Curso ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: Banco de dados de professores vinculados a cada curso
- **Tarefas**:
  - [ ] Criar tabela `course_professors`
  - [ ] Interface para cadastrar professores
  - [ ] Exibir professores no fluxo do bot
  - [ ] Biografia e qualificações dos professores
- **Prioridade**: Média

### 2.2 Mostrar Valor Base sem Desconto ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: Transparência de preços no fluxo
- **Tarefas**:
  - [ ] Adicionar campo `base_price` na tabela de cursos
  - [ ] Exibir "De: R$ X / Por: R$ Y" no fluxo
  - [ ] Calcular % de desconto automaticamente
- **Prioridade**: Baixa

### 2.3 Sistema de Múltiplos Cupons ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: Aplicar mais de um cupom na mesma compra
- **Tarefas**:
  - [ ] Modificar lógica de aplicação de cupons
  - [ ] Validar combinações permitidas
  - [ ] Calcular descontos empilhados (percentual + fixo)
  - [ ] Limite máximo de desconto
  - [ ] Log de cupons aplicados
- **Prioridade**: Média

### 2.4 Versionamento de Conteúdo (Templates) ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: Salvar versões de prompts e fluxos
- **Tarefas**:
  - [ ] Criar tabela `prompt_versions`
  - [ ] Sistema de "Salvar como template"
  - [ ] Biblioteca de templates
  - [ ] Restaurar versões anteriores
  - [ ] Comparar diferenças entre versões
- **Prioridade**: Baixa

### 2.5 Upload de Edital e Ementa ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: Bot atualizado com PDFs oficiais
- **Tarefas**:
  - [ ] Upload de PDFs por curso
  - [ ] Extração de texto com OCR (tesseract.js)
  - [ ] Indexação para busca semântica
  - [ ] Bot consulta documentos atualizados
  - [ ] Armazenamento S3 ou local
- **Prioridade**: Alta

---

## 👥 FASE 3: Banco de Alunos e Ex-Alunos (0% Completo)

### 3.1 Banco de Alunos ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: Importar e gerenciar base de alunos
- **Tarefas**:
  - [ ] Criar tabela `students`
  - [ ] Importação via Excel/CSV
  - [ ] Campos: Nome, telefone, cursos feitos, status
  - [ ] Sincronizar com grupos de WhatsApp
  - [ ] Histórico de cursos por aluno
- **Prioridade**: Alta

### 3.2 Marcar Aluno Inadimplente ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: Controle de inadimplência
- **Tarefas**:
  - [ ] Campo `status_payment` (ok, pending, overdue)
  - [ ] Integração com Kiwify para verificar status
  - [ ] Alertas automáticos de inadimplência
  - [ ] Fluxo de cobrança automatizado
  - [ ] Dashboard de inadimplência
- **Prioridade**: Média

### 3.3 Verificar se Lead é Ex-Aluno ✅
- **Status**: ✅ Implementado
- **Descrição**: Detectar ex-alunos automaticamente
- **Features**:
  - Busca por telefone no banco de alunos
  - Flag `is_former_student` no lead
  - Fluxo personalizado para ex-alunos
- **Arquivos**: `services/chatbot-flow.service.js`

### 3.4 Flag Ativar/Desativar Desconto Ex-Aluno ✅
- **Status**: ✅ Resolvido
- **Descrição**: Controle de desconto para ex-alunos
- **Solução**: Remoção do texto do link do ex-aluno quando desativado
- **Arquivos**: `services/bot-control.service.js`

---

## 🤖 FASE 4: Bot Analisador e IA Avançada (0% Completo)

### 4.1 BotAnalisador de Personas ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: IA analisa conversas e gera persona de cliente ideal
- **Tarefas**:
  - [ ] Análise de sentimento das conversas
  - [ ] Extração de padrões de interesse
  - [ ] Identificação de objeções comuns
  - [ ] Geração de relatório de persona
  - [ ] Dashboard com insights de comportamento
  - [ ] Segmentação automática de leads
- **Prioridade**: Baixa
- **Tecnologia**: OpenAI GPT-4, análise de texto

### 4.2 BotAnalisador de Fluxos e Objeções ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: IA sugere melhorias no fluxo conversacional
- **Tarefas**:
  - [ ] Análise de taxa de conversão por etapa
  - [ ] Detectar drop-off points no fluxo
  - [ ] Sugerir novos textos otimizados
  - [ ] Identificar novas objeções automaticamente
  - [ ] Sugerir respostas para objeções
  - [ ] A/B testing automatizado de respostas
- **Prioridade**: Baixa
- **Tecnologia**: OpenAI GPT-4, análise de métricas

---

## 💳 FASE 5: Integração de Pagamentos (0% Completo)

### 5.1 Integração Kiwify - Verificação de Pagamento ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: Automação do fluxo de checkout
- **Tarefas**:
  - [ ] Webhook Kiwify para notificações de pagamento
  - [ ] Verificar status de pagamento em tempo real
  - [ ] Atualizar lead automaticamente (Pago/Pendente/Falhou)
  - [ ] Mover lead para estágio correto automaticamente
  - [ ] Enviar confirmação de pagamento ao lead
  - [ ] Integrar meio de pagamento detectado (PIX, Cartão, Boleto)
- **Prioridade**: Alta
- **Documentação**: [Kiwify Webhooks](https://kiwify.com.br/docs/webhooks)

---

## 📢 FASE 6: Campanhas e Automação (0% Completo)

### 6.1 Campanhas Programadas ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: Envio de mensagens agendadas em massa
- **Tarefas**:
  - [ ] Interface de criação de campanhas
  - [ ] Agendar data/hora de envio
  - [ ] Segmentar destinatários (curso, estágio, temperatura)
  - [ ] Templates de mensagens
  - [ ] Personalização com variáveis (nome, curso, etc)
  - [ ] Relatório de entrega e abertura
  - [ ] Taxa de conversão por campanha
- **Prioridade**: Média

### 6.2 Sistema de Insistência Automática ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: Follow-up automático com intervalos configuráveis
- **Tarefas**:
  - [ ] Configurar intervalos (7 dias, 15 dias, 30 dias)
  - [ ] Envio automático quando lead fica inativo
  - [ ] Mensagens progressivas (diferentes a cada envio)
  - [ ] Parar quando lead responder
  - [ ] Limite máximo de tentativas
  - [ ] Dashboard de follow-ups ativos
- **Prioridade**: Alta

---

## 🌐 FASE 7: Integração Meta API (0% Completo)

### 7.1 Migração para Meta Business API ⏳
- **Status**: 🔴 Não Iniciado
- **Descrição**: Usar API oficial do WhatsApp Business
- **Tarefas**:
  - [ ] Criar conta Meta Business
  - [ ] Configurar WhatsApp Business API
  - [ ] Migrar de wppconnect para Meta API
  - [ ] Implementar webhooks oficiais
  - [ ] Sistema de templates aprovados
  - [ ] Maior estabilidade e escalabilidade
  - [ ] Suporte oficial da Meta
- **Prioridade**: Baixa (futuro)
- **Observação**: Requer aprovação da Meta e custos adicionais

---

## 📋 FASE 8: Relatórios e Analytics (20% Completo)

### 8.1 Dashboard Analytics Completo ⏳
- **Status**: 🟡 Básico implementado
- **Descrição**: Visão 360º do negócio
- **Implementado**:
  - ✅ Total de leads
  - ✅ Taxa de conversão
  - ✅ Faturamento
- **Faltando**:
  - [ ] Gráficos de evolução temporal
  - [ ] Comparação mês a mês
  - [ ] ROI por curso
  - [ ] Performance por vendedor
  - [ ] Tempo médio de conversão
  - [ ] Funil de vendas detalhado
- **Prioridade**: Média
- **Arquivos**: `public/crm-dashboard.html`

---

## 🗂️ Estrutura de Banco de Dados - Novas Tabelas

```sql
-- Vendedores
CREATE TABLE vendors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Professores
CREATE TABLE course_professors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_name VARCHAR(100),
    professor_name VARCHAR(255),
    professor_bio TEXT,
    professor_photo VARCHAR(500),
    display_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Banco de Alunos
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255),
    courses_completed TEXT, -- JSON array
    payment_status ENUM('ok', 'pending', 'overdue') DEFAULT 'ok',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Versionamento de Prompts
CREATE TABLE prompt_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    version_name VARCHAR(100),
    course_name VARCHAR(100),
    prompt_content TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Campanhas
CREATE TABLE campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(255),
    message_template TEXT,
    target_segment JSON, -- curso, estágio, temperatura
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP NULL,
    total_sent INT DEFAULT 0,
    total_delivered INT DEFAULT 0,
    total_read INT DEFAULT 0,
    status ENUM('draft', 'scheduled', 'sent', 'failed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Uploads de Documentos
CREATE TABLE course_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_name VARCHAR(100),
    document_type ENUM('edital', 'ementa', 'regulamento'),
    file_path VARCHAR(500),
    extracted_text LONGTEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📊 Priorização de Desenvolvimento

### 🔴 Prioridade ALTA (Implementar Primeiro)
1. ✅ CRM com Kanban (Concluído)
2. ✅ Links do Instagram (Testar todos os cursos)
3. ⏳ Acesso por Vendedor ao CRM
4. ⏳ Chat Integrado na Plataforma
5. ⏳ Banco de Alunos
6. ⏳ Upload de Edital e Ementa
7. ⏳ Integração Kiwify
8. ⏳ Sistema de Insistência Automática

### 🟡 Prioridade MÉDIA (Segunda Fase)
1. ⏳ Campanhas Programadas
2. ⏳ Lista de Professores por Curso
3. ⏳ Sistema de Múltiplos Cupons
4. ⏳ Marcar Aluno Inadimplente
5. ⏳ Dashboard Analytics Completo

### ⚪ Prioridade BAIXA (Futuro)
1. ⏳ BotAnalisador de Personas
2. ⏳ BotAnalisador de Fluxos
3. ⏳ Versionamento de Conteúdo
4. ⏳ Mostrar Valor Base sem Desconto
5. ⏳ Migração para Meta API

---

## 🎯 Roadmap de Implementação

### Sprint 1 (2 semanas) - CRM Multi-Vendedor
- [ ] Sistema de login para vendedores
- [ ] Dashboard individual por vendedor
- [ ] Chat integrado no CRM
- [ ] Notificações em tempo real

### Sprint 2 (2 semanas) - Banco de Alunos
- [ ] Importação de alunos via CSV
- [ ] Verificação automática de ex-alunos
- [ ] Sistema de inadimplência
- [ ] Fluxo personalizado por perfil

### Sprint 3 (2 semanas) - Conteúdo Inteligente
- [ ] Upload de editais e ementas
- [ ] Extração e indexação de texto
- [ ] Bot consulta documentos
- [ ] Lista de professores por curso

### Sprint 4 (2 semanas) - Automação de Pagamentos
- [ ] Webhook Kiwify
- [ ] Verificação automática de pagamento
- [ ] Atualização de estágios por pagamento
- [ ] Relatório de conversão

### Sprint 5 (2 semanas) - Campanhas
- [ ] Sistema de campanhas programadas
- [ ] Templates de mensagens
- [ ] Segmentação avançada
- [ ] Relatórios de performance

### Sprint 6 (2 semanas) - Insistência e Follow-up
- [ ] Sistema de insistência automática
- [ ] Configuração de intervalos
- [ ] Mensagens progressivas
- [ ] Dashboard de follow-ups

---

## 🔧 Tecnologias Necessárias

### Backend
- Node.js + Express (atual)
- MySQL 8.0 (atual)
- Socket.IO para real-time (atual)
- Puppeteer/wppconnect (atual)
- **Novos**:
  - Multer (upload de arquivos)
  - Tesseract.js (OCR para PDFs)
  - Node-cron (agendamento)
  - Axios (chamadas Kiwify API)

### Frontend
- HTML5 + Tailwind CSS (atual)
- Vanilla JavaScript (atual)
- **Novos**:
  - Chart.js (gráficos avançados)
  - FullCalendar (campanhas programadas)
  - Dropzone.js (upload de arquivos)

### Infraestrutura
- VPS DigitalOcean (atual)
- PM2 (atual)
- Nginx (atual)
- **Novos**:
  - S3 ou local storage (documentos)
  - Redis (cache e filas)
  - Backup automático

---

## 📈 Métricas de Sucesso

### KPIs Principais
- Taxa de conversão geral > 15%
- Tempo médio de resposta < 2 minutos
- Satisfação do vendedor > 80%
- Taxa de inadimplência < 5%
- ROI de campanhas > 300%
- Tempo de implementação de melhorias < 1 semana

### Metas por Feature
- **Chat Integrado**: Reduzir tempo de resposta em 50%
- **Banco de Alunos**: Identificar 100% dos ex-alunos
- **Campanhas**: 3+ campanhas ativas por mês
- **Kiwify**: 100% automação de confirmação de pagamento
- **Follow-up**: Recuperar 20% de leads inativos

---

## 🚨 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Meta banir conta WhatsApp | Média | Alto | Usar múltiplos números, seguir boas práticas |
| Kiwify API instável | Baixa | Médio | Sistema de retry, fallback manual |
| Overload de mensagens | Média | Alto | Rate limiting, filas de envio |
| Vazamento de dados | Baixa | Crítico | Criptografia, logs de acesso, LGPD |
| Vendedor acessa lead errado | Média | Médio | Permissões rígidas por ID de vendedor |

---

## 📝 Notas Importantes

1. **Testes**: Cada feature deve ter testes antes do deploy
2. **Documentação**: Atualizar docs a cada implementação
3. **Backup**: Backup diário do banco de dados
4. **Performance**: Monitorar uso de recursos (CPU, memória, disco)
5. **Segurança**: Revisar permissões e autenticação regularmente

---

## 🎉 Conclusão

Esta milestone representa uma evolução completa do sistema, transformando-o em uma plataforma robusta de CRM, automação e análise de vendas. A implementação será incremental, priorizando features de alto impacto e valor imediato para o negócio.

**Próximo Passo**: Iniciar Sprint 1 - CRM Multi-Vendedor
