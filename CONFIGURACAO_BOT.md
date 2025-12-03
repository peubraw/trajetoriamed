# 📋 Guia de Configuração do Bot - Sistema Dinâmico

## ✨ Novidades

O bot agora é **100% configurável** através da página de administração! Você pode editar:

- ✅ **Persona do Bot** (nome, cargo, tom de voz)
- ✅ **Cursos** (todos os detalhes: salário, datas, links, matérias)
- ✅ **Preços** (parcelamento, à vista, cupons, assinatura)
- ✅ **Vendedores** (notificações de leads)
- ✅ **Configurações da IA** (temperatura, max tokens)

**Não é mais necessário editar código!** 🎉

---

## 🚀 Como Acessar

1. Faça login no sistema: `http://165.22.158.58:3001`
2. Acesse: **Configurar Bot** (botão na dashboard)
3. Ou acesse diretamente: `http://165.22.158.58:3001/configurar-bot.html`

---

## 📚 Abas de Configuração

### 🎭 **1. Persona do Bot**

Configure a identidade do bot:

- **Nome do Bot**: Como ele se apresenta (ex: Mia)
- **Função/Cargo**: Descrição do papel (ex: "consultora de carreira da Trajetória Med")
- **Nome da Empresa**: Nome da sua empresa
- **Tom de Voz**: Como o bot deve se comunicar (ex: "Consultiva e empática, use emojis moderados")

**Exemplo:**
```
Nome: Mia
Cargo: consultora de carreira da Trajetória Med
Empresa: Trajetória Med
Tom: Consultiva e empática. Use emojis moderados. Mensagens curtas e diretas.
```

---

### 📚 **2. Cursos**

Configure todos os cursos que o bot oferece. Para cada curso você pode definir:

#### Campos Obrigatórios:
- **ID do Curso**: Identificador único (ex: caixa, tcemg, auditoria) - SEM ESPAÇOS
- **Nome do Curso**: Nome completo (ex: "CAIXA - Médico do Trabalho")

#### Campos Opcionais (mas recomendados):
- **Salário**: Salário oferecido (ex: "R$ 15.000,00")
- **Data da Prova**: Quando será a prova (ex: "25/01/2026")
- **Prazo de Inscrição**: Até quando pode se inscrever (ex: "até 09/12/2025")
- **Taxa de Inscrição**: Valor da taxa (ex: "R$ 180,00")
- **Vencimento da Taxa**: Data limite de pagamento (ex: "11/12/2025")
- **Matérias da Prova**: Liste as matérias (use Enter para quebrar linha)
- **Link Pagamento (Novo Aluno)**: Link do Kiwify para novos alunos
- **Link Pagamento (Ex-Aluno)**: Link do Kiwify para ex-alunos

**Exemplo TCE MG:**
```
ID: tcemg
Nome: TCE MG - Tribunal de Contas do Estado de Minas Gerais
Salário: R$ 15.000,00
Data da Prova: 25/01/2026
Prazo: até 09/12/2025
Taxa: R$ 180,00
Vencimento: 11/12/2025
Matérias:
P1 - Português, Direito Administrativo, Direito Constitucional, Controle Externo, Direitos Humanos
P2 - Medicina Completa (toda a graduação médica)
P3 - Discursiva
Link Novo: https://pay.kiwify.com.br/vxDfWrp
Link Ex-Aluno: https://pay.kiwify.com.br/Jl2eYDO
```

#### ➕ Adicionar Curso:
1. Clique em "➕ Adicionar Curso"
2. Preencha todos os campos
3. Clique em "💾 Salvar Configuração"

#### 🗑️ Remover Curso:
1. Clique no botão "🗑️ Remover" do curso
2. Confirme a remoção
3. Clique em "💾 Salvar Configuração"

---

### 💰 **3. Preços e Condições**

Configure as formas de pagamento:

#### Preços Normais:
- **Parcelamento**: Como aparece o parcelamento (ex: "12x de R$ 227,22")
- **À Vista**: Valor à vista (ex: "R$ 2.197,00")
- **Cupom de Desconto**: Código do cupom (ex: "TRAJETORIA40")

#### Assinatura:
- **Taxa Inicial**: Valor da taxa inicial (ex: "R$ 39,90")
- **Parcelamento Mensal**: Descrição do parcelamento (ex: "12x de R$ 227,22 + taxa do cartão")

**Exemplo:**
```
Parcelamento: 12x de R$ 227,22
À Vista: R$ 2.197,00
Cupom: TRAJETORIA40

Assinatura:
- Taxa Inicial: R$ 39,90
- Parcelamento: 12x de R$ 227,22 + taxa do cartão
```

