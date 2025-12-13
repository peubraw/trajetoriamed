/**
 * Script para sincronizar assigned_to das conversas com os leads
 * Corrige conversas que estão com assigned_to diferente do lead
 */

const db = require('../config/database');

async function syncConversations() {
    try {
        console.log('🔄 Sincronizando conversas com leads...\n');

        // Buscar todas as conversas
        const [conversations] = await db.query(`
            SELECT c.id, c.phone, c.assigned_to as conv_assigned, 
                   l.id as lead_id, l.assigned_to as lead_assigned, l.name as lead_name
            FROM crm_conversations c
            LEFT JOIN crm_leads l ON c.lead_id = l.id OR (c.phone = l.phone AND c.user_id = l.user_id)
        `);

        console.log(`📋 Total de conversas: ${conversations.length}\n`);

        let updated = 0;
        let errors = 0;

        for (const conv of conversations) {
            if (conv.lead_id) {
                // Verificar se precisa atualizar
                if (conv.conv_assigned !== conv.lead_assigned || !conv.lead_id) {
                    try {
                        await db.query(
                            `UPDATE crm_conversations 
                             SET assigned_to = ?, lead_id = ?, contact_name = ?
                             WHERE id = ?`,
                            [conv.lead_assigned, conv.lead_id, conv.lead_name, conv.id]
                        );

                        console.log(`✅ Conversa ${conv.id} (${conv.phone}): assigned_to ${conv.conv_assigned} → ${conv.lead_assigned}`);
                        updated++;
                    } catch (error) {
                        console.error(`❌ Erro ao atualizar conversa ${conv.id}:`, error.message);
                        errors++;
                    }
                }
            } else {
                console.log(`⚠️  Conversa ${conv.id} (${conv.phone}): sem lead vinculado`);
            }
        }

        console.log(`\n📊 Resumo:`);
        console.log(`   ✅ Atualizadas: ${updated}`);
        console.log(`   ❌ Erros: ${errors}`);
        console.log(`   ℹ️  Sem alteração: ${conversations.length - updated - errors}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao sincronizar:', error);
        process.exit(1);
    }
}

syncConversations();
