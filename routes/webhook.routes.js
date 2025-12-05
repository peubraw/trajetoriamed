const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * WEBHOOK KIWIFY
 * POST /api/webhooks/kiwify
 * 
 * Payload esperado:
 * {
 *   "order_id": "ABC123",
 *   "order_status": "paid",
 *   "customer_email": "cliente@email.com",
 *   "customer_phone": "5511999999999",
 *   "product_name": "Pós Medicina do Trabalho",
 *   "product_value": "2197.00",
 *   "seller_email": "vendedor@email.com",
 *   "created_at": "2025-12-05T10:30:00Z"
 * }
 */
router.post('/kiwify', async (req, res) => {
    try {
        const payload = req.body;
        console.log('📥 Webhook Kiwify recebido:', JSON.stringify(payload, null, 2));

        // Validar campos obrigatórios
        if (!payload.order_id || !payload.order_status) {
            return res.status(400).json({ success: false, message: 'Campos obrigatórios ausentes' });
        }

        // Registrar webhook recebido
        const [webhookLog] = await db.execute(
            `INSERT INTO crm_webhook_logs 
            (gateway, event_type, payload, processing_status) 
            VALUES (?, ?, ?, ?)`,
            ['kiwify', payload.order_status, JSON.stringify(payload), 'pending']
        );

        const webhookLogId = webhookLog.insertId;

        // Processar apenas pagamentos aprovados
        if (payload.order_status === 'paid' || payload.order_status === 'approved') {
            await processKiwifyPurchase(payload, webhookLogId);
        }

        // Responder imediatamente (Kiwify espera 200 OK)
        res.status(200).json({ success: true, message: 'Webhook processado' });

    } catch (error) {
        console.error('❌ Erro ao processar webhook Kiwify:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * WEBHOOK HOTMART
 * POST /api/webhooks/hotmart
 * 
 * Payload esperado:
 * {
 *   "id": "abc-123",
 *   "event": "PURCHASE_COMPLETE",
 *   "data": {
 *     "buyer": {
 *       "email": "cliente@email.com",
 *       "phone": "5511999999999"
 *     },
 *     "purchase": {
 *       "transaction": "HOT-XYZ",
 *       "status": "approved",
 *       "price": {
 *         "value": 2197.00
 *       }
 *     },
 *     "product": {
 *       "name": "Pós Medicina do Trabalho"
 *     }
 *   }
 * }
 */
router.post('/hotmart', async (req, res) => {
    try {
        const payload = req.body;
        console.log('📥 Webhook Hotmart recebido:', JSON.stringify(payload, null, 2));

        if (!payload.event || !payload.data) {
            return res.status(400).json({ success: false, message: 'Payload inválido' });
        }

        // Registrar webhook
        const [webhookLog] = await db.execute(
            `INSERT INTO crm_webhook_logs 
            (gateway, event_type, payload, processing_status) 
            VALUES (?, ?, ?, ?)`,
            ['hotmart', payload.event, JSON.stringify(payload), 'pending']
        );

        const webhookLogId = webhookLog.insertId;

        // Processar compra aprovada
        if (payload.event === 'PURCHASE_COMPLETE' || payload.event === 'PURCHASE_APPROVED') {
            await processHotmartPurchase(payload, webhookLogId);
        }

        res.status(200).json({ success: true, message: 'Webhook processado' });

    } catch (error) {
        console.error('❌ Erro ao processar webhook Hotmart:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Processar compra da Kiwify
 */
async function processKiwifyPurchase(payload, webhookLogId) {
    try {
        // Limpar telefone (remover caracteres especiais)
        const phone = payload.customer_phone?.replace(/\D/g, '');
        
        if (!phone) {
            throw new Error('Telefone do cliente não fornecido');
        }

        // Buscar lead pelo telefone
        const [leads] = await db.execute(
            `SELECT id, stage_id, assigned_to, potential_value FROM crm_leads WHERE phone = ? LIMIT 1`,
            [phone]
        );

        if (leads.length === 0) {
            throw new Error(`Lead não encontrado para telefone: ${phone}`);
        }

        const lead = leads[0];

        // Buscar estágio "Venda Confirmada"
        const [successStages] = await db.execute(
            `SELECT id FROM crm_stages WHERE is_success = 1 ORDER BY position ASC LIMIT 1`
        );

        if (successStages.length === 0) {
            throw new Error('Estágio de sucesso não configurado');
        }

        const successStageId = successStages[0].id;
        const saleValue = parseFloat(payload.product_value) || lead.potential_value || 0;

        // 1. Mover lead para "Venda Confirmada"
        await db.execute(
            `UPDATE crm_leads 
            SET stage_id = ?, 
                potential_value = ?,
                last_activity_at = NOW(),
                updated_at = NOW()
            WHERE id = ?`,
            [successStageId, saleValue, lead.id]
        );

        // 2. Registrar atividade
        await db.execute(
            `INSERT INTO crm_activities 
            (lead_id, activity_type, description, metadata) 
            VALUES (?, ?, ?, ?)`,
            [
                lead.id,
                'note',
                `💰 Venda confirmada via Kiwify - Pedido: ${payload.order_id}`,
                JSON.stringify({ gateway: 'kiwify', order_id: payload.order_id, value: saleValue })
            ]
        );

        // 3. Criar registro de comissão (10% padrão)
        if (lead.assigned_to) {
            const commissionRate = 10.00;
            const commissionAmount = (saleValue * commissionRate) / 100;

            await db.execute(
                `INSERT INTO crm_commissions 
                (lead_id, seller_user_id, sale_value, commission_rate, commission_amount, 
                status, payment_gateway, transaction_id, sale_date, approved_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    lead.id,
                    lead.assigned_to,
                    saleValue,
                    commissionRate,
                    commissionAmount,
                    'approved',
                    'kiwify',
                    payload.order_id
                ]
            );

            console.log(`💰 Comissão criada: R$ ${commissionAmount.toFixed(2)} para vendedor ${lead.assigned_to}`);
        }

        // 4. Marcar webhook como processado
        await db.execute(
            `UPDATE crm_webhook_logs 
            SET processing_status = 'processed', 
                lead_id = ?,
                processed_at = NOW() 
            WHERE id = ?`,
            [lead.id, webhookLogId]
        );

        // 5. Emitir evento Socket.IO
        if (global.io) {
            global.io.to(`crm-${lead.assigned_to}`).emit('sale-confirmed', {
                leadId: lead.id,
                value: saleValue,
                commission: (saleValue * 10) / 100
            });
        }

        console.log(`✅ Venda processada: Lead ${lead.id} movido para Venda Confirmada`);

    } catch (error) {
        console.error('❌ Erro ao processar compra Kiwify:', error);
        
        // Marcar webhook como falho
        await db.execute(
            `UPDATE crm_webhook_logs 
            SET processing_status = 'failed', 
                error_message = ?,
                processed_at = NOW() 
            WHERE id = ?`,
            [error.message, webhookLogId]
        );

        throw error;
    }
}

/**
 * Processar compra da Hotmart
 */
async function processHotmartPurchase(payload, webhookLogId) {
    try {
        const buyer = payload.data?.buyer;
        const purchase = payload.data?.purchase;
        const product = payload.data?.product;

        if (!buyer || !purchase) {
            throw new Error('Dados de compra incompletos');
        }

        const phone = buyer.phone?.replace(/\D/g, '');
        
        if (!phone) {
            throw new Error('Telefone do cliente não fornecido');
        }

        // Buscar lead
        const [leads] = await db.execute(
            `SELECT id, stage_id, assigned_to, potential_value FROM crm_leads WHERE phone = ? LIMIT 1`,
            [phone]
        );

        if (leads.length === 0) {
            throw new Error(`Lead não encontrado para telefone: ${phone}`);
        }

        const lead = leads[0];

        // Buscar estágio de sucesso
        const [successStages] = await db.execute(
            `SELECT id FROM crm_stages WHERE is_success = 1 LIMIT 1`
        );

        if (successStages.length === 0) {
            throw new Error('Estágio de sucesso não configurado');
        }

        const successStageId = successStages[0].id;
        const saleValue = parseFloat(purchase.price?.value) || lead.potential_value || 0;

        // Mover lead para "Venda Confirmada"
        await db.execute(
            `UPDATE crm_leads 
            SET stage_id = ?, 
                potential_value = ?,
                last_activity_at = NOW(),
                updated_at = NOW()
            WHERE id = ?`,
            [successStageId, saleValue, lead.id]
        );

        // Registrar atividade
        await db.execute(
            `INSERT INTO crm_activities 
            (lead_id, activity_type, description, metadata) 
            VALUES (?, ?, ?, ?)`,
            [
                lead.id,
                'note',
                `💰 Venda confirmada via Hotmart - Transação: ${purchase.transaction}`,
                JSON.stringify({ gateway: 'hotmart', transaction: purchase.transaction, value: saleValue })
            ]
        );

        // Criar comissão
        if (lead.assigned_to) {
            const commissionRate = 10.00;
            const commissionAmount = (saleValue * commissionRate) / 100;

            await db.execute(
                `INSERT INTO crm_commissions 
                (lead_id, seller_user_id, sale_value, commission_rate, commission_amount, 
                status, payment_gateway, transaction_id, sale_date, approved_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    lead.id,
                    lead.assigned_to,
                    saleValue,
                    commissionRate,
                    commissionAmount,
                    'approved',
                    'hotmart',
                    purchase.transaction
                ]
            );

            console.log(`💰 Comissão criada: R$ ${commissionAmount.toFixed(2)}`);
        }

        // Marcar webhook como processado
        await db.execute(
            `UPDATE crm_webhook_logs 
            SET processing_status = 'processed', 
                lead_id = ?,
                processed_at = NOW() 
            WHERE id = ?`,
            [lead.id, webhookLogId]
        );

        // Emitir evento Socket.IO
        if (global.io) {
            global.io.to(`crm-${lead.assigned_to}`).emit('sale-confirmed', {
                leadId: lead.id,
                value: saleValue,
                commission: (saleValue * 10) / 100
            });
        }

        console.log(`✅ Venda Hotmart processada: Lead ${lead.id}`);

    } catch (error) {
        console.error('❌ Erro ao processar compra Hotmart:', error);
        
        await db.execute(
            `UPDATE crm_webhook_logs 
            SET processing_status = 'failed', 
                error_message = ?,
                processed_at = NOW() 
            WHERE id = ?`,
            [error.message, webhookLogId]
        );

        throw error;
    }
}

/**
 * GET /api/webhooks/logs - Ver histórico de webhooks recebidos
 */
router.get('/logs', async (req, res) => {
    try {
        const userId = req.session?.userId || 1;
        
        const [logs] = await db.execute(
            `SELECT 
                wl.*,
                l.name as lead_name,
                l.phone as lead_phone
            FROM crm_webhook_logs wl
            LEFT JOIN crm_leads l ON wl.lead_id = l.id
            WHERE l.user_id = ? OR wl.lead_id IS NULL
            ORDER BY wl.created_at DESC
            LIMIT 100`,
            [userId]
        );

        res.json({ success: true, logs });

    } catch (error) {
        console.error('Erro ao buscar logs de webhooks:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
