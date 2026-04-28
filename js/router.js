// js/router.js - VERSION FINAL PRO + FIX LOADER
import { haySesionActiva } from './auth.js';
// IMPORTANTE: Importar los controles del loader desde app.js
import { showLoader, hideLoader } from './app.js';

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

const protectedPages = ['subir'];
const publicOnlyPages = ['login', 'registro'];

export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

export function navigateTo(page, params = {}) {
    let query = '';
    if (Object.keys(params).length > 0) {
        query = '?' + new URLSearchParams(params).toString();
    }
    window.location.hash = page + query;
}

async function handleRoute() {
    // 1. Iniciar el loader visual inmediatamente
    showLoader();

    try {
        let fullHash = window.location.hash.slice(1) || 'inicio';
        let [page] = fullHash.split('?');

        const isAuth = haySesionActiva();

        // 🔒 Protección de Rutas
        if (protectedPages.includes(page) && !isAuth) {
            window.location.hash = 'login';
            return;
        }

        if (publicOnlyPages.includes(page) && isAuth) {
            window.location.hash = 'inicio';
            return;
        }

        updateActiveNavLink(page);

        // 2. Cargar el contenido HTML
        await loadPage(page);

    } catch (error) {
        console.error('❌ Error en el routing:', error);
    } finally {
        // 3. SEÑAL CRÍTICA: Apagar el loader pase lo que pase
        // Usamos un pequeño delay para que la transición neón se vea fluida
        setTimeout(hideLoader, 600);
    }
}

function updateActiveNavLink(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
}

export async function loadPage(page) {
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;

    const route = routes[page];

    if (!route) {
        contentDiv.innerHTML = `<div class="container"><h2>❌ 404 - Página no encontrada</h2></div>`;
        return;
    }

    try {
        const res = await fetch(route);
        if (!res.ok) throw new Error(`Fallo al cargar: ${res.status}`);

        const html = await res.text();
        contentDiv.innerHTML = html;

        // Ejecutar lógica específica de la página (DB, Filtros, etc)
        await executePageScripts(page);

    } catch (error) {
        console.error('Error al inyectar HTML:', error);
        contentDiv.innerHTML = `<div class="container"><h2>⚠️ Error al cargar el módulo</h2></div>`;
    }
}

async function executePageScripts(page) {
    try {
        // Importación dinámica de labs solo cuando sea necesario
        const labs = await import('./labs.js');

        switch (page) {
            case 'inicio': return labs.initHomePage();
            case 'laboratorios': return labs.initLabsPage();
            case 'subir': return labs.initUploadPage();
            case 'detalle': return labs.initDetailPage();
            default: console.log('📄 Vista:', page);
        }
    } catch (error) {
        console.warn('Nota: Esta página no requiere inicialización de datos de Labs.');
    }
}

// Globales para acceso desde HTML inline si es necesario
window.navigateTo = navigateTo;

console.log('✅ Router listo y sincronizado');
