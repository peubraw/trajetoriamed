const express = require('express');
const router = express.Router();
const db = require('../config/database');
const openRouterService = require('../services/openrouter.service');
const whatsappService = require('../services/whatsapp.service');

// Middleware de autenticação
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    next();
};

// Obter configuração atual
router.get('/config', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const [configs] = await db.execute(
            'SELECT * FROM bot_configs WHERE user_id = ?',
            [userId]
        );

        if (configs.length === 0) {
            return res.json({ config: null });
        }

        res.json({ config: configs[0] });
    } catch (error) {
        console.error('Erro ao obter configuração:', error);
        res.status(500).json({ error: 'Erro ao obter configuração' });
    }
});

// Salvar/Atualizar configuração
router.post('/config', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { 
            bot_name, system_prompt, temperature, max_tokens, is_active,
            vendor1_name, vendor1_phone, vendor2_name, vendor2_phone,
            vendor3_name, vendor3_phone, vendor4_name, vendor4_phone,
            courses_config
        } = req.body;

        const [existing] = await db.execute(
            'SELECT id FROM bot_configs WHERE user_id = ?',
            [userId]
        );

        // Validar JSON se fornecido
        let coursesConfigJson = null;
        if (courses_config) {
            try {
                coursesConfigJson = typeof courses_config === 'string' 
                    ? courses_config 
                    : JSON.stringify(courses_config);
                // Testar se é JSON válido
                JSON.parse(coursesConfigJson);
            } catch (e) {
                return res.status(400).json({ error: 'courses_config não é um JSON válido' });
            }
        }

        if (existing.length === 0) {
            // Criar nova configuração
            await db.execute(
                `INSERT INTO bot_configs (user_id, bot_name, system_prompt, temperature, max_tokens, is_active,
                 vendor1_name, vendor1_phone, vendor2_name, vendor2_phone, 
                 vendor3_name, vendor3_phone, vendor4_name, vendor4_phone, courses_config) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, bot_name, system_prompt, temperature, max_tokens, is_active,
                 vendor1_name, vendor1_phone, vendor2_name, vendor2_phone,
                 vendor3_name, vendor3_phone, vendor4_name, vendor4_phone, coursesConfigJson]
            );
        } else {
            // Atualizar configuração existente
            await db.execute(
                `UPDATE bot_configs SET bot_name = ?, system_prompt = ?, temperature = ?, max_tokens = ?, is_active = ?,
                 vendor1_name = ?, vendor1_phone = ?, vendor2_name = ?, vendor2_phone = ?,
                 vendor3_name = ?, vendor3_phone = ?, vendor4_name = ?, vendor4_phone = ?, courses_config = ?
                 WHERE user_id = ?`,
                [bot_name, system_prompt, temperature, max_tokens, is_active,
                 vendor1_name, vendor1_phone, vendor2_name, vendor2_phone,
                 vendor3_name, vendor3_phone, vendor4_name, vendor4_phone, coursesConfigJson, userId]
            );
        }

        // Limpar cache de configuração
        whatsappService.clearConfigCache(userId);

        res.json({ success: true, message: 'Configuração salva com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        res.status(500).json({ error: 'Erro ao salvar configuração' });
    }
});

// Gerar prompt com ajuda da IA
router.post('/generate-prompt', requireAuth, async (req, res) => {
    try {
        const { description } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Descrição não fornecida' });
        }

        const generatedPrompt = await openRouterService.generatePrompt(description);

        res.json({ success: true, prompt: generatedPrompt });
    } catch (error) {
        console.error('Erro ao gerar prompt:', error);
        res.status(500).json({ error: 'Erro ao gerar prompt com IA' });
    }
});

// Testar prompt
router.post('/test-prompt', requireAuth, async (req, res) => {
    try {
        const { system_prompt, test_message } = req.body;

        if (!system_prompt || !test_message) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        const response = await openRouterService.processMessage(system_prompt, test_message);

        res.json({ success: true, response });
    } catch (error) {
        console.error('Erro ao testar prompt:', error);
        res.status(500).json({ error: 'Erro ao testar prompt' });
    }
});

// Reiniciar servidor
router.post('/restart-server', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        
        // Apenas usuário ID 1 pode reiniciar
        if (userId !== 1) {
            return res.status(403).json({ error: 'Sem permissão para reiniciar servidor' });
        }

        console.log('🔄 Reiniciando servidor via API...');
        
        // Responder imediatamente
        res.json({ success: true, message: 'Servidor sendo reiniciado...' });

        // Reiniciar após 1 segundo
        setTimeout(() => {
            const { exec } = require('child_process');
            exec('pm2 restart wppbot', (error, stdout, stderr) => {
                if (error) {
                    console.error('Erro ao reiniciar:', error);
                    return;
                }
                console.log('✅ Servidor reiniciado:', stdout);
            });
        }, 1000);

    } catch (error) {
        console.error('Erro ao reiniciar servidor:', error);
        res.status(500).json({ error: 'Erro ao reiniciar servidor' });
    }
});

module.exports = router;
