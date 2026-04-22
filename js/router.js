// js/router.js
import { isAuthenticated } from './auth.js';

// Mapa de rutas a archivos HTML
const routes = {
    'inicio': 'pages/inicio.html',
    'laboratorios': 'pages/laboratorios.html',
    'categorias': 'pages/categorias.html',
    'subir': 'pages/subir.html',
    'registro': 'pages/registro.html',
    'login': 'pages/login.html',
    'verificacion': 'pages/verificacion.html',
    'detalle': 'pages/detalle.html'
};

// Página actual
let currentPage = 'inicio';

// Inicializar router
export function initRouter() {
    // Escuchar cambios en el hash
    window.addEventListener('hashchange', handleRoute);
    
    // Escuchar clics en enlaces de navegación
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
        });
    });
    
    // Manejar la ruta inicial
    handleRoute();
}

// Navegar a una página
export function navigateTo(page, params = {}) {
    // Guardar parámetros en sessionStorage si es necesario
    if (Object.keys(params).length > 0) {
        sessionStorage.setItem('navigationParams', JSON.stringify(params));
    }
    
    window.location.hash = page;
}

// Manejar el cambio de ruta
async function handleRoute() {
    let page = window.location.hash.slice(1) || 'inicio';
    
    // Verificar si la página requiere autenticación
    const protectedPages = ['subir'];
    if (protectedPages.includes(page) && !isAuthenticated()) {
        page = 'login';
        window.location.hash = 'login';
    }
    
    currentPage = page;
    
    // Actualizar clase activa en el menú
    updateActiveNavLink(page);
    
    // Cargar la página
    await loadPage(page);
}

// Actualizar enlace activo en el sidebar
function updateActiveNavLink(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
}

// Cargar el contenido de la página
export async function loadPage(page) {
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;
    
    // Mostrar loader
    contentDiv.innerHTML = '<div class="loader"><div class="loader-spinner"></div></div>';
    
    const route = routes[page];
    if (!route) {
        contentDiv.innerHTML = '<h2>Página no encontrada</h2>';
        return;
    }
    
    try {
        const response = await fetch(route);
        if (!response.ok) throw new Error('Error al cargar la página');
        
        const html = await response.text();
        contentDiv.innerHTML = html;
        
        // Ejecutar scripts específicos de la página cargada
        await executePageScripts(page);
        
    } catch (error) {
        console.error('Error cargando página:', error);
        contentDiv.innerHTML = '<h2>Error al cargar la página</h2>';
    }
}

// Ejecutar scripts específicos después de cargar una página
async function executePageScripts(page) {
    // Importar dinámicamente los scripts según la página
    switch(page) {
        case 'laboratorios':
            const { initLabsPage } = await import('./labs.js');
            if (typeof initLabsPage === 'function') await initLabsPage();
            break;
        case 'subir':
            const { initUploadPage } = await import('./labs.js');
            if (typeof initUploadPage === 'function') await initUploadPage();
            break;
        case 'login':
            const { initLoginPage } = await import('./auth.js');
            if (typeof initLoginPage === 'function') await initLoginPage();
            break;
        case 'registro':
            const { initRegisterPage } = await import('./auth.js');
            if (typeof initRegisterPage === 'function') await initRegisterPage();
            break;
    }
}
