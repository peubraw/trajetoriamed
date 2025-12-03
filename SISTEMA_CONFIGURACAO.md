# Sistema de Configuração Unificado - WppBot SaaS

## 📋 Visão Geral

Criamos um **sistema único e centralizado** para configurar TUDO relacionado ao bot em um só lugar, substituindo as páginas antigas fragmentadas.

## 🎯 Acesso

Dashboard → **🎯 Configuração Completa**

## 📑 Estrutura em 6 Seções

### 1. 🌍 GLOBAL
**O que configura:**
- Persona do Bot (nome, função, empresa, tom de voz)
- Preços padrão (parcelamento, à vista, cupom, assinatura)
- Menu principal (texto enviado quando lead inicia conversa)

**Exemplo:**
```
Nome: Mia
Função: consultora de carreira da Trajetória Med
Tom: Profissional, empático, persuasivo e objetivo
```

---

### 2. 📚 CURSOS
**O que configura:**
- Lista de todos os cursos
- Informações básicas: nome, ID, salário, data prova
- Links de pagamento (novo aluno vs ex-aluno)

**Funcionalidades:**
- ➕ Adicionar novos cursos
- ✏️ Editar cursos existentes
- 🗑️ Excluir cursos

**Campos por curso:**
- ID único (ex: `caixa`, `tcemg`, `auditoria`)
- Nome completo
- Salário
- Data da prova
- Link para novo aluno
- Link para ex-aluno

---

### 3. 🔄 FLUXOS DE ATENDIMENTO
**O que configura:**
- Fluxo específico de cada curso
- Instruções detalhadas por etapa
- Scripts de identificação, qualificação, apresentação

**Como usar:**
1. Selecione o curso no dropdown
2. Cole o fluxo completo no editor
3. Suporta Markdown para formatação

**Exemplo de fluxo (CAIXA):**
```markdown
# FLUXO ESPECÍFICO: CAIXA

**PASSO 1: IDENTIFICAÇÃO**
- "Olá Dr(a), sou a Mia. Qual o seu nome completo?"

**PASSO 2: TRIAGEM DE ESPECIALIDADE**
Perguntar: "O Dr(a) tem alguma especialidade?"

CENÁRIO A (outra especialidade):
- Avisar que concurso é para Médico do Trabalho
- Oferecer Pós-graduação
...
```

---

### 4. 💬 SCRIPTS E OBJEÇÕES
**O que configura:**

#### Scripts Gerais (todos os cursos):
- Objeção "Está caro"
- Objeção "Não tenho tempo"
- Objeção "Vou estudar sozinho"
- Objeção "Preciso pensar"
- Rejeição final

#### Scripts por Curso:
- Script de apresentação (primeira mensagem)
- Script de fechamento

**Exemplo:**
```
Objeção "Está caro":
"Dr(a), o salário inicial é R$ 12 mil + benefícios. 
O valor do curso é menor que um único plantão de 24h. 
É um investimento para sair dos plantões, não um custo."
```

---

### 5. 💼 REGRAS DE NEGÓCIO
**O que configura:**

#### Links de Pagamento:
- Link Black Friday/Promoção
- Link Normal
- Data limite da promoção

#### Formas de Pagamento:
- ✅ PIX (+ chave PIX)
- ✅ Cartão de Crédito
- ✅ Assinatura
- ❌ Boleto (desativado)

#### Liberação de Acesso:
- Mensagem padrão: "O material será liberado logo após a confirmação do pagamento"
- ⚠️ Nunca especificar tempo

#### Limitações e Proibições:
- ❌ NÃO perguntar se é ex-aluno
- ❌ NÃO oferecer link por email
- ❌ NÃO usar links Hotmart
- ❌ NÃO inventar descontos

---

### 6. 🔧 AVANÇADO
**O que configura:**

#### Comportamento da IA:
- Buffer de mensagens (segundos)
- Instruções adicionais personalizadas

#### Vendedores:
- Lista de vendedores para notificação
- Nome + Telefone de cada um

#### Sistema de Ex-Alunos:
- Ativar/desativar detecção automática

#### Exportar/Importar:
- 📥 Exportar toda configuração em JSON
- 📤 Importar configuração salva

---

## 💾 Como Salvar

**Botão fixo no canto inferior direito:**
```
💾 Salvar Tudo
```

Salva TODAS as configurações de uma vez:
- Global
- Cursos
- Fluxos
- Scripts
- Regras de negócio
- Avançado

