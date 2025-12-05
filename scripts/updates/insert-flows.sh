#!/bin/bash

# Script para inserir fluxos no banco de dados

mysql -u root -p'Leviathan1986@' wppbot_saas << 'EOF'

-- Buscar configuração atual
SET @config = (SELECT courses_config FROM bot_configs LIMIT 1);

-- Atualizar fluxos
UPDATE bot_configs SET courses_config = JSON_SET(
    courses_config,
    
    -- CAIXA
    '$.courses[?(@.id == "caixa")].flow_instructions', 
    '# FLUXO ESPECÍFICO: CAIXA - MÉDICO DO TRABALHO

**DIFERENCIAL PRINCIPAL:**
Preparação direcionada para quem tem rotina pesada (plantões/consultório).

**PASSO 1: APRESENTAÇÃO E IDENTIFICAÇÃO**
- Olá Dr(a)! Excelente escolha no concurso da CAIXA!
- 💼 Salário: R$ 12.371,00 + Benefícios
- 📅 Prova: 01/02/2026
- ⏰ Inscrições até: 08/12/2025

**PASSO 2: QUALIFICAÇÃO**
Pergunte: "Dr(a), o senhor tem RQE em Medicina do Trabalho?"

**SE SIM (TEM RQE):**
- "Excelente! Este concurso foi feito exatamente para o Dr(a)."
- Apresente os benefícios do curso e passe para negociação

**SE NÃO (NÃO TEM RQE):**
- "Quanto tempo o Dr(a) tem de experiência na área?"
- SE MENOS DE 2 ANOS: "Recomendo também o TCE MG, que aceita qualquer especialidade"
- SE MAIS DE 2 ANOS: "A Caixa permite apresentar o título depois na posse. Temos o Preparatório da Prova de Títulos"

**SE NÃO TEM ESPECIALIDADE:**
- "Tranquilo! Nós temos a solução!"
- "O Dr(a) pode fazer nossa Pós-Graduação em Medicina do Trabalho"
- "Existem muitas boas oportunidades nessa área para deixar o plantão"

**PASSO 3: ARGUMENTAÇÃO**
"Doutor(a), o curso foi feito para quem dá plantão:"
✅ Aulas gravadas para assistir no plantão, em casa ou intervalos
✅ Material "Cirúrgico": Resumos e Leis direcionados
✅ Mapas mentais para memorização rápida
✅ Cronograma de estudos pronto
✅ Método validado pela Profa. Germana (1º Lugar Perícia Federal)

**AUTORIDADE:**
"O método é validado pela Profa. Germana, que passou em 1º Lugar na Perícia Médica Federal usando exatamente essa estratégia."

**OBJEÇÕES ESPECÍFICAS:**
- "Não terei tempo": O curso foi feito para quem dá plantão. Aulas curtas e cronograma para 1h a 2h por dia
- "Vou estudar sozinho": Sozinho você perde tempo com o que não cai. A banca Cesgranrio tem estilo próprio
- "Mas são poucas vagas": O déficit na Caixa é enorme. Órgãos federais chamam muito mais que o edital oficial'
    
) WHERE id = 1;

SELECT '✅ Fluxo do CAIXA inserido!' as status;

EOF

echo "✅ Script executado com sucesso!"
