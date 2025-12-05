UPDATE bot_configs 
SET system_prompt = JSON_SET(
    system_prompt, 
    '$.menu_principal', 
    'Olá, Dr(a)! 👋\\n\\nSou o Assistente da *Trajetória Med*!\\n\\nDigite o número da opção desejada:\\n\\n*📚 PÓS-GRADUAÇÕES:*\\n1️⃣ Pós em Auditoria em Saúde\\n2️⃣ Pós em Medicina do Trabalho\\n3️⃣ Pós em Perícia Médica Federal e Judicial\\n4️⃣ Combo Perícia + Medicina do Trabalho\\n\\n*🎯 PREPARATÓRIOS:*\\n5️⃣ Prova de Título em Medicina Legal\\n6️⃣ Missão Médico Legista (PC/PF)\\n7️⃣ SOS Médico Legista (Reta Final)\\n8️⃣ CAIXA (Médico do Trabalho)\\n9️⃣ TCE MG (Tribunal de Contas)'
) 
WHERE user_id = 1;
