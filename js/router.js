// js/router.js - VERSION FINAL PRO

import { haySesionActiva } from './auth.js';

// ============================================
// RUTAS
// ============================================
const routes = {
    inicio: 'pages/inicio.html',
    laboratorios: 'pages/laboratorios.html',
    categorias: 'pages/categorias.html',
    subir: 'pages/subir.html',
    registro: 'pages/registro.html',
    login: 'pages/login.html',
    verificacion: 'pages/verificacion.html',
    detalle: 'pages/detalle.html',
    restablecer: 'pages/restablecer.html'
};

// Páginas protegidas
const protectedPages = ['subir'];

// Páginas solo para no autenticados
const publicOnlyPages = ['login', 'registro'];

let currentPage = 'inicio';

// ============================================
// INICIAR ROUTER
// ============================================
export function initRouter() {
    window.addEventListener('hashchange', handleRoute);

    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });

    handleRoute();
}

// ============================================
// NAVEGAR
// ============================================
export function navigateTo(page, params = {}) {
    let query = '';

    if (Object.keys(params).length > 0) {
        query = '?' + new URLSearchParams(params).toString();
    }

    window.location.hash = page + query;
}

// ============================================
// OBTENER PARÁMETROS
// ============================================
export function getParams() {
    const queryString = window.location.hash.split('?')[1];
    return new URLSearchParams(queryString);
}

// ============================================
// MANEJAR RUTA
// ============================================
async function handleRoute() {
    let fullHash = window.location.hash.slice(1) || 'inicio';
    let [page] = fullHash.split('?');

    const isAuth = haySesionActiva();

    // 🔒 Protección
    if (protectedPages.includes(page) && !isAuth) {
        window.location.hash = 'login';
        return;
    }

    // 👤 Usuario ya logueado
    if (publicOnlyPages.includes(page) && isAuth) {
        window.location.hash = 'inicio';
        return;
    }

    currentPage = page;

    updateActiveNavLink(page);

    if (window.actualizarUIGlobal) {
        window.actualizarUIGlobal();
    }

    await loadPage(page);
}

// ============================================
// NAV ACTIVO
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
// CARGAR PÁGINA
// ============================================
export async function loadPage(page) {
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;

    contentDiv.innerHTML = `<p>Cargando...</p>`;

    const route = routes[page];

    if (!route) {
        contentDiv.innerHTML = `<h2>❌ Página no encontrada</h2>`;
        return;
    }

    try {
        const res = await fetch(route);
        if (!res.ok) throw new Error('Error cargando');

        const html = await res.text();
        contentDiv.innerHTML = html;

        await executePageScripts(page);

    } catch (error) {
        console.error(error);
        contentDiv.innerHTML = `<h2>⚠️ Error al cargar la página</h2>`;
    }
}

// ============================================
// SCRIPTS POR PÁGINA
// ============================================
async function executePageScripts(page) {
    try {
        const labs = await import('./labs.js');

        switch (page) {
            case 'inicio':
                return labs.initHomePage();

            case 'laboratorios':
                return labs.initLabsPage();

            case 'categorias':
                return labs.initCategoriesPage();

            case 'subir':
                return labs.initUploadPage();

            case 'detalle':
                return labs.initDetailPage();

            default:
                console.log('📄 Página cargada:', page);
        }

    } catch (error) {
        console.error('❌ Error scripts:', error);
    }
}

// ============================================
// RECARGAR
// ============================================
export function reloadCurrentPage() {
    handleRoute();
}

// ============================================
// GLOBAL
// ============================================
window.navigateTo = navigateTo;
window.reloadCurrentPage = reloadCurrentPage;

console.log('✅ Router listo');