---

## 🔄 Integração com o Bot

### Como o bot usa essas configurações:

1. **Ao iniciar conversa:**
   - Envia o Menu Principal (configurado em Global)

2. **Quando lead escolhe curso:**
   - Carrega fluxo específico (configurado em Fluxos)
   - Usa scripts do curso (configurado em Scripts)

3. **Durante negociação:**
   - Aplica objeções gerais (configurado em Scripts)
   - Verifica regras de negócio (promoção ativa? ex-aluno?)

4. **Ao enviar link:**
   - Decide entre link promo ou normal baseado na data
   - Usa link correto do curso selecionado

---

## 📊 Estrutura de Dados (JSON)

```json
{
  "bot_persona": {
    "name": "Mia",
    "role": "consultora de carreira",
    "company": "Trajetória Med",
    "tone": "Profissional, empático..."
  },
  "pricing": {
    "installment": "12x de R$ 227,22",
    "cash": "R$ 2.197,00",
    "coupon": "TRAJETORIA40",
    "subscription": {
      "initial_fee": "R$ 39,90"
    }
  },
  "menu_text": "Olá, Dr(a)! 👋\nSou a Mia...",
  "courses": [
    {
      "id": "caixa",
      "name": "CAIXA - Médico do Trabalho",
      "salary": "R$ 12.371,00",
      "exam_date": "01/02/2026",
      "payment_link_new": "https://pay.kiwify.com.br/...",
      "payment_link_alumni": "https://pay.kiwify.com.br/...",
      "flow_instructions": "# FLUXO ESPECÍFICO...",
      "intro_script": "Olá, Dr(a)!...",
      "closing_script": "Perfeito, Dr(a)!..."
    }
  ],
  "business_rules": {
    "payment_link_promo": "https://pay.kiwify.com.br/...",
    "payment_link_normal": "https://pay.kiwify.com.br/...",
    "promo_end_date": "2025-12-05",
    "pix_key": "contato@escoladepericiamedica.com.br",
    "access_message": "O material será liberado..."
  },
  "objections": {
    "price": "Dr(a), o salário inicial...",
    "time": "O curso foi feito para quem dá plantão...",
    "alone": "O problema é filtrar...",
    "think": "Claro, Dr(a)! Mas lembre-se...",
    "final": "Então deixamos para uma próxima..."
  },
  "advanced": {
    "message_buffer": 3,
    "additional_instructions": "..."
  }
}
```

---

## ✅ Vantagens do Sistema Único

1. **Tudo em um lugar:** Não precisa navegar entre 3 páginas diferentes
2. **Organizado por função:** Cada aba tem propósito específico
3. **Visual moderno:** Tailwind CSS, responsivo, intuitivo
4. **Fluxos por curso:** Configure comportamento único para cada produto
5. **Scripts reutilizáveis:** Objeções gerais + específicas por curso
6. **Exportar/Importar:** Faça backup ou duplique configurações
7. **Validação visual:** Veja cards dos cursos, status dos links
8. **Salvar unificado:** Um botão salva TUDO

---

## 🚀 Próximos Passos Sugeridos

1. **Atualizar prompt-builder.service.js** para ler nova estrutura
2. **Migrar dados existentes** da estrutura antiga para nova
3. **Criar validações** (campos obrigatórios, formato de links)
4. **Adicionar preview** (ver como IA responderá antes de salvar)
5. **Histórico de versões** (rastrear mudanças nas configurações)

---

## 📝 Notas Importantes

- **Compatibilidade:** Sistema mantém compatibilidade com estrutura antiga
- **Backup:** Sempre exporte antes de fazer grandes mudanças
- **Teste:** Após salvar, teste o fluxo no WhatsApp
- **Deploy:** Mudanças são aplicadas imediatamente após salvar

---

## 🆘 Solução de Problemas

**Bot não usando novo fluxo?**
- Verifique se salvou após editar
- Reinicie o servidor PM2
- Confirme que o ID do curso está correto

**Links não funcionando?**
- Valide se URLs estão completas (https://)
- Confirme que links são do Kiwify
- Teste links diretamente no navegador

**Scripts não aplicados?**
- Certifique-se que selecionou o curso correto
- Verifique se salvou após editar
- Confirme formato Markdown correto

---

**Criado em:** 02/12/2025  
**Versão:** 1.0  
**Status:** ✅ Ativo
