const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

/**
 * GET /api/sellers - Listar vendedores (apenas admin)
 */
router.get('/', requireAdmin, async (req, res) => {
    try {
        const sellers = await authService.getSellers(req.session.userId);
        res.json({ success: true, sellers });
    } catch (error) {
        console.error('❌ Erro ao listar vendedores:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/sellers - Criar vendedor (apenas admin)
 */
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nome, email e senha são obrigatórios' 
            });
        }

        const sellerId = await authService.createSeller(req.session.userId, {
            name,
            email,
            password,
            phone
        });

        res.json({ 
            success: true, 
            sellerId,
            message: 'Vendedor criado com sucesso' 
        });
    } catch (error) {
        console.error('❌ Erro ao criar vendedor:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PUT /api/sellers/:id - Atualizar vendedor (apenas admin)
 */
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const sellerId = parseInt(req.params.id);
        const updates = req.body;

        await authService.updateSeller(req.session.userId, sellerId, updates);

        res.json({ 
            success: true, 
            message: 'Vendedor atualizado com sucesso' 
        });
    } catch (error) {
        console.error('❌ Erro ao atualizar vendedor:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * DELETE /api/sellers/:id - Deletar vendedor (apenas admin)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const sellerId = parseInt(req.params.id);

        await authService.deleteSeller(req.session.userId, sellerId);

        res.json({ 
            success: true, 
            message: 'Vendedor deletado com sucesso' 
        });
    } catch (error) {
        console.error('❌ Erro ao deletar vendedor:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/sellers/me - Obter dados do vendedor logado
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await authService.getUserById(req.session.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuário não encontrado' 
            });
        }

        // Remover senha do retorno
        const { password, ...userData } = user;
        res.json({ success: true, user: userData });
    } catch (error) {
        console.error('❌ Erro ao buscar dados do usuário:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
