-- Seed default courses configuration
-- Este script popula a configuração padrão dos cursos para o usuário ID 1
-- Execute após criar a conta ou quando quiser resetar para padrão

UPDATE bot_configs 
SET courses_config = '{
  "bot_persona": {
    "name": "Mia",
    "role": "consultora de carreira da Trajetória Med",
    "company": "Trajetória Med",
    "tone": "Consultiva e empática. Use emojis moderados. Mensagens curtas e diretas. Nunca use ** (asteriscos) ao redor dos links."
  },
  "pricing": {
    "installment": "12x de R$ 227,22",
    "cash": "R$ 2.197,00 à vista",
    "coupon": "TRAJETORIA40",
    "subscription": {
      "initial_fee": "R$ 39,90",
      "monthly_installment": "12x de R$ 227,22 + taxa do cartão"
    }
  },
  "courses": [
    {
      "id": "auditoria",
      "name": "Auditoria em Saúde",
      "salary": "",
      "exam_date": "",
      "registration_deadline": "",
      "registration_fee": "",
      "registration_fee_due": "",
      "subjects": "",
      "payment_link_new": "https://pay.kiwify.com.br/eQ5bDwh",
      "payment_link_alumni": "https://pay.kiwify.com.br/wnX5sKi"
    },
    {
      "id": "medicina",
      "name": "Medicina do Trabalho",
      "salary": "",
      "exam_date": "",
      "registration_deadline": "",
      "registration_fee": "",
      "registration_fee_due": "",
      "subjects": "",
      "payment_link_new": "https://pay.kiwify.com.br/kQs5dRx",
      "payment_link_alumni": "https://pay.kiwify.com.br/0Gu4DGE"
    },
    {
      "id": "pericia",
      "name": "Perícia Médica",
      "salary": "",
      "exam_date": "",
      "registration_deadline": "",
      "registration_fee": "",
      "registration_fee_due": "",
      "subjects": "",
      "payment_link_new": "https://pay.kiwify.com.br/wUWMdZC",
      "payment_link_alumni": "https://pay.kiwify.com.br/LjGbxhO"
    },
    {
      "id": "combo",
      "name": "Combo (Auditoria + Medicina + Perícia)",
      "salary": "",
      "exam_date": "",
      "registration_deadline": "",
      "registration_fee": "",
      "registration_fee_due": "",
      "subjects": "",
      "payment_link_new": "https://pay.kiwify.com.br/G8D28l3",
      "payment_link_alumni": "https://pay.kiwify.com.br/yv14Nj6"
    },
    {
      "id": "provatitulos",
      "name": "Prova de Títulos",
      "salary": "",
      "exam_date": "",
      "registration_deadline": "",
      "registration_fee": "",
      "registration_fee_due": "",
      "subjects": "",
      "payment_link_new": "https://pay.kiwify.com.br/Wkh7JCu",
      "payment_link_alumni": "https://pay.kiwify.com.br/lEWsLJm"
    },
    {
      "id": "missao",
      "name": "Missão Residência",
      "salary": "",
      "exam_date": "",
      "registration_deadline": "",
      "registration_fee": "",
      "registration_fee_due": "",
      "subjects": "",
      "payment_link_new": "https://pay.kiwify.com.br/BgwBX4J",
      "payment_link_alumni": "https://pay.kiwify.com.br/Mdi4c4N"
    },
    {
      "id": "sos",
      "name": "SOS Concurso",
      "salary": "",
      "exam_date": "",
      "registration_deadline": "",
      "registration_fee": "",
      "registration_fee_due": "",
      "subjects": "",
      "payment_link_new": "https://pay.kiwify.com.br/XCLSRrI",
      "payment_link_alumni": "https://pay.kiwify.com.br/fAl2qrg"
    },
    {
      "id": "caixa",
      "name": "CAIXA - Médico do Trabalho",
      "salary": "R$ 12.371,00",
      "exam_date": "01/02/2026",
      "registration_deadline": "até 08/12/2025 às 23h",
      "registration_fee": "R$ 150,00",
      "registration_fee_due": "",
      "subjects": "Medicina do Trabalho e temas relacionados",
      "qualification_requirements": "RQE (Registro de Qualificação de Especialista) em Medicina do Trabalho. Se não tiver RQE, precisa ter pelo menos 2 anos de experiência comprovada na área.",
      "payment_link_new": "https://pay.kiwify.com.br/q0TTdIR",
      "payment_link_alumni": "https://pay.kiwify.com.br/7aiBZMe"
    },
    {
      "id": "tcemg",
      "name": "TCE MG - Tribunal de Contas do Estado de Minas Gerais",
      "salary": "R$ 15.000,00",
      "exam_date": "25/01/2026",
      "registration_deadline": "até 09/12/2025",
      "registration_fee": "R$ 180,00",
      "registration_fee_due": "até 11/12/2025",
      "subjects": "P1 - 5 matérias: Português, Raciocínio Lógico, Informática, Direito Constitucional, Direito Administrativo\\nP2 - Medicina Completa (toda a graduação)\\nP3 - Discursiva",
      "qualification_requirements": "Qualquer especialidade médica é aceita. Não precisa de especialização específica.",
      "payment_link_new": "https://pay.kiwify.com.br/vxDfWrp",
      "payment_link_alumni": "https://pay.kiwify.com.br/Jl2eYDO"
    }
  ]
}'
WHERE user_id = 1;

-- Verificar se foi atualizado
SELECT id, user_id, bot_name, 
       CASE 
         WHEN courses_config IS NOT NULL THEN 'JSON configurado'
         ELSE 'NULL'
       END as courses_status
FROM bot_configs 
WHERE user_id = 1;
