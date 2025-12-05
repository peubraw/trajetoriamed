# 🧪 TESTES DO CRM KANBAN

## 🚀 CHECKLIST DE INSTALAÇÃO

Execute os passos abaixo para testar se tudo está funcionando:

---

## 1️⃣ INSTALAÇÃO DO BANCO DE DADOS

### Via MySQL Command Line:
```bash
cd C:\xampp\htdocs\projetos\wppbot
mysql -u root -p wppbot_saas < database/crm-schema.sql
```

### Via phpMyAdmin:
1. Abrir http://localhost/phpmyadmin
2. Selecionar banco `wppbot_saas`
3. Clicar em "SQL"
4. Colar todo o conteúdo de `database/crm-schema.sql`
5. Clicar em "Executar"

### Verificar Instalação:
```sql
-- Ver tabelas criadas
SHOW TABLES LIKE 'crm_%';
-- Deve retornar: crm_activities, crm_followups, crm_leads, crm_notes, 
-- crm_quick_audios, crm_settings, crm_stages, crm_tags, crm_webhooks

-- Ver views criadas
SHOW FULL TABLES WHERE TABLE_TYPE LIKE 'VIEW';
-- Deve incluir: v_crm_pipeline, v_crm_seller_stats, v_crm_lost_reasons
```

---

## 2️⃣ CRIAR ESTÁGIOS PADRÃO

### Via API (Recomendado):
```bash
# PowerShell (Windows)
Invoke-WebRequest -Uri "http://localhost:3000/api/crm/stages/init" -Method POST -UseBasicParsing

# Curl (Linux/Mac)
curl -X POST http://localhost:3000/api/crm/stages/init
```

### Verificar Criação:
```sql
SELECT * FROM crm_stages WHERE user_id = 1;
-- Deve retornar 7 estágios
```

---

## 3️⃣ TESTAR ACESSO ÀS PÁGINAS

### Abrir no Navegador:

✅ **Dashboard Principal:**
http://localhost:3000

✅ **Kanban Pipeline:**
http://localhost:3000/crm-kanban.html

✅ **Dashboard Analítico:**
http://localhost:3000/crm-dashboard.html

**O que deve aparecer:**
- Kanban: 7 colunas vazias (normal, sem leads ainda)
- Dashboard: KPIs com R$ 0,00 (normal, sem vendas ainda)

---

## 4️⃣ CRIAR LEAD DE TESTE (Manual)

### Via SQL:
```sql
-- Criar lead de teste
INSERT INTO crm_leads (
    user_id, phone, name, email, state, rqe, specialty,
    stage_id, channel, interested_course, bot_active,
    potential_value, temperature, score
) VALUES (
    1,                          -- user_id (Leandro)
    '5584999887766',           -- Telefone
    'Dr. João Silva Teste',    -- Nome
    'joao@teste.com',          -- Email
    'RN',                       -- Estado
    'RQE123456',               -- RQE
    'Medicina do Trabalho',    -- Especialidade
    1,                          -- stage_id (Novos/Triagem)
    'manual',                   -- Canal
    'Pós Medicina do Trabalho', -- Curso
    TRUE,                       -- Bot ativo
    2197.00,                    -- Valor potencial
    'hot',                      -- Temperatura (quente)
    85                          -- Score
);

-- Verificar criação
SELECT * FROM crm_leads WHERE phone = '5584999887766';
```

