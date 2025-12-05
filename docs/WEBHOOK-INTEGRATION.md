# 🔗 Sistema de Webhooks de Pagamento

## Visão Geral

Sistema completo de integração com gateways de pagamento (Kiwify e Hotmart) que automatiza:
- ✅ Movimentação automática de leads no funil
- 💰 Cálculo e registro de comissões
- 📊 Atualização em tempo real do dashboard
- 📝 Registro completo de logs

---

## 🚀 Endpoints Disponíveis

### 1. POST /api/webhooks/kiwify
Recebe notificações de pagamento da Kiwify.

**Payload esperado:**
```json
{
  "order_id": "ABC123456",
  "order_status": "paid",
  "customer_email": "cliente@email.com",
  "customer_phone": "5511999999999",
  "product_name": "Pós Medicina do Trabalho",
  "product_value": "2197.00",
  "seller_email": "vendedor@email.com",
  "created_at": "2025-12-05T10:30:00Z"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Webhook processado"
}
```

---

### 2. POST /api/webhooks/hotmart
Recebe notificações de pagamento da Hotmart.

**Payload esperado:**
```json
{
  "id": "abc-123-xyz",
  "event": "PURCHASE_COMPLETE",
  "data": {
    "buyer": {
      "email": "cliente@email.com",
      "phone": "5511999999999",
      "name": "João Silva"
    },
    "purchase": {
      "transaction": "HOT-XYZ789",
      "status": "approved",
      "price": {
        "value": 2197.00,
        "currency_code": "BRL"
      }
    },
    "product": {
      "name": "Pós Medicina do Trabalho",
      "id": "123456"
    }
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Webhook processado"
}
```

---

### 3. GET /api/webhooks/logs
Lista os últimos 100 webhooks recebidos.

**Resposta:**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "gateway": "kiwify",
      "event_type": "paid",
      "lead_id": 45,
      "lead_name": "João Silva",
      "lead_phone": "5511999999999",
      "processing_status": "processed",
      "created_at": "2025-12-05T10:30:00Z",
      "processed_at": "2025-12-05T10:30:02Z"
    }
  ]
}
```

---

## 🔄 Fluxo de Processamento

### Quando um webhook é recebido:

1. **Log Inicial**: Webhook é registrado em `crm_webhook_logs` com status `pending`

2. **Busca do Lead**: Sistema busca lead pelo telefone do cliente

3. **Movimentação no Funil**: 
   - Lead é movido para estágio "Venda Confirmada" (is_success=1)
   - Campo `potential_value` é atualizado com valor da venda

4. **Registro de Atividade**:
   - Nova atividade criada em `crm_activities`
   - Tipo: `sale_confirmed`
   - Descrição: "💰 Venda confirmada via [Gateway] - Pedido: [ID]"

5. **Cálculo de Comissão**:
   - Se lead tem vendedor atribuído (`assigned_to`)
   - Calcula comissão: 10% do valor da venda
   - Insere em `crm_commissions` com status `approved`

6. **Notificação em Tempo Real**:
   - Emite evento Socket.IO `sale-confirmed`
   - Vendedor recebe notificação instantânea no dashboard

7. **Atualização de Status**:
   - Webhook marcado como `processed` em `crm_webhook_logs`
   - Timestamp `processed_at` registrado

---

## 📋 Configuração nos Gateways

### Kiwify:

1. Painel Kiwify → **Configurações** → **Integrações** → **Webhooks**
2. Adicionar Webhook
3. URL: `http://165.22.158.58/api/webhooks/kiwify`
4. Evento: **Pagamento Aprovado (paid)**
5. Salvar

### Hotmart:

1. Painel Hotmart → **Ferramentas** → **Webhooks**
2. Adicionar URL
3. URL: `http://165.22.158.58/api/webhooks/hotmart`
4. Eventos: 
   - `PURCHASE_COMPLETE`
   - `PURCHASE_APPROVED`
5. Ativar webhook

---

## 🧪 Testando Localmente

### 1. Usando cURL (Kiwify):

```bash
curl -X POST http://localhost:3001/api/webhooks/kiwify \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST-123",
    "order_status": "paid",
    "customer_email": "teste@example.com",
    "customer_phone": "5511999999999",
    "product_name": "Teste Produto",
    "product_value": "100.00",
    "seller_email": "vendedor@example.com",
    "created_at": "2025-12-05T10:30:00Z"
  }'
```

### 2. Usando cURL (Hotmart):

```bash
curl -X POST http://localhost:3001/api/webhooks/hotmart \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TEST-456",
    "event": "PURCHASE_COMPLETE",
    "data": {
      "buyer": {
        "email": "teste@example.com",
        "phone": "5511999999999"
      },
      "purchase": {
        "transaction": "HOT-TEST-789",
        "status": "approved",
        "price": {
          "value": 100.00
        }
      },
      "product": {
        "name": "Teste Produto"
      }
    }
  }'
```