---

### 👥 **4. Vendedores**

Configure até 4 vendedores que receberão notificações de leads interessados.

**Campos:**
- **Nome**: Nome do vendedor
- **Telefone**: Número no formato `5531999999999` (sem espaços, traços ou parênteses)

**Quando os vendedores são notificados:**
- Lead solicita assinatura (bot pausa, humano assume)
- Lead envia comprovante de pagamento
- Lead demonstra forte interesse

**Exemplo:**
```
Vendedor 1: Nathalia - 5531971102701
Vendedor 2: Vitória - 5531985757508
Vendedor 3: João - 5531973088916
Vendedor 4: Leandro - 553187369717
```

---

### 🔧 **5. Avançado**

Configurações da IA (para usuários avançados):

#### Temperature (Criatividade):
- **Valor**: 0.0 a 2.0
- **Recomendado**: 0.7
- **0.0**: Mais determinístico, respostas consistentes
- **2.0**: Mais criativo, respostas variadas

#### Max Tokens (Tamanho da Resposta):
- **Valor**: 50 a 2000
- **Recomendado**: 500
- Controla o tamanho máximo das respostas da IA

#### Bot Ativo:
- Marque para ativar o bot
- Desmarque para pausar temporariamente

---

## 💾 Salvando Configurações

1. Edite os campos desejados
2. Clique em "💾 Salvar Configuração"
3. Aguarde mensagem de sucesso: "✅ Configuração salva com sucesso!"
4. As mudanças são aplicadas imediatamente (sem necessidade de reiniciar)

---

## 🔄 Recarregando Configurações

Se você editou no banco de dados ou quer descartar mudanças não salvas:

1. Clique em "🔄 Recarregar"
2. Os dados do banco serão carregados novamente

---

## 🧪 Testando o Bot

_(Funcionalidade em desenvolvimento)_

1. Clique em "🧪 Testar Bot"
2. Envie uma mensagem de teste
3. Veja como o bot responderia

---

## 📊 Estrutura dos Dados (JSON)

As configurações são salvas em formato JSON no banco de dados. Exemplo:

```json
{
  "bot_persona": {
    "name": "Mia",
    "role": "consultora de carreira da Trajetória Med",
    "company": "Trajetória Med",
    "tone": "Consultiva e empática..."
  },
  "pricing": {
    "installment": "12x de R$ 227,22",
    "cash": "R$ 2.197,00 à vista",
    "coupon": "TRAJETORIA40",
    "subscription": {
      "initial_fee": "R$ 39,90",
      "monthly_installment": "12x de R$ 227,22 + taxa"
    }
  },
  "courses": [
    {
      "id": "tcemg",
      "name": "TCE MG - Tribunal de Contas",
      "salary": "R$ 15.000,00",
      "exam_date": "25/01/2026",
      ...
    }
  ]
}
```

---

## ⚠️ Dicas Importantes

### ✅ DO:
- ✅ Use IDs de cursos sem espaços (ex: `tcemg`, não `tce mg`)
- ✅ Teste o bot após grandes mudanças
- ✅ Mantenha links atualizados do Kiwify
- ✅ Use formato de telefone sem formatação: `5531999999999`
- ✅ Salve frequentemente para não perder alterações

### ❌ DON'T:
- ❌ Não use caracteres especiais nos IDs (apenas letras e números)
- ❌ Não deixe campos obrigatórios vazios (ID e Nome do curso)
- ❌ Não use formatação Markdown nos textos (exceto * para negrito)
- ❌ Não coloque espaços nos telefones dos vendedores

---

## 🐛 Resolução de Problemas

### "Configuração não salva"
- Verifique se está logado
- Verifique se todos os campos obrigatórios estão preenchidos
- Abra o console do navegador (F12) para ver erros

### "Bot não responde com as novas informações"
- Aguarde 1 minuto (cache do servidor)
- Ou clique em "🔄 Recarregar" na página de configuração

### "Links não funcionam"
- Verifique se os links do Kiwify estão corretos
- Certifique-se de que não há espaços antes/depois dos links

### "Vendedores não recebem notificações"
- Verifique o formato do telefone: `5531999999999`
- Certifique-se de que o número está correto e ativo no WhatsApp

---

## 📞 Suporte

Dúvidas? Entre em contato com o administrador do sistema.

---

## 🎉 Pronto!

Agora você pode configurar todo o bot sem precisar editar código! 

**Última atualização:** 02/12/2024
