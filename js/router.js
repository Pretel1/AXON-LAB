/**
 * AXON - ROUTER.JS
 * Sistema de navegación SPA (Single Page Application)
 * Corregido: evita duplicación de scripts
 */

// ============================================
// CONFIGURACIÓN DE RUTAS
// ============================================
const routesConfig = {
    'inicio': { title: 'Inicio', protegida: false },
    'laboratorios': { title: 'Laboratorios', protegida: false },
    'detalle': { title: 'Detalle del Laboratorio', protegida: false },
    'subir': { title: 'Subir Laboratorio', protegida: true },
    'categorias': { title: 'Categorías', protegida: false },
    'registro': { title: 'Registrarse', protegida: false },
    'login': { title: 'Iniciar Sesión', protegida: false },
    'verificacion': { title: 'Verificar Cuenta', protegida: false }
};

// ============================================
// VARIABLES DE ESTADO
// ============================================
let currentPage = 'inicio';
let currentParams = {};
let scriptCache = new Map();

// ============================================
// FUNCIÓN PRINCIPAL PARA CARGAR PÁGINAS
// ============================================
async function cargarPagina(page, params = {}) {
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;
    
    // Validar página protegida
    if (routesConfig[page]?.protegida && !firebaseAuth.currentUser) {
        mostrarAlertaNoAutenticado();
        page = 'login';
        params = {};
    }
    
    // Guardar estado actual
    currentPage = page;
    currentParams = params;
    
    // Mostrar loader
    contentDiv.innerHTML = `
        <div class="loader-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px;">
            <div class="loader-spinner"></div>
            <p style="margin-top: var(--space-4); color: var(--text-muted);">Cargando ${routesConfig[page]?.title || page}...</p>
        </div>
    `;
    
    // Actualizar título
    document.title = `AXON | ${routesConfig[page]?.title || page}`;
    
    try {
        const response = await fetch(`pages/${page}.html`);
        if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        
        let html = await response.text();
        
        // Extraer scripts del HTML
        const { cleanHtml, scripts } = extraerScripts(html);
        
        // Insertar HTML limpio
        contentDiv.innerHTML = cleanHtml;
        
        // Ejecutar scripts solo si no están en caché
        ejecutarScriptsUnicos(scripts);
        
        // Actualizar navegación activa
        actualizarNavActiva(page);
        
        // Disparar evento de página cargada
        document.dispatchEvent(new CustomEvent('pageLoaded', { 
            detail: { page, params, timestamp: Date.now() } 
        }));
        
        console.log(`✅ Página cargada: ${page}`);
        
    } catch (error) {
        console.error('❌ Error cargando página:', error);
        contentDiv.innerHTML = `
            <div class="container" style="text-align: center; padding: var(--space-3xl);">
                <span style="font-size: 4rem;">❌</span>
                <h2 style="margin-top: var(--space-4);">Error al cargar la página</h2>
                <p style="color: var(--text-muted); margin-top: var(--space-4);">
                    No se pudo cargar ${page}.html<br>
                    <small>${error.message}</small>
                </p>
                <div style="margin-top: var(--space-lg);">
                    <button onclick="window.cambiarPagina('inicio')" class="btn btn-primary">🏠 Ir al inicio</button>
                    <button onclick="location.reload()" class="btn btn-outline" style="margin-left: var(--space-3);">🔄 Recargar</button>
                </div>
            </div>
        `;
    }
}

// ============================================
// EXTRAER SCRIPTS DEL HTML
// ============================================
function extraerScripts(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const scripts = [];
    const scriptElements = tempDiv.querySelectorAll('script');
    
    scriptElements.forEach(script => {
        const scriptContent = script.textContent;
        const scriptSrc = script.src;
        
        if (scriptContent && scriptContent.trim()) {
            scripts.push({ type: 'inline', content: scriptContent });
        } else if (scriptSrc) {
            scripts.push({ type: 'external', src: scriptSrc });
        }
        script.remove();
    });
    
    return {
        cleanHtml: tempDiv.innerHTML,
        scripts: scripts
    };
}

// ============================================
// EJECUTAR SCRIPTS SIN DUPLICAR
// ============================================
function ejecutarScriptsUnicos(scripts) {
    scripts.forEach(script => {
        let scriptKey;
        
        if (script.type === 'inline') {
            scriptKey = script.content.substring(0, 200);
        } else {
            scriptKey = script.src;
        }
        
        // Verificar si el script ya fue ejecutado
        if (!scriptCache.has(scriptKey)) {
            scriptCache.set(scriptKey, true);
            
            const newScript = document.createElement('script');
            if (script.type === 'inline') {
                newScript.textContent = script.content;
            } else {
                newScript.src = script.src;
                newScript.async = false;
            }
            document.body.appendChild(newScript);
        }
    });
}

// ============================================
// ACTUALIZAR CLASE ACTIVE EN EL MENÚ
// ============================================
function actualizarNavActiva(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });
}

// ============================================
// MOSTRAR ALERTA DE RUTA PROTEGIDA
// ============================================
function mostrarAlertaNoAutenticado() {
    const notificacion = document.createElement('div');
    notificacion.className = 'alert alert-warning';
    notificacion.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>🔒</span>
            <span>Debes iniciar sesión para acceder a esta sección</span>
        </div>
    `;
    notificacion.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 350px;
        animation: slideInRight 0.3s ease;
        cursor: pointer;
    `;
    notificacion.onclick = () => notificacion.remove();
    document.body.appendChild(notificacion);
    setTimeout(() => notificacion.remove(), 4000);
}

// ============================================
// MANEJAR CAMBIOS EN LA URL (HASH ROUTING)
// ============================================
function handleRoute() {
    let hash = window.location.hash.slice(1) || 'inicio';
    const [page, queryString] = hash.split('?');
    
    const params = {};
    if (queryString) {
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key && value) params[key] = decodeURIComponent(value);
        });
    }
    
    const validPage = routesConfig[page] ? page : 'inicio';
    cargarPagina(validPage, params);
}

// ============================================
// NAVEGAR A UNA PÁGINA ESPECÍFICA
// ============================================
function navegarA(page, params = {}) {
    const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
    
    const hash = queryString ? `${page}?${queryString}` : page;
    window.location.hash = hash;
}

// ============================================
// LIMPIAR CACHÉ DE SCRIPTS (ÚTIL PARA RECARGA)
// ============================================
function limpiarCacheScripts() {
    scriptCache.clear();
    console.log('🗑️ Caché de scripts limpiada');
}

// ============================================
// INICIALIZAR ROUTER
// ============================================
window.addEventListener('hashchange', handleRoute);
window.cambiarPagina = cargarPagina;
window.navegarA = navegarA;
window.limpiarCacheScripts = limpiarCacheScripts;

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleRoute);
} else {
    handleRoute();
}
