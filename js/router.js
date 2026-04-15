/**
 * AXON - ROUTER.JS
 * Sistema de navegación SPA con hash routing
 */

// Variables del router
let currentPage = 'inicio';
let currentParams = {};
let pageHistory = [];
let pageCache = {};

// Configuración de rutas
const routes = {
    'inicio': { title: 'Inicio', icon: '🏠' },
    'laboratorios': { title: 'Laboratorios', icon: '📚' },
    'detalle': { title: 'Detalle del Laboratorio', icon: '📖' },
    'subir': { title: 'Subir Laboratorio', icon: '📤' },
    'categorias': { title: 'Categorías', icon: '🏷️' },
    'registro': { title: 'Registrarse', icon: '📝' },
    'login': { title: 'Iniciar Sesión', icon: '🔑' },
    'verificacion': { title: 'Verificar Cuenta', icon: '✅' }
};

/**
 * Carga una página dinámicamente
 * @param {string} page - Nombre de la página a cargar
 * @param {object} params - Parámetros de la página
 */
async function cargarPagina(page, params = {}) {
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;
    
    // Mostrar loader
    contentDiv.innerHTML = `
        <div class="loader" style="min-height: 400px;">
            <div class="loader-spinner"></div>
            <p style="margin-top: var(--space-4); color: var(--text-muted);">Cargando ${routes[page]?.title || page}...</p>
        </div>
    `;
    
    // Guardar estado actual
    currentPage = page;
    currentParams = params;
    
    // Agregar al historial
    pageHistory.push({ page, params, timestamp: Date.now() });
    if (pageHistory.length > 50) pageHistory.shift();
    
    // Actualizar título de la página
    actualizarTituloPagina(page, params);
    
    // Verificar caché
    const cacheKey = `${page}_${JSON.stringify(params)}`;
    if (pageCache[cacheKey]) {
        console.log('📦 Cargando desde caché:', cacheKey);
        contentDiv.innerHTML = pageCache[cacheKey];
        ejecutarScriptsPagina(contentDiv);
        actualizarNavActiva(page);
        dispararEventoPageLoaded(page, params);
        return;
    }
    
    try {
        const response = await fetch(`pages/${page}.html`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        
        let html = await response.text();
        
        // Guardar en caché
        pageCache[cacheKey] = html;
        contentDiv.innerHTML = html;
        ejecutarScriptsPagina(contentDiv);
        actualizarNavActiva(page);
        dispararEventoPageLoaded(page, params);
        
        console.log('✅ Página cargada:', page);
        
    } catch (error) {
        console.error('❌ Error cargando página:', error);
        mostrarErrorPagina(page, error.message);
    }
}

/**
 * Ejecuta los scripts de una página cargada dinámicamente
 */
function ejecutarScriptsPagina(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        if (oldScript.src) {
            newScript.src = oldScript.src;
        } else {
            newScript.textContent = oldScript.textContent;
        }
        document.body.appendChild(newScript);
        oldScript.remove();
    });
}

/**
 * Actualiza el título de la página en el navegador
 */
function actualizarTituloPagina(page, params) {
    const route = routes[page];
    let titulo = 'AXON | Laboratorios Académicos';
    
    if (route) {
        titulo = `AXON | ${route.title}`;
    }
    
    if (page === 'detalle' && params.id) {
        titulo = `AXON | Laboratorio #${params.id}`;
    }
    
    document.title = titulo;
}

/**
 * Actualiza la clase active en el menú de navegación
 */
function actualizarNavActiva(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });
}

/**
 * Dispara un evento personalizado cuando se carga una página
 */
function dispararEventoPageLoaded(page, params) {
    const event = new CustomEvent('pageLoaded', {
        detail: { page, params, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
}

/**
 * Muestra un mensaje de error cuando no se puede cargar una página
 */
function mostrarErrorPagina(page, errorMessage) {
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = `
        <div class="container" style="text-align: center; padding: var(--space-3xl);">
            <span style="font-size: 4rem;">❌</span>
            <h2 style="margin-top: var(--space-4);">Error al cargar la página</h2>
            <p style="color: var(--text-muted); margin-top: var(--space-4);">
                No se pudo cargar ${page}.html<br>
                <small>${errorMessage}</small>
            </p>
            <div style="margin-top: var(--space-lg);">
                <button onclick="location.reload()" class="btn btn-primary">
                    🔄 Recargar
                </button>
                <button onclick="window.cambiarPagina('inicio')" class="btn btn-outline" style="margin-left: var(--space-3);">
                    🏠 Ir al inicio
                </button>
            </div>
        </div>
    `;
}

/**
 * Maneja los cambios en el hash de la URL
 */
function handleRoute() {
    let hash = window.location.hash.slice(1) || 'inicio';
    const [page, queryString] = hash.split('?');
    
    const params = {};
    if (queryString) {
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key && value) {
                params[key] = decodeURIComponent(value);
            }
        });
    }
    
    // Validar que la página existe en las rutas
    if (!routes[page] && page !== 'detalle') {
        console.warn('⚠️ Ruta no encontrada:', page);
        cargarPagina('inicio', params);
    } else {
        cargarPagina(page, params);
    }
}

/**
 * Navega a una página específica
 */
function navegarA(page, params = {}) {
    const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
    
    const hash = queryString ? `${page}?${queryString}` : page;
    window.location.hash = hash;
}

/**
 * Vuelve a la página anterior en el historial
 */
function goBack() {
    if (pageHistory.length > 1) {
        pageHistory.pop(); // Quitar la actual
        const previous = pageHistory.pop();
        if (previous) {
            navegarA(previous.page, previous.params);
        } else {
            navegarA('inicio');
        }
    } else {
        navegarA('inicio');
    }
}

/**
 * Limpia la caché de páginas
 */
function limpiarCache() {
    pageCache = {};
    console.log('🗑️ Caché de páginas limpiada');
}

// Configurar event listeners
window.addEventListener('hashchange', handleRoute);

// Exportar funciones globales
window.cambiarPagina = cargarPagina;
window.navegarA = navegarA;
window.goBack = goBack;
window.limpiarCache = limpiarCache;

// Inicializar el router cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleRoute);
} else {
    handleRoute();
}