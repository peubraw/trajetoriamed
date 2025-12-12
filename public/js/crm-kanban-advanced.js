// CRM Kanban Advanced Features
class CRMKanbanAdvanced {
    constructor() {
        this.socket = null;
        this.currentLead = null;
        this.stages = [];
        this.sellers = [];
        this.currentUserId = null;
    }

    // Inicializar sistema
    async init() {
        await this.checkAuth();
        this.loadStages();
        this.loadSellers();
        this.setupEventListeners();
        this.connectSocket();
    }

    // Verificar autenticação
    async checkAuth() {
        try {
            const response = await fetch('/api/auth/check', {
                credentials: 'include'
            });
            if (!response.ok) {
                window.location.href = '/login.html';
                return;
            }
            
            const data = await response.json();
            if (!data.authenticated) {
                window.location.href = '/login.html';
                return;
            }
            
            // Salvar userId para usar no socket
            this.currentUserId = data.user.id;
            console.log('🔐 Autenticado como:', data.user.name, 'userId:', this.currentUserId);
            
        } catch (error) {
            window.location.href = '/login.html';
        }
    }

    // Carregar vendedores do banco
    async loadSellers() {
        try {
            const response = await fetch('/api/sellers', { credentials: 'include' });
            if (!response.ok) return;
            
            const data = await response.json();
            this.sellers = data.sellers || [];
            console.log('📋 Vendedores carregados:', this.sellers.length);
        } catch (error) {
            console.error('Erro ao carregar vendedores:', error);
        }
    }

    // Carregar stages do banco
    async loadStages() {
        try {
            const response = await fetch('/api/crm/stages');
            const data = await response.json();
            this.stages = data.stages || [];
            this.renderKanbanColumns();
        } catch (error) {
            console.error('Erro ao carregar stages:', error);
        }
    }

    // Renderizar colunas do Kanban
    renderKanbanColumns() {
        const container = document.getElementById('kanban-container');
        if (!container) return;

        container.innerHTML = this.stages.map(stage => `
            <div class="kanban-column bg-gray-50 rounded-lg p-4" style="min-width: 320px;" data-stage-id="${stage.id}">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 rounded-full" style="background-color: ${stage.color}"></div>
                        <h3 class="font-semibold text-gray-800">${stage.name}</h3>
                        <span class="text-sm text-gray-500" id="count-${stage.id}">0</span>
                    </div>
                </div>
                <div id="stage-${stage.id}" class="lead-container space-y-3" style="min-height: 400px;">
                    <!-- Cards dos leads serão inseridos aqui -->
                </div>
            </div>
        `).join('');

        this.initializeSortable();
        this.loadLeads();
    }

