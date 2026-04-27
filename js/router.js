// js/router.js - VERSIÓN CORREGIDA Y COMPATIBLE CON auth.js
import { haySesionActiva, obtenerUsuarioActual } from './auth.js';

// ============================================
// MAPA DE RUTAS
// ============================================
const routes = {
    'inicio': 'pages/inicio.html',
    'laboratorios': 'pages/laboratorios.html',
    'categorias': 'pages/categorias.html',
    'subir': 'pages/subir.html',
    'registro': 'pages/registro.html',
    'login': 'pages/login.html',
    'verificacion': 'pages/verificacion.html',
    'detalle': 'pages/detalle.html',
    'restablecer': 'pages/restablecer.html'  // ← AÑADIDO
};

// Páginas que requieren autenticación
const protectedPages = ['subir'];

// Páginas que NO deben ser accesibles si ya hay sesión (ej: login, registro)
const publicOnlyPages = ['login', 'registro'];

// Página actual
let currentPage = 'inicio';

// ============================================
// INICIALIZAR ROUTER
// ============================================
export function initRouter() {
    // Escuchar cambios en el hash
    window.addEventListener('hashchange', handleRoute);
    
    // Escuchar clics en enlaces de navegación
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page === 'logout') {
                // El logout se maneja aparte
                return;
            }
            navigateTo(page);
        });
    });
    
    // Escuchar el evento de autenticación para recargar la página actual
    document.addEventListener('authChanged', () => {
        // Recargar la página actual para reflejar cambios de autenticación
        handleRoute();
    });
    
    // Manejar la ruta inicial
    handleRoute();
}

// ============================================
// NAVEGAR A UNA PÁGINA
// ============================================
export function navigateTo(page, params = {}) {
    // Guardar parámetros en sessionStorage si es necesario
    if (Object.keys(params).length > 0) {
        sessionStorage.setItem('navigationParams', JSON.stringify(params));
    }
    
    window.location.hash = page;
}

// ============================================
// OBTENER PARÁMETROS DE NAVEGACIÓN
// ============================================
export function getNavigationParams() {
    const params = sessionStorage.getItem('navigationParams');
    if (params) {
        sessionStorage.removeItem('navigationParams');
        try {
            return JSON.parse(params);
        } catch (e) {
            return {};
        }
    }
    return {};
}

// ============================================
// MANEJAR CAMBIO DE RUTA
// ============================================
async function handleRoute() {
    let page = window.location.hash.slice(1) || 'inicio';
    
    // Limpiar caracteres no deseados
    page = page.split('?')[0].split('&')[0];
    
    // === VALIDACIONES DE AUTENTICACIÓN ===
    const isAuth = haySesionActiva();
    
    // Si la página requiere autenticación y no hay sesión → redirigir a login
    if (protectedPages.includes(page) && !isAuth) {
        console.log('🔒 Página protegida, redirigiendo a login');
        window.location.hash = 'login';
        return;
    }
    
    // Si la página es solo para públicos (login/registro) y YA hay sesión → redirigir a inicio
    if (publicOnlyPages.includes(page) && isAuth) {
        console.log('👤 Usuario ya autenticado, redirigiendo a inicio');
        window.location.hash = 'inicio';
        return;
    }
    
    currentPage = page;
    
    // Actualizar clase activa en el menú
    updateActiveNavLink(page);
    
    // Actualizar UI global (menús)
    if (typeof window.actualizarUIGlobal === 'function') {
        window.actualizarUIGlobal();
    }
    
    // Cargar la página
    await loadPage(page);
}

// ============================================
// ACTUALIZAR ENLACE ACTIVO EN EL SIDEBAR
// ============================================
function updateActiveNavLink(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
}

// ============================================
// CARGAR EL CONTENIDO DE LA PÁGINA
// ============================================
export async function loadPage(page) {
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;
    
    // Mostrar loader
    contentDiv.innerHTML = `
        <div class="loader" id="loader">
            <div class="loader-spinner"></div>
            <p>Cargando...</p>
        </div>
    `;
    
    const route = routes[page];
    if (!route) {
        contentDiv.innerHTML = `
            <div class="error-container">
                <h2>❌ Página no encontrada</h2>
                <p>La página que buscas no existe.</p>
                <button onclick="window.location.hash='inicio'" class="btn btn-primary">Volver al inicio</button>
            </div>
        `;
        return;
    }
    
    try {
        const response = await fetch(route);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const html = await response.text();
        contentDiv.innerHTML = html;
        
        // Ejecutar scripts específicos de la página cargada
        await executePageScripts(page);
        
        // Ocultar loader después de cargar
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
        
        // Disparar evento de página cargada
        document.dispatchEvent(new CustomEvent('pageLoaded', { detail: { page } }));
        
    } catch (error) {
        console.error('❌ Error cargando página:', error);
        contentDiv.innerHTML = `
            <div class="error-container">
                <h2>⚠️ Error al cargar la página</h2>
                <p>${error.message}</p>
                <button onclick="window.location.reload()" class="btn btn-primary">Reintentar</button>
            </div>
        `;
    }
}

// ============================================
// EJECUTAR SCRIPTS ESPECÍFICOS POR PÁGINA
// ============================================
async function executePageScripts(page) {
    try {
        switch(page) {
            case 'laboratorios':
                const { initLabsPage } = await import('./labs.js');
                if (typeof initLabsPage === 'function') {
                    await initLabsPage();
                }
                break;
                
            case 'subir':
                const { initUploadPage } = await import('./labs.js');
                if (typeof initUploadPage === 'function') {
                    await initUploadPage();
                }
                break;
                
            case 'detalle':
                const { initDetailPage } = await import('./labs.js');
                if (typeof initDetailPage === 'function') {
                    await initDetailPage();
                }
                break;
                
            case 'categorias':
                const { initCategoriesPage } = await import('./labs.js');
                if (typeof initCategoriesPage === 'function') {
                    await initCategoriesPage();
                }
                break;
                
            case 'inicio':
                const { initHomePage } = await import('./labs.js');
                if (typeof initHomePage === 'function') {
                    await initHomePage();
                }
                break;
                
            // Las páginas de autenticación ahora usan los scripts inline
            // que ya están en sus respectivos HTML, no necesitan importación adicional
            case 'login':
            case 'registro':
            case 'verificacion':
            case 'restablecer':
                // Estas páginas tienen sus propios scripts inline
                // No necesitamos hacer nada adicional
                console.log(`📄 Página de autenticación cargada: ${page}`);
                break;
                
            default:
                console.log(`📄 Página cargada: ${page} (sin scripts específicos)`);
        }
    } catch (error) {
        console.error(`❌ Error ejecutando scripts para ${page}:`, error);
    }
}

// ============================================
// FUNCIÓN PARA RECARGAR LA PÁGINA ACTUAL
// ============================================
export function reloadCurrentPage() {
    handleRoute();
}

// ============================================
// EXPORTAR AL WINDOW PARA USO GLOBAL
// ============================================
window.navigateTo = navigateTo;
window.reloadCurrentPage = reloadCurrentPage;
