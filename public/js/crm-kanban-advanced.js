// CRM Kanban Advanced Features
class CRMKanbanAdvanced {
    constructor() {
        this.socket = null;
        this.currentLead = null;
        this.stages = [];
    }

    // Inicializar sistema
    init() {
        this.loadStages();
        this.setupEventListeners();
        this.connectSocket();
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
            <div class="kanban-column bg-gray-50 rounded-lg p-4 min-w-80" data-stage-id="${stage.id}">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 rounded-full" style="background-color: ${stage.color}"></div>
                        <h3 class="font-semibold text-gray-800">${stage.name}</h3>
                        <span class="text-sm text-gray-500" id="count-${stage.id}">0</span>
                    </div>
                    <button onclick="crmAdvanced.editStage(${stage.id})" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
                <div id="stage-${stage.id}" class="lead-container space-y-3 min-h-96">
                    <!-- Cards dos leads serão inseridos aqui -->
                </div>
            </div>
        `).join('');

        this.initializeSortable();
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
        if (leadId) {
            this.loadLeadData(leadId);
        } else {
            this.currentLead = null;
            document.getElementById('lead-modal-title').textContent = 'Novo Lead';
            document.getElementById('lead-form').reset();
        }
        document.getElementById('lead-modal').classList.remove('hidden');
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
            document.getElementById('lead-state').value = data.lead.state || '';
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
            state: document.getElementById('lead-state').value,
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
                this.loadStages();
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
                    <span class="text-sm text-gray-500">${stage.order_position}</span>
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
            order_position: index
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
                    order_position: this.stages.length
                })
            });

            if (response.ok) {
                await this.loadStages();
                this.renderStagesList();
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
        } catch (error) {
            console.error('Erro ao atualizar nome:', error);
        }
    }

    // Deletar stage
    async deleteStage(stageId) {
        if (!confirm('Tem certeza que deseja excluir este stage? Os leads serão movidos para "Triagem".')) {
            return;
        }

        try {
            await fetch(`/api/crm/stages/${stageId}`, {
                method: 'DELETE'
            });
            await this.loadStages();
            this.renderStagesList();
            showToast('Stage removido com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao deletar stage:', error);
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
        this.socket.on('lead:updated', (data) => {
            this.loadStages();
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
