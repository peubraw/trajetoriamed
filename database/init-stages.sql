-- Criar estágios padrão para o usuário Leandro (user_id=1)
INSERT INTO crm_stages (user_id, name, position, color, bot_enabled, is_success, is_lost) VALUES
(1, '🎯 Triagem', 1, '#3b82f6', 1, 0, 0),
(1, '🥗 Nutrição', 2, '#10b981', 1, 0, 0),
(1, '🔗 Link Enviado', 3, '#f59e0b', 0, 0, 0),
(1, '💰 Negociação', 4, '#8b5cf6', 0, 0, 0),
(1, '⏳ Aguardando', 5, '#6366f1', 0, 0, 0),
(1, '✅ Confirmada', 6, '#22c55e', 1, 1, 0),
(1, '❌ Perdido', 7, '#ef4444', 0, 0, 1);
