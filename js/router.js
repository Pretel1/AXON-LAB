// js/router.js - Enrutador SPA (sin Firebase)

const routes = {
    'inicio': { title: 'Inicio', protegida: false },
    'laboratorios': { title: 'Laboratorios', protegida: false },
    'categorias': { title: 'Categorías', protegida: false },
    'subir': { title: 'Subir Laboratorio', protegida: true },
    'registro': { title: 'Registrarse', protegida: false },
    'login': { title: 'Iniciar Sesión', protegida: false }
};

async function cargarPagina(page, params = {}) {
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;

    if (routes[page]?.protegida && !window.haySesionActiva()) {
        window.mostrarNotificacion('Debes iniciar sesión para acceder a esta sección', 'error');
        page = 'login';
    }

    contentDiv.innerHTML = `<div class="loader-container" style="display: flex; justify-content: center; align-items: center; min-height: 400px;"><div class="loader-spinner"></div><p style="margin-left: 1rem;">Cargando...</p></div>`;
    document.title = `AXON | ${routes[page]?.title || page}`;

    try {
        const response = await fetch(`pages/${page}.html`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        let html = await response.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const scripts = [];
        tempDiv.querySelectorAll('script').forEach(script => {
            if (script.textContent.trim()) scripts.push(script.textContent);
            script.remove();
        });
        contentDiv.innerHTML = tempDiv.innerHTML;
        scripts.forEach(scriptContent => {
            const newScript = document.createElement('script');
            newScript.textContent = scriptContent;
            document.body.appendChild(newScript);
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) link.classList.add('active');
        });
        document.dispatchEvent(new CustomEvent('pageLoaded', { detail: { page, params } }));
        console.log(`✅ Página cargada: ${page}`);
    } catch (error) {
        contentDiv.innerHTML = `<div class="container"><h2>Error</h2><p>No se pudo cargar ${page}.html: ${error.message}</p><button class="btn" onclick="location.reload()">Recargar</button></div>`;
    }
}

function handleRoute() {
    let hash = window.location.hash.slice(1) || 'inicio';
    let [page, queryString] = hash.split('?');
    const params = {};
    if (queryString) {
        queryString.split('&').forEach(pair => {
            let [key, value] = pair.split('=');
            if (key && value) params[key] = decodeURIComponent(value);
        });
    }
    if (!routes[page]) page = 'inicio';
    cargarPagina(page, params);
}

window.cambiarPagina = (page, params = {}) => {
    let hash = page;
    const query = new URLSearchParams(params).toString();
    if (query) hash += '?' + query;
    window.location.hash = hash;
};

window.addEventListener('hashchange', handleRoute);
document.addEventListener('DOMContentLoaded', handleRoute);
console.log('✅ Router.js cargado');