### Via API (PowerShell):
```powershell
$body = @{
    phone = "5584999887766"
    name = "Dr. João Silva Teste"
    email = "joao@teste.com"
    state = "RN"
    interestedCourse = "Pós Medicina do Trabalho"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/crm/leads" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

**Resultado Esperado:**
- Atualizar página do Kanban
- Card do "Dr. João Silva Teste" aparece na coluna "Novos / Triagem"
- Card tem badge 🟢 BOT ATIVO
- Card tem temperatura 🔥 (quente)
- Score: 85/100

---

## 5️⃣ TESTAR DRAG & DROP

1. No Kanban, **arrastar** o card "Dr. João Silva"
2. **Soltar** na coluna "Nutrição / Apresentação"

**Resultado Esperado:**
- Card move suavemente para a nova coluna
- Status do bot permanece 🟢 ATIVO (coluna tem bot ativo)
- Console do navegador (F12): "🔄 Lead movido"

---

## 6️⃣ TESTAR PAUSAR BOT

1. No card do lead, clicar em "⏸️ Pausar Bot"

**Resultado Esperado:**
- Badge muda para 🔴 BOT PAUSADO
- Botão muda para "▶️ Ativar Bot"
- Console: "🤖 Bot alterado"

---

## 7️⃣ TESTAR MODAL DE DETALHES

1. Clicar em "👁️ Ver Detalhes" no card

**Resultado Esperado:**
- Modal abre com informações completas
- Telefone, Email, RQE, Especialidade aparecem
- Seção de "Histórico de Atividades" mostra:
  - "Lead criado"
  - "Movido de estágio" (se moveu)
  - "Bot pausado" (se pausou)

---

## 8️⃣ TESTAR EXPORTAÇÃO CSV

1. No Kanban, clicar em "📥 Exportar CSV"

**Resultado Esperado:**
- Arquivo `leads_[timestamp].csv` baixa automaticamente
- Abrir no Excel/Google Sheets
- Verificar colunas: ID, Nome, Estado, Email, Telefone, etc.
- Primeira linha de dados: Dr. João Silva Teste

---

## 9️⃣ TESTAR DASHBOARD ANALÍTICO

### Criar Lead "Vendido" de Teste:
```sql
-- Buscar ID do estágio "Venda Confirmada"
SELECT id FROM crm_stages WHERE name = 'Venda Confirmada' AND user_id = 1;
-- Exemplo de resultado: 6

-- Criar lead vendido
INSERT INTO crm_leads (
    user_id, phone, name, stage_id, final_value, converted_at, bot_active
) VALUES (
    1, '5584888777666', 'Dra. Maria Vendida', 6, 2197.00, NOW(), FALSE
);
```

### Verificar Dashboard:
1. Abrir http://localhost:3000/crm-dashboard.html
2. KPI "Faturamento Realizado" deve mostrar: **R$ 2.197,00**
3. Tabela de vendedores deve aparecer (vazia se nenhum vendedor foi atribuído)

---

## 🔟 TESTAR INTEGRAÇÃO COM CHATBOT

### Enviar Mensagem de Teste no WhatsApp:
1. Escanear QR Code e conectar WhatsApp (se ainda não conectado)
2. Enviar mensagem de um número de teste: "Olá"

**Resultado Esperado:**
1. Bot responde normalmente (menu de produtos)
2. **Logs do servidor mostram:**
   ```
   ✅ Lead atualizado no CRM
   ```
3. **No banco de dados:**
   ```sql
   SELECT * FROM crm_leads ORDER BY created_at DESC LIMIT 1;
   ```
   - Lead com o número do teste aparece
   - Nome, RQE, Curso vão sendo preenchidos conforme conversa

4. **No Kanban:**
   - Atualizar página
   - Card do lead aparece automaticamente na coluna "Novos / Triagem"

---

## 1️⃣1️⃣ TESTAR BOT PAUSA AUTOMÁTICA

### Simular Vendedor Respondendo:
```sql
-- Marcar lead como se vendedor tivesse respondido
UPDATE crm_leads 
SET bot_active = FALSE, bot_paused_by = 1, bot_paused_at = NOW()
WHERE phone = '5584999887766';
```

### Enviar Mensagem do Lead:
- No WhatsApp do lead de teste, enviar: "Quero comprar"

**Resultado Esperado:**
- Bot NÃO responde (pausado)
- Logs do servidor: `⏸️ Bot pausado para XXX - aguardando intervenção humana`

---

## 1️⃣2️⃣ TESTAR SOCKET.IO (Tempo Real)

### Teste de Conexão:
1. Abrir Kanban em 2 navegadores diferentes (Chrome + Firefox)
2. No Chrome, mover um card para outra coluna
3. Verificar se Firefox atualiza automaticamente

**Resultado Esperado:**
- Console do navegador (F12): `🔌 Conectado ao Socket.IO`
- Ao mover card, Firefox recarrega board automaticamente
- Console: `🔄 Lead movido: {leadId: X, oldStageId: Y, newStageId: Z}`

---

## 🐛 PROBLEMAS COMUNS

### "Nenhuma coluna aparece no Kanban"
**Solução:**
```bash
curl -X POST http://localhost:3000/api/crm/stages/init
```

### "Lead não aparece no Kanban após criar"
**Solução:**
- Dar F5 (atualizar página)
- Verificar se `stage_id` do lead existe na tabela `crm_stages`

### "Socket.IO não conecta"
**Solução:**
1. Verificar console do navegador (F12)
2. Deve aparecer: `🔌 Conectado ao Socket.IO`
3. Se não conectar, reiniciar servidor: `Ctrl+C` → `npm start`

### "Exportação CSV baixa vazio"
**Solução:**
- Criar pelo menos 1 lead de teste (passo 4)
- Verificar: `SELECT COUNT(*) FROM crm_leads WHERE user_id = 1;`

---

## ✅ CHECKLIST FINAL

Marque os itens testados:

- [ ] Banco de dados instalado (12 tabelas criadas)
- [ ] Estágios criados (7 estágios padrão)
- [ ] Kanban abre sem erros
- [ ] Dashboard abre sem erros
- [ ] Lead de teste criado manualmente
- [ ] Card aparece no Kanban
- [ ] Drag & Drop funciona (mover card)
- [ ] Pausar/Ativar bot funciona
- [ ] Modal de detalhes abre
- [ ] Exportação CSV baixa arquivo
- [ ] Dashboard mostra KPIs
- [ ] Chatbot cria lead automaticamente (ao enviar mensagem)
- [ ] Socket.IO conecta (F12 console)
- [ ] Menu principal tem links do CRM

---

## 📊 DADOS DE TESTE COMPLETOS

Para testar com mais leads realistas, execute:

```sql
-- Criar múltiplos leads de teste
INSERT INTO crm_leads (user_id, phone, name, email, state, specialty, stage_id, channel, potential_value, temperature, score, bot_active) VALUES
(1, '5584111111111', 'Dr. Pedro Santos', 'pedro@teste.com', 'SP', 'Cardiologia', 1, 'whatsapp', 2197, 'warm', 65, TRUE),
(1, '5584222222222', 'Dra. Ana Costa', 'ana@teste.com', 'RJ', 'Dermatologia', 2, 'instagram', 2197, 'hot', 88, TRUE),
(1, '5584333333333', 'Dr. Carlos Lima', 'carlos@teste.com', 'MG', 'Ortopedia', 3, 'whatsapp', 2197, 'hot', 92, FALSE),
(1, '5584444444444', 'Dra. Julia Alves', 'julia@teste.com', 'BA', 'Pediatria', 4, 'whatsapp', 2197, 'warm', 70, FALSE),
(1, '5584555555555', 'Dr. Roberto Dias', 'roberto@teste.com', 'PR', 'Neurologia', 5, 'manual', 2197, 'warm', 75, FALSE),
(1, '5584666666666', 'Dra. Fernanda Rocha', 'fernanda@teste.com', 'RS', 'Ginecologia', 6, 'whatsapp', 2197, 'hot', 95, FALSE),
(1, '5584777777777', 'Dr. Marcos Silva', 'marcos@teste.com', 'CE', 'Psiquiatria', 7, 'instagram', 2197, 'cold', 25, FALSE);

