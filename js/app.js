// js/app.js
import { loadCurrentUser, isAuthenticated, updateAuthUI } from './auth.js';
import { listLabs, uploadLab, getDownloadUrl, incrementDownloads } from './labs.js';
import { initRouter, navigateTo, loadPage } from './router.js';

// Variables globales para el estado de la app
window.appState = {
    currentUser: null,
    labs: [],
    currentCategory: 'todos'
};

// Inicializar la aplicación
async function initApp() {
    console.log('🚀 Iniciando AXON-LAB con Appwrite');
    
    // Cargar usuario actual
    await loadCurrentUser();
    
    // Inicializar el router
    initRouter();
    
    // Configurar event listeners globales
    setupEventListeners();
    
    // Ocultar loader cuando todo esté listo
    const loader = document.querySelector('.loader');
    if (loader) {
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Logout
    const logoutLink = document.getElementById('logoutNavLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const { logoutUser } = await import('./auth.js');
            await logoutUser();
            navigateTo('inicio');
        });
    }
    
    // Menu toggle para móviles
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        });
        
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
}

// Exportar funciones útiles para otras páginas
export { listLabs, uploadLab, getDownloadUrl, incrementDownloads };

// Iniciar la app cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
