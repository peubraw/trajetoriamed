const authService = require('../services/auth.service');

/**
 * Middleware: Verificar se usuário está autenticado
 */
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            message: 'Não autenticado' 
        });
    }
    next();
};

/**
 * Middleware: Verificar se usuário é admin
 */
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Não autenticado' 
            });
        }

        const isAdmin = await authService.isAdmin(req.session.userId);
        if (!isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acesso negado. Apenas administradores podem executar esta ação.' 
            });
        }

        next();
    } catch (error) {
        console.error('❌ Erro no middleware requireAdmin:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erro ao verificar permissões' 
        });
    }
};

/**
 * Middleware: Verificar se usuário pode acessar um lead específico
 */
const canAccessLead = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Não autenticado' 
            });
        }

        const leadId = req.params.id || req.params.leadId || req.body.leadId;
        if (!leadId) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID do lead não fornecido' 
            });
        }

        const hasAccess = await authService.canAccessLead(req.session.userId, leadId);
        if (!hasAccess) {
            return res.status(403).json({ 
                success: false, 
                message: 'Você não tem permissão para acessar este lead' 
            });
        }

        next();
    } catch (error) {
        console.error('❌ Erro no middleware canAccessLead:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erro ao verificar acesso ao lead' 
        });
    }
};

/**
 * Middleware: Adicionar informações do usuário na requisição
 */
const attachUserInfo = async (req, res, next) => {
    try {
        if (req.session.userId) {
            const user = await authService.getUserById(req.session.userId);
            req.user = user;
        }
        next();
    } catch (error) {
        console.error('❌ Erro ao anexar informações do usuário:', error);
        next(); // Continuar mesmo com erro
    }
};

module.exports = {
    requireAuth,
    requireAdmin,
    canAccessLead,
    attachUserInfo
};