-- Adicionar motivos de perda para dashboard
UPDATE crm_leads SET lost_reason = 'Preço alto' WHERE stage_id = 7 AND phone = '5584777777777';

-- Adicionar notas de teste
INSERT INTO crm_notes (lead_id, user_id, note) VALUES
((SELECT id FROM crm_leads WHERE phone = '5584333333333'), 1, 'Cliente pediu desconto de 10%'),
((SELECT id FROM crm_leads WHERE phone = '5584444444444'), 1, 'Negociando parcelamento em 12x');

-- Adicionar atividades de teste
INSERT INTO crm_activities (lead_id, user_id, activity_type, description) VALUES
((SELECT id FROM crm_leads WHERE phone = '5584222222222'), 1, 'message_sent', 'Link de pagamento enviado'),
((SELECT id FROM crm_leads WHERE phone = '5584333333333'), 1, 'stage_changed', 'Movido para Link Enviado');
```

**Resultado Visual:**
- 7 leads distribuídos pelas 7 colunas
- Dashboard com R$ 2.197,00 de faturamento
- Gráfico de perda com 1 motivo ("Preço alto")
- Cards com diferentes temperaturas e scores

---

## 🎉 SUCESSO!

Se todos os testes passaram, o sistema está **100% funcional**!

**Próximos passos:**
1. Conectar WhatsApp do Leandro (QR Code)
2. Aguardar leads reais chegarem automaticamente
3. Testar fluxo completo com cliente real
4. Ajustar valores de cursos conforme necessário

**🚀 BOA SORTE! 🎯**