### 3. Pela Interface Web:

Acesse: `http://localhost:3001/webhook-config.html`
Clique nos botões **"🧪 Testar Webhook"**

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: crm_webhook_logs

```sql
CREATE TABLE crm_webhook_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    gateway VARCHAR(50) NOT NULL,          -- 'kiwify' ou 'hotmart'
    event_type VARCHAR(100) NOT NULL,       -- 'paid', 'PURCHASE_COMPLETE', etc
    payload JSON NOT NULL,                  -- Payload completo do webhook
    lead_id BIGINT,                        -- ID do lead processado
    processing_status ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
    error_message TEXT,                    -- Mensagem de erro se falhar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    INDEX idx_gateway (gateway),
    INDEX idx_status (processing_status),
    INDEX idx_created (created_at)
);
```

### Tabela: crm_commissions

```sql
CREATE TABLE crm_commissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    lead_id BIGINT NOT NULL,
    seller_user_id BIGINT NOT NULL,
    sale_value DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    commission_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'pending',
    payment_gateway VARCHAR(50),
    transaction_id VARCHAR(255),
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_seller (seller_user_id),
    INDEX idx_status (status),
    INDEX idx_sale_date (sale_date)
);
```

---

## 📊 Monitoramento

### Ver Logs em Tempo Real:

```bash
# No VPS
tail -f /var/log/pm2/wppbot-out.log | grep webhook
```

### Consultar Webhooks no Banco:

```sql
-- Últimos 10 webhooks recebidos
SELECT 
    gateway,
    event_type,
    processing_status,
    created_at
FROM crm_webhook_logs
ORDER BY created_at DESC
LIMIT 10;

-- Webhooks com falha
SELECT 
    gateway,
    error_message,
    created_at
FROM crm_webhook_logs
WHERE processing_status = 'failed'
ORDER BY created_at DESC;

-- Total de vendas por gateway
SELECT 
    gateway,
    COUNT(*) as total,
    SUM(CASE WHEN processing_status = 'processed' THEN 1 ELSE 0 END) as processadas
FROM crm_webhook_logs
WHERE event_type IN ('paid', 'PURCHASE_COMPLETE')
GROUP BY gateway;
```

---

## 🔐 Segurança

### Validações Implementadas:

1. ✅ Validação de campos obrigatórios
2. ✅ Sanitização de telefone (remove caracteres especiais)
3. ✅ Verificação de existência do lead
4. ✅ Verificação de estágio de sucesso configurado
5. ✅ Log completo de todas as operações
6. ✅ Tratamento de erros com rollback

### Melhorias Futuras (Recomendadas):

- [ ] Validação de assinatura HMAC (Kiwify e Hotmart suportam)
- [ ] Rate limiting (max 100 requisições/minuto por IP)
- [ ] Whitelist de IPs dos gateways
- [ ] Retry automático em caso de falha
- [ ] Notificação de administrador em caso de erros

---

## 🐛 Troubleshooting

### Webhook não está sendo recebido:

1. Verificar se URL está correta no gateway
2. Verificar se servidor está acessível: `curl http://165.22.158.58/api/webhooks/kiwify`
3. Verificar logs do PM2: `pm2 logs wppbot`
4. Verificar firewall do VPS

### Lead não está sendo movido:

1. Verificar se telefone do cliente está cadastrado no CRM
2. Verificar se existe estágio com `is_success = 1`
3. Verificar logs de erro na tabela `crm_webhook_logs`

### Comissão não está sendo criada:

1. Verificar se lead tem vendedor atribuído (`assigned_to IS NOT NULL`)
2. Verificar se valor da venda foi recebido no payload
3. Consultar tabela `crm_commissions` para ver se foi criada

---

## 📈 Métricas Disponíveis

Com esse sistema, você pode extrair:

- **Taxa de conversão**: Webhooks processados / Total de leads
- **Ticket médio**: AVG(sale_value) das comissões
- **Comissões por vendedor**: SUM(commission_amount) GROUP BY seller_user_id
- **Performance por gateway**: COUNT(*) GROUP BY gateway
- **Taxa de sucesso**: processed / (processed + failed) * 100

---

## 🎯 Próximos Passos

1. ✅ **Sistema de webhooks** - IMPLEMENTADO
2. ⏳ **SLA tracking** - Implementar timers nos cards
3. ⏳ **Remarketing automation** - Cron job para leads inativos
4. ⏳ **Bulk actions** - Operações em massa
5. ⏳ **Commission payout** - Painel de pagamento de comissões

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
- Verificar logs: `pm2 logs wppbot`
- Consultar tabela: `SELECT * FROM crm_webhook_logs WHERE processing_status = 'failed'`
- Documentação Kiwify: https://developers.kiwify.com.br/webhooks
- Documentação Hotmart: https://developers.hotmart.com/docs/pt-BR/v1/webhooks
