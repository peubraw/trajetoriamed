/**
 * Menu Lateral Unificado - Trajetória Med
 * Componente de navegação para todas as páginas do sistema
 */

// Estrutura do menu
const menuItems = [
    {
        section: 'Principal',
        items: [
            { icon: '🏠', label: 'Dashboard', url: '/index.html', page: 'index' },
            { icon: '📊', label: 'CRM Dashboard', url: '/crm-dashboard.html', page: 'crm-dashboard' },
            { icon: '📋', label: 'CRM Kanban', url: '/crm-kanban.html', page: 'crm-kanban' }
        ]
    },
    {
        section: 'Configurações Bot',
        items: [
            { icon: '🤖', label: 'Configurar Bot', url: '/configurar-bot.html', page: 'configurar-bot' },
            { icon: '⚙️', label: 'Config. Completa', url: '/configuracao-completa.html', page: 'configuracao-completa' }
        ]
    },
    {
        section: 'CRM & Pipeline',
        items: [
            { icon: '🎯', label: 'Configurar Etapas', url: '/stages-config.html', page: 'stages-config' },
            { icon: '💳', label: 'Webhooks Pagamento', url: '/webhook-config.html', page: 'webhook-config' }
        ]
    },
    {
        section: 'Sistema',
        items: [
            { icon: '👤', label: 'Meu Perfil', url: '#', action: 'profile' },
            { icon: '🚪', label: 'Sair', url: '#', action: 'logout' }
        ]
    }
];

// Estado do menu (aberto/fechado)
let menuState = {
    isOpen: localStorage.getItem('menuOpen') !== 'false', // Padrão aberto
    currentPage: getCurrentPage()
};

/**
 * Obtém a página atual baseada na URL
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'index';
    return page;
}

/**
 * Renderiza o menu lateral
 */
function renderMenu() {
    const menuHTML = `
        <!-- Overlay para mobile -->
        <div id="menu-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden ${menuState.isOpen ? '' : 'hidden'}" 
             onclick="toggleMenu()"></div>
        
        <!-- Menu Lateral -->
        <aside id="sidebar" class="fixed top-0 left-0 h-full bg-white shadow-2xl z-50 transition-all duration-300 ${menuState.isOpen ? 'w-72' : 'w-20'} flex flex-col">
            
            <!-- Header do Menu -->
            <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                ${menuState.isOpen ? `
                    <div class="flex items-center space-x-3">
                        <span class="text-3xl">🏥</span>
                        <div class="flex flex-col">
                            <span class="font-black text-lg">Trajetória Med</span>
                            <span class="text-xs text-blue-200">Sistema CRM</span>
                        </div>
                    </div>
                ` : `
                    <span class="text-3xl mx-auto">🏥</span>
                `}
                <button onclick="toggleMenu()" class="p-2 hover:bg-blue-800 rounded-lg transition ${menuState.isOpen ? '' : 'hidden'}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Botão Toggle para quando fechado -->
            ${!menuState.isOpen ? `
                <button onclick="toggleMenu()" class="p-4 hover:bg-gray-100 transition flex justify-center">
                    <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            ` : ''}

            <!-- Itens do Menu -->
            <nav class="flex-1 overflow-y-auto p-4 space-y-6">
                ${menuItems.map(section => `
                    <div>
                        ${menuState.isOpen ? `
                            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">
                                ${section.section}
                            </h3>
                        ` : `
                            <div class="h-px bg-gray-200 my-4"></div>
                        `}
                        <div class="space-y-1">
                            ${section.items.map(item => {
                                const isActive = menuState.currentPage === item.page;
                                const activeClass = isActive ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-700' : 'text-gray-700 hover:bg-gray-100';
                                
                                return `
                                    <a href="${item.url}" 
                                       onclick="${item.action ? `handleMenuAction('${item.action}'); return false;` : ''}"
                                       class="flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${activeClass} ${menuState.isOpen ? '' : 'justify-center'}"
                                       title="${item.label}">
                                        <span class="text-2xl">${item.icon}</span>
                                        ${menuState.isOpen ? `
                                            <span class="text-sm font-medium">${item.label}</span>
                                        ` : ''}
                                    </a>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </nav>

            <!-- Footer do Menu -->
            <div class="p-4 border-t border-gray-200 bg-gray-50">
                ${menuState.isOpen ? `
                    <div class="flex items-center space-x-3 px-3 py-2">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold">
                            ${getInitials()}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-gray-900 truncate">${getUserName()}</p>
                            <p class="text-xs text-gray-500 truncate">${getUserEmail()}</p>
                        </div>
                    </div>
                ` : `
                    <div class="flex justify-center">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
                            ${getInitials()}
                        </div>
                    </div>
                `}
            </div>
        </aside>
    `;

    return menuHTML;
}

/**
 * Alterna o estado do menu (aberto/fechado)
 */
function toggleMenu() {
    menuState.isOpen = !menuState.isOpen;
    localStorage.setItem('menuOpen', menuState.isOpen);
    
    // Re-renderiza o menu
    document.getElementById('menu-container').innerHTML = renderMenu();
    
    // Ajusta o padding do conteúdo principal
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.marginLeft = menuState.isOpen ? '288px' : '80px';
    }
}

/**
 * Manipula ações do menu
 */
function handleMenuAction(action) {
    switch(action) {
        case 'profile':
            alert('Funcionalidade de perfil em desenvolvimento');
            break;
        case 'logout':
            if (confirm('Deseja realmente sair do sistema?')) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/index.html';
            }
            break;
    }
}

/**
 * Obtém as iniciais do usuário
 */
function getInitials() {
    const name = localStorage.getItem('userName') || 'Usuario';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

/**
 * Obtém o nome do usuário
 */
function getUserName() {
    return localStorage.getItem('userName') || 'Usuário';
}

/**
 * Obtém o email do usuário
 */
function getUserEmail() {
    return localStorage.getItem('userEmail') || 'usuario@exemplo.com';
}

/**
 * Inicializa o menu em todas as páginas
 */
function initMenu() {
    // Cria o container do menu se não existir
    if (!document.getElementById('menu-container')) {
        const menuContainer = document.createElement('div');
        menuContainer.id = 'menu-container';
        document.body.insertBefore(menuContainer, document.body.firstChild);
    }
    
    // Renderiza o menu
    document.getElementById('menu-container').innerHTML = renderMenu();
    
    // Ajusta o padding do conteúdo principal
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.marginLeft = menuState.isOpen ? '288px' : '80px';
        mainContent.style.transition = 'margin-left 0.3s';
    }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMenu);
} else {
    initMenu();
}

// Exporta funções para uso global
window.toggleMenu = toggleMenu;
window.handleMenuAction = handleMenuAction;
