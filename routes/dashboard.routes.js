const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware de autenticação
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    next();
};

// Estatísticas do dashboard
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        // Total de mensagens
        const [totalMessages] = await db.execute(
            'SELECT COUNT(*) as total FROM messages WHERE user_id = ?',
            [userId]
        );

        // Mensagens hoje
        const today = new Date().toISOString().split('T')[0];
        const [todayMessages] = await db.execute(
            'SELECT messages_received, messages_sent FROM statistics WHERE user_id = ? AND date = ?',
            [userId, today]
        );

        // Últimas mensagens
        const [recentMessages] = await db.execute(
            'SELECT sender, message, response, timestamp FROM messages WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10',
            [userId]
        );

        // Estatísticas dos últimos 7 dias
        const [weekStats] = await db.execute(
            `SELECT date, messages_received, messages_sent 
            FROM statistics 
            WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            ORDER BY date ASC`,
            [userId]
        );

        res.json({
            totalMessages: totalMessages[0].total,
            todayMessages: todayMessages[0] || { messages_received: 0, messages_sent: 0 },
            recentMessages,
            weekStats
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
});

// Informações do usuário
router.get('/user-info', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const [users] = await db.execute(
            'SELECT name, email, phone, created_at, trial_end_date, subscription_status FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const user = users[0];

        // Calcular dias restantes do trial
        const now = new Date();
        const trialEnd = new Date(user.trial_end_date);
        const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

        res.json({
            ...user,
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0
        });
    } catch (error) {
        console.error('Erro ao obter informações do usuário:', error);
        res.status(500).json({ error: 'Erro ao obter informações do usuário' });
    }
});

module.exports = router;
