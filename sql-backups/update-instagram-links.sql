-- Atualizar links do Instagram para cada curso
-- Execute este script no banco wppbot_saas

-- Buscar a configuração atual
SELECT id, courses_config FROM bot_configs WHERE user_id = 1;

-- Depois de ver o resultado acima, você pode atualizar manualmente via interface
-- Ou use este update (ajuste o JSON conforme necessário)

-- Os códigos dos posts para cada curso:
-- 1. Auditoria: DRdKJY3EoDZ, DRPUfNAD_rh
-- 2. Medicina: DRdPYbOjKWz, DRR2VguD_FB
-- 3. Perícia: DRdWPwjDdvm, DRNgEHMkv4A
-- 4. Combo: DRdbFtgDP78, DRUZQs_Etcr
-- 5. Prova Títulos: DQ9dnOaEdj-
-- 6. Missão: DRNHjuCEqgx
-- 7. SOS: DRe6yCFkVb9, DRiL23pkYQ1
-- 8. CAIXA: DRU3kC6EsAb, DRC6rxpjKeq, DRmqy4ukvx2, DRurm3nEUYb
-- 9. TCE MG: DRe3y7vAChT

-- Link geral para todas as Pós-Graduações: DRkHa07E-Ye