    // Carregar e renderizar leads
    async loadLeads() {
        try {
            console.log('🔄 Carregando leads... userId:', this.currentUserId);
            const response = await fetch('/api/crm/leads', { credentials: 'include' });
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                console.error('❌ Falha ao carregar leads:', response.status);
                return;
            }
            
            const data = await response.json();
            console.log('📦 Data recebida:', data);
            
            const leads = Array.isArray(data) ? data : (data.leads || []);
            console.log('📋 Total de leads:', leads.length);
            
            // Limpar colunas
            this.stages.forEach(stage => {
                const column = document.getElementById(`stage-${stage.id}`);
                if (column) column.innerHTML = '';
            });
            
            // Adicionar leads
            leads.forEach(lead => {
                console.log('📄 Adicionando lead:', lead.name, 'stage:', lead.stage_id);
                this.addLeadCard(lead);
            });
            
            // Atualizar total
            const totalEl = document.getElementById('totalLeads');
            if (totalEl) totalEl.textContent = leads.length;
            
            console.log('✅ Leads carregados com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao carregar leads:', error);
        }
    }

    // Adicionar card de lead
    addLeadCard(lead) {
        const column = document.getElementById(`stage-${lead.stage_id}`);
        if (!column) {
            console.warn('⚠️ Coluna não encontrada para stage_id:', lead.stage_id, '- Lead:', lead.name);
            // Tentar adicionar na primeira stage disponível
            if (this.stages.length > 0) {
                console.log('🔄 Movendo lead para primeira stage disponível:', this.stages[0].id);
                lead.stage_id = this.stages[0].id;
                // Atualizar no banco também
                this.moveLeadToStage(lead.id, this.stages[0].id);
                return this.addLeadCard(lead); // Tentar novamente com nova stage
            }
            return;
        }
        
        const card = document.createElement('div');
        card.className = 'lead-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md cursor-move';
        card.dataset.leadId = lead.id;
        
        card.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-gray-800 text-sm cursor-pointer hover:text-blue-600" onclick="crmAdvanced.openLeadModal(${lead.id})">${lead.name || 'Sem nome'}</h4>
                <button onclick="event.stopPropagation(); crmAdvanced.deleteLead(${lead.id})" 
                        class="text-gray-400 hover:text-red-500">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
            ${lead.phone ? `<p class="text-xs text-gray-500 mb-1"><i class="fas fa-phone mr-1"></i> ${lead.phone}</p>` : ''}
            ${lead.email ? `<p class="text-xs text-gray-500 mb-1"><i class="fas fa-envelope mr-1"></i> ${lead.email}</p>` : ''}
            ${lead.interested_course ? `<span class="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">${lead.interested_course}</span>` : ''}
        `;
        
        column.appendChild(card);
        
        // Atualizar contador
        const count = column.querySelectorAll('.lead-card').length;
        const countEl = document.getElementById(`count-${lead.stage_id}`);
        if (countEl) countEl.textContent = count;
    }

    // Deletar lead
    async deleteLead(leadId) {
        if (!confirm('Deseja realmente excluir este lead?')) return;
        
        try {
            await fetch(`/api/crm/leads/${leadId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            this.loadLeads();
            showToast('Lead excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao deletar lead:', error);
            showToast('Erro ao excluir lead', 'error');
        }
    }

    // Inicializar drag & drop
    initializeSortable() {
        this.stages.forEach(stage => {
            const container = document.getElementById(`stage-${stage.id}`);
            if (!container) return;

            new Sortable(container, {
                group: 'leads',
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                onEnd: (evt) => {
                    const leadId = evt.item.dataset.leadId;
                    const newStageId = evt.to.closest('.kanban-column').dataset.stageId;
                    this.moveLeadToStage(leadId, newStageId);
                }
            });
        });
    }

    // Mover lead para outro stage
    async moveLeadToStage(leadId, newStageId) {
        try {
            await fetch(`/api/crm/leads/${leadId}/stage`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stageId: newStageId })
            });
        } catch (error) {
            console.error('Erro ao mover lead:', error);
        }
    }

    // Abrir modal de edição de lead
    openLeadModal(leadId = null) {
        // Popular select de vendedores
        this.populateSellersSelect();
        
        if (leadId) {
            this.loadLeadData(leadId);
        } else {
            this.currentLead = null;
            document.getElementById('lead-modal-title').textContent = 'Novo Lead';
            document.getElementById('lead-form').reset();
        }
        document.getElementById('lead-modal').classList.remove('hidden');
    }

    // Popular select de vendedores
    populateSellersSelect() {
        const select = document.getElementById('lead-assigned-to');
        if (!select) return;
        
        // Limpar opções antigas (exceto "Não atribuído")
        select.innerHTML = '<option value="">Não atribuído</option>';
        
        // Adicionar vendedores
        this.sellers.forEach(seller => {
            const option = document.createElement('option');
            option.value = seller.id;
            option.textContent = seller.name;
            select.appendChild(option);
        });
    }

    // Carregar dados do lead
    async loadLeadData(leadId) {
        try {
            const response = await fetch(`/api/crm/leads/${leadId}`);
            const data = await response.json();
            this.currentLead = data.lead;

            document.getElementById('lead-modal-title').textContent = 'Editar Lead';
            document.getElementById('lead-name').value = data.lead.name || '';
            document.getElementById('lead-phone').value = data.lead.phone || '';
            document.getElementById('lead-email').value = data.lead.email || '';
            document.getElementById('lead-assigned-to').value = data.lead.assigned_to || '';
            document.getElementById('lead-interested-course').value = data.lead.interested_course || '';
            document.getElementById('lead-specialty').value = data.lead.specialty || '';
            document.getElementById('lead-rqe').value = data.lead.rqe || '';
            document.getElementById('lead-notes').value = data.lead.notes || '';
        } catch (error) {
            console.error('Erro ao carregar lead:', error);
        }
    }

    // Salvar lead
    async saveLead(event) {
        event.preventDefault();
        
        const formData = {
            name: document.getElementById('lead-name').value,
            phone: document.getElementById('lead-phone').value,
            email: document.getElementById('lead-email').value,
            assigned_to: document.getElementById('lead-assigned-to').value || null,
            interested_course: document.getElementById('lead-interested-course').value,
            specialty: document.getElementById('lead-specialty').value,
            rqe: document.getElementById('lead-rqe').value,
            notes: document.getElementById('lead-notes').value
        };

        try {
            const url = this.currentLead 
                ? `/api/crm/leads/${this.currentLead.id}` 
                : '/api/crm/leads';
            
            const method = this.currentLead ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.closeLeadModal();
                this.loadLeads();
                showToast('Lead salvo com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Erro ao salvar lead:', error);
            showToast('Erro ao salvar lead', 'error');
        }
    }

    // Fechar modal de lead
    closeLeadModal() {
        document.getElementById('lead-modal').classList.add('hidden');
        this.currentLead = null;
    }

    // Abrir modal de gerenciamento de stages
    openStagesModal() {
        this.renderStagesList();
        document.getElementById('stages-modal').classList.remove('hidden');
    }

    // Renderizar lista de stages
    renderStagesList() {
        const container = document.getElementById('stages-list');
        container.innerHTML = this.stages.map((stage, index) => `
            <div class="stage-item bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between" data-stage-id="${stage.id}">
                <div class="flex items-center space-x-4 flex-1">
                    <button class="drag-handle cursor-move text-gray-400 hover:text-gray-600">
                        <i class="fas fa-grip-vertical"></i>
                    </button>
                    <input type="color" value="${stage.color}" 
                           onchange="crmAdvanced.updateStageColor(${stage.id}, this.value)"
                           class="w-10 h-10 rounded cursor-pointer">
                    <input type="text" value="${stage.name}" 
                           onchange="crmAdvanced.updateStageName(${stage.id}, this.value)"
                           class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <span class="text-sm text-gray-500">#${stage.position}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="crmAdvanced.deleteStage(${stage.id})" 
                            class="text-red-500 hover:text-red-700 px-3 py-2">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.initializeStagesSortable();
    }

    // Inicializar drag & drop de stages
    initializeStagesSortable() {
        const container = document.getElementById('stages-list');
        new Sortable(container, {
            handle: '.drag-handle',
            animation: 150,
            onEnd: (evt) => {
                this.updateStagesOrder();
            }
        });
    }

    // Atualizar ordem dos stages
    async updateStagesOrder() {
        const stageElements = document.querySelectorAll('.stage-item');
        const order = Array.from(stageElements).map((el, index) => ({
            id: el.dataset.stageId,
            order_position: index + 1
        }));

        try {
            await fetch('/api/crm/stages/order', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stages: order })
            });
        } catch (error) {
            console.error('Erro ao atualizar ordem:', error);
        }
    }

    // Criar novo stage
    async createStage() {
        const name = prompt('Nome do novo stage:');
        if (!name) return;

        try {
            const response = await fetch('/api/crm/stages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    color: '#' + Math.floor(Math.random()*16777215).toString(16),
                    position: this.stages.length + 1
                })
            });

            if (response.ok) {
                await this.loadStages();
                this.renderStagesList();
                this.renderKanbanColumns(); // Atualizar Kanban também
                showToast('Stage criado com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Erro ao criar stage:', error);
        }
    }

    // Atualizar cor do stage
    async updateStageColor(stageId, color) {
        try {
            await fetch(`/api/crm/stages/${stageId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ color })
            });
            await this.loadStages();
            this.renderKanbanColumns(); // Atualizar Kanban
        } catch (error) {
            console.error('Erro ao atualizar cor:', error);
        }
    }

    // Atualizar nome do stage
    async updateStageName(stageId, name) {
        try {
            await fetch(`/api/crm/stages/${stageId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            await this.loadStages();
            this.renderKanbanColumns(); // Atualizar Kanban
        } catch (error) {
            console.error('Erro ao atualizar nome:', error);
        }
    }

    // Deletar stage
    async deleteStage(stageId) {
        if (!confirm('Tem certeza que deseja excluir este stage? Os leads serão movidos para o primeiro estágio.')) {
            return;
        }

        try {
            // Encontrar o primeiro stage disponível (diferente do que está sendo deletado)
            const targetStage = this.stages.find(s => s.id != stageId);
            
            if (!targetStage) {
                showToast('Erro: Precisa ter pelo menos um estágio no sistema', 'error');
                return;
            }

            await fetch(`/api/crm/stages/${stageId}?moveLeadsToStageId=${targetStage.id}`, {
                method: 'DELETE'
            });
            
            await this.loadStages();
            this.renderStagesList();
            this.renderKanbanColumns(); // Atualizar Kanban também
            showToast('Stage removido com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao deletar stage:', error);
            showToast('Erro ao deletar stage', 'error');
        }
    }

    // Fechar modal de stages
    closeStagesModal() {
        document.getElementById('stages-modal').classList.add('hidden');
        this.loadStages();
    }

    // Conectar WebSocket
    connectSocket() {
        this.socket = io();
        this.socket.emit('join-crm', this.currentUserId);
        this.socket.on('lead:updated', () => {
            this.loadLeads();
        });
        this.socket.on('crm-update', () => {
            this.loadLeads();
        });
    }

    // Event listeners
    setupEventListeners() {
        document.getElementById('lead-form')?.addEventListener('submit', (e) => this.saveLead(e));
    }
}

// Toast notifications
function showToast(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };

    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Inicializar
const crmAdvanced = new CRMKanbanAdvanced();
document.addEventListener('DOMContentLoaded', () => crmAdvanced.init());
