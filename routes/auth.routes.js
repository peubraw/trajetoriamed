const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Registro
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Verificar se o email já existe
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Calcular data de fim do trial
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + parseInt(process.env.TRIAL_DAYS || 1));

        // Inserir usuário
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, phone, trial_end_date) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, phone, trialEndDate]
        );

        const userId = result.insertId;

        // Criar sessão
        req.session.userId = userId;
        req.session.email = email;

        res.json({
            success: true,
            message: 'Cadastro realizado com sucesso! Você tem 1 dia de teste grátis.',
            user: { id: userId, name, email, trialEndDate }
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro ao realizar cadastro' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = users[0];

        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verificar status da conta
        const now = new Date();
        const trialEnd = new Date(user.trial_end_date);
        
        if (now > trialEnd && user.subscription_status === 'trial') {
            await db.execute(
                'UPDATE users SET subscription_status = ?, is_active = FALSE WHERE id = ?',
                ['expired', user.id]
            );
            return res.status(403).json({ error: 'Período de teste expirado. Por favor, assine um plano.' });
        }

        // Criar sessão
        req.session.userId = user.id;
        req.session.email = user.email;
        
        console.log('Login - Session criada:', {
            sessionID: req.sessionID,
            userId: req.session.userId,
            email: req.session.email
        });

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'admin',
                subscriptionStatus: user.subscription_status,
                trialEndDate: user.trial_end_date
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao fazer logout' });
        }
        res.json({ success: true, message: 'Logout realizado com sucesso' });
    });
});

// Verificar sessão
router.get('/check', async (req, res) => {
    console.log('Check auth - Session:', { sessionID: req.sessionID, userId: req.session.userId });
    
    if (!req.session.userId) {
        return res.json({ authenticated: false });
    }

    try {
        const [users] = await db.execute('SELECT id, name, email, role, subscription_status, trial_end_date FROM users WHERE id = ?', [req.session.userId]);
        
        if (users.length === 0) {
            return res.json({ authenticated: false });
        }

        res.json({ authenticated: true, user: users[0] });
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        res.status(500).json({ error: 'Erro ao verificar sessão' });
    }
});

module.exports = router;
