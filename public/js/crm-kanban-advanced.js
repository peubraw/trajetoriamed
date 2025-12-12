// CRM Kanban Advanced Features
class CRMKanbanAdvanced {
    constructor() {
        this.socket = null;
        this.currentLead = null;
        this.currentStageId = null;
        this.stages = [];
        this.sellers = [];
        this.currentUserId = null;
        this.allLeads = [];
    }

    // Inicializar sistema
    async init() {
        await this.checkAuth();
        this.loadStages();
        this.loadSellers();
        this.setupEventListeners();
        this.connectSocket();
        this.setupSearch();
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
            console.log('🔄 Carregando stages...');
            const response = await fetch('/api/crm/stages');
            const data = await response.json();
            this.stages = data.stages || [];
            console.log('✅ Stages carregadas:', this.stages.length);
            
            // Aguardar um pouco para garantir que DOM está pronto
            setTimeout(() => this.renderKanbanColumns(), 100);
        } catch (error) {
            console.error('❌ Erro ao carregar stages:', error);
        }
    }

    // Renderizar colunas do Kanban
    renderKanbanColumns() {
        const container = document.getElementById('kanban-container');
        if (!container) {
            console.error('❌ ERRO: Elemento kanban-container não encontrado! Verifique se o HTML está carregado.');
            // Tentar novamente após 500ms
            setTimeout(() => {
                const retry = document.getElementById('kanban-container');
                if (retry) {
                    console.log('✅ Elemento encontrado na segunda tentativa');
                    this.renderKanbanColumns();
                }
            }, 500);
            return;
        }

        if (!this.stages || this.stages.length === 0) {
            console.warn('⚠️ Nenhuma stage disponível para renderizar');
            container.innerHTML = '<p class="text-gray-500 p-8">Nenhum estágio configurado. Clique em "Gerenciar Estágios" para criar.</p>';
            return;
        }

        console.log('📊 Renderizando', this.stages.length, 'colunas');
        try {
            container.innerHTML = this.stages.map(stage => `
            <div class="kanban-column p-0 overflow-hidden" style="min-width: 340px; max-width: 340px;" data-stage-id="${stage.id}">
                <div class="kanban-column-header px-4 py-3.5 sticky top-0 z-10">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2.5">
                            <div class="w-2.5 h-2.5 rounded-full shadow-sm" style="background-color: ${stage.color}"></div>
                            <h3 class="font-bold text-gray-800 text-sm">${stage.name}</h3>
                        </div>
                        <button class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-all">
                            <i class="fas fa-ellipsis-h text-xs"></i>
                        </button>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="badge bg-gray-100 text-gray-600 text-xs">
                            <i class="fas fa-layer-group mr-1"></i>
                            <span id="count-${stage.id}">0</span> leads
                        </span>
                        <button onclick="crmAdvanced.openLeadModalForStage(${stage.id})" 
                                class="text-gray-400 hover:text-indigo-600 transition-all p-1" 
                                title="Adicionar lead neste estágio">
                            <i class="fas fa-plus text-xs"></i>
                        </button>
                    </div>
                </div>
                <div id="stage-${stage.id}" class="lead-container px-4 py-3 overflow-y-auto" style="max-height: calc(100vh - 350px);">
                    <!-- Cards dos leads serão inseridos aqui -->
                </div>
            </div>
        `).join('');

            this.initializeSortable();
            this.loadLeads();
            console.log('✅ Colunas renderizadas com sucesso');
        } catch (error) {
            console.error('❌ Erro ao renderizar colunas:', error);
        }
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
            
            // Salvar todos os leads para busca
            this.allLeads = leads;
            
            // Renderizar leads
            this.renderLeadsInColumns(leads);
            
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
        card.className = 'lead-card rounded-xl p-4 mb-3 group cursor-pointer';
        card.dataset.leadId = lead.id;
        card.onclick = (e) => {
            // Não abrir se clicou no botão de deletar
            if (e.target.closest('button')) return;
            crmAdvanced.openLeadModal(lead.id);
        };
        
        // Determinar cor do avatar baseado no nome
        const avatarColors = [
            'from-blue-500 to-blue-600',
            'from-green-500 to-green-600',
            'from-purple-500 to-purple-600',
            'from-pink-500 to-pink-600',
            'from-orange-500 to-orange-600',
            'from-teal-500 to-teal-600'
        ];
        const colorIndex = (lead.name || '').charCodeAt(0) % avatarColors.length;
        const avatarColor = avatarColors[colorIndex];
        
        // Iniciais do nome
        const initials = (lead.name || 'SN').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        // Badge do curso com cores específicas
        const courseBadges = {
            'Perícia Médica': 'bg-blue-100 text-blue-700',
            'Auditoria': 'bg-green-100 text-green-700',
            'Medicina do Trabalho': 'bg-purple-100 text-purple-700',
            'Combo': 'bg-orange-100 text-orange-700'
        };
        const badgeClass = courseBadges[lead.interested_course] || 'bg-gray-100 text-gray-700';
        
        card.innerHTML = `
            <div class="flex items-start space-x-3 mb-3">
                <div class="avatar w-10 h-10 text-white text-xs shadow-md bg-gradient-to-br ${avatarColor} flex-shrink-0">
                    ${initials}
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-gray-900 text-sm truncate mb-1" title="${lead.name || 'Sem nome'}">
                        ${lead.name || 'Sem nome'}
                    </h4>
                    ${lead.phone ? `
                    <div class="flex items-center text-xs text-gray-500 mb-1">
                        <i class="fas fa-phone w-3.5 mr-1.5 text-gray-400"></i>
                        <span class="truncate">${lead.phone}</span>
                    </div>` : ''}
                    ${lead.email ? `
                    <div class="flex items-center text-xs text-gray-500 mb-1">
                        <i class="fas fa-envelope w-3.5 mr-1.5 text-gray-400"></i>
                        <span class="truncate">${lead.email}</span>
                    </div>` : ''}
                </div>
                <button onclick="event.stopPropagation(); crmAdvanced.deleteLead(${lead.id})" 
                        class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
            
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                ${lead.interested_course ? `
                <span class="badge ${badgeClass} text-xs">
                    <i class="fas fa-graduation-cap mr-1"></i>${lead.interested_course}
                </span>` : '<span></span>'}
                ${lead.assigned_to ? `
                <div class="flex items-center text-xs text-gray-400">
                    <i class="fas fa-user-tie mr-1"></i>
                    <span class="truncate" title="${lead.assigned_name || 'Vendedor'}">${lead.assigned_name || 'Vendedor'}</span>
                </div>` : ''}
            </div>
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
            this.currentStageId = null;
            document.getElementById('lead-modal-title').textContent = 'Novo Lead';
            document.getElementById('lead-form').reset();
        }
        document.getElementById('lead-modal').classList.remove('hidden');
    }
    
    // Abrir modal de lead para estágio específico
    openLeadModalForStage(stageId) {
        this.currentStageId = stageId;
        this.openLeadModal();
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
        
        // Se foi criado a partir de uma coluna específica, define o stage
        if (!this.currentLead && this.currentStageId) {
            formData.stage_id = this.currentStageId;
        }

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
        if (!container) {
            console.warn('⚠️ Elemento stages-list não encontrado');
            return;
        }
        
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
    
    // Configurar busca
    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterLeads(e.target.value);
            }, 300);
        });
    }
    
    // Filtrar leads pela busca
    filterLeads(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            // Mostrar todos os leads
            this.renderLeadsInColumns(this.allLeads);
            return;
        }
        
        // Filtrar leads
        const filtered = this.allLeads.filter(lead => {
            return (
                (lead.name || '').toLowerCase().includes(term) ||
                (lead.phone || '').toLowerCase().includes(term) ||
                (lead.email || '').toLowerCase().includes(term) ||
                (lead.interested_course || '').toLowerCase().includes(term)
            );
        });
        
        this.renderLeadsInColumns(filtered);
    }
    
    // Renderizar leads nas colunas (separado para permitir filtragem)
    renderLeadsInColumns(leads) {
        // Limpar todas as colunas
        this.stages.forEach(stage => {
            const container = document.getElementById(`stage-${stage.id}`);
            if (container) {
                container.innerHTML = '';
            }
        });
        
        // Adicionar leads filtrados
        leads.forEach(lead => this.addLeadCard(lead));
        
        // Atualizar contador total
        const totalLeadsEl = document.getElementById('totalLeads');
        if (totalLeadsEl) totalLeadsEl.textContent = leads.length;
    }
}

// Toast notifications melhorado
function showToast(message, type = 'info') {
    const config = {
        success: {
            bg: 'bg-gradient-to-r from-green-500 to-green-600',
            icon: 'fa-check-circle',
            iconColor: 'text-white'
        },
        error: {
            bg: 'bg-gradient-to-r from-red-500 to-red-600',
            icon: 'fa-exclamation-circle',
            iconColor: 'text-white'
        },
        info: {
            bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
            icon: 'fa-info-circle',
            iconColor: 'text-white'
        }
    };

    const settings = config[type] || config.info;
    
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 ${settings.bg} text-white px-5 py-4 rounded-xl shadow-2xl z-50 transform transition-all duration-300 flex items-center space-x-3 max-w-md`;
    toast.style.transform = 'translateX(400px)';
    toast.innerHTML = `
        <i class="fas ${settings.icon} ${settings.iconColor} text-lg"></i>
        <span class="font-medium">${message}</span>
    `;
    
    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);

    // Animar saída
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Inicializar
const crmAdvanced = new CRMKanbanAdvanced();
document.addEventListener('DOMContentLoaded', () => crmAdvanced.init());
