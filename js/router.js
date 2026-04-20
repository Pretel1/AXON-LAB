/**
 * AXON - Router SPA
 * Navegación basada en hash, carga dinámica de páginas y protección de rutas
 */

// ============================================
// CONFIGURACIÓN DE RUTAS
// ============================================
const routes = {
    'inicio': { title: 'Inicio', protegida: false, script: null },
    'laboratorios': { title: 'Laboratorios', protegida: false, script: null },
    'detalle': { title: 'Detalle del Laboratorio', protegida: false, script: null },
    'subir': { title: 'Subir Laboratorio', protegida: true, script: null },
    'categorias': { title: 'Categorías', protegida: false, script: null },
    'registro': { title: 'Registrarse', protegida: false, script: null },
    'login': { title: 'Iniciar Sesión', protegida: false, script: null },
    'verificacion': { title: 'Verificar Cuenta', protegida: false, script: null }
};

// Cache de scripts ya ejecutados para evitar duplicados
const executedScripts = new Set();

// ============================================
// FUNCIÓN PRINCIPAL: CARGAR PÁGINA
// ============================================
async function cargarPagina(page, params = {}) {
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;

    // Validar si la ruta es protegida y el usuario no está autenticado
    if (routes[page]?.protegida && !firebaseAuth.currentUser) {
        mostrarAlerta('Debes iniciar sesión para acceder a esta sección', 'warning');
        page = 'login';
        params = {};
    }

    // Guardar estado actual (opcional)
    window.currentPage = page;
    window.currentParams = params;

    // Mostrar loader
    contentDiv.innerHTML = `
        <div class="loader-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px;">
            <div class="loader-spinner"></div>
            <p style="margin-top: 1rem; color: var(--text-muted);">Cargando ${routes[page]?.title || page}...</p>
        </div>
    `;

    // Actualizar título del documento
    document.title = `AXON | ${routes[page]?.title || page}`;

    try {
        // Cargar el HTML de la página desde /pages/
        const response = await fetch(`pages/${page}.html`);
        if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);

        let html = await response.text();

        // Extraer y ejecutar scripts del HTML (sin duplicar)
        const { cleanHtml, scripts } = extraerScripts(html);
        contentDiv.innerHTML = cleanHtml;
        ejecutarScriptsUnicos(scripts);

        // Marcar enlace activo en el menú lateral
        marcarEnlaceActivo(page);

        // Disparar evento personalizado para que otros módulos sepan que se cargó una nueva página
        const event = new CustomEvent('pageLoaded', {
            detail: { page, params, timestamp: Date.now() }
        });
        document.dispatchEvent(event);

        console.log(`✅ Página cargada: ${page}`);

    } catch (error) {
        console.error('❌ Error al cargar la página:', error);
        contentDiv.innerHTML = `
            <div class="container" style="text-align: center; padding: 3rem;">
                <span style="font-size: 4rem;">❌</span>
                <h2>Error al cargar la página</h2>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Recargar</button>
                <button class="btn btn-outline" onclick="window.cambiarPagina('inicio')">Ir al inicio</button>
            </div>
        `;
    }
}

// ============================================
// EXTRAER SCRIPTS DEL HTML (INLINE Y EXTERNOS)
// ============================================
function extraerScripts(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const scripts = [];
    const scriptElements = tempDiv.querySelectorAll('script');

    scriptElements.forEach(script => {
        const content = script.textContent;
        const src = script.src;
        if (content && content.trim()) {
            scripts.push({ type: 'inline', content: content });
        } else if (src) {
            scripts.push({ type: 'external', src: src });
        }
        script.remove(); // eliminar del HTML para no ejecutarse dos veces
    });

    return { cleanHtml: tempDiv.innerHTML, scripts };
}

// ============================================
// EJECUTAR SCRIPTS EVITANDO DUPLICADOS
// ============================================
function ejecutarScriptsUnicos(scripts) {
    scripts.forEach(script => {
        let key;
        if (script.type === 'inline') {
            // Usar el hash del contenido como clave (primeros 100 caracteres)
            key = script.content.substring(0, 100);
        } else {
            key = script.src;
        }

        if (!executedScripts.has(key)) {
            executedScripts.add(key);
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
// MARCAR ENLACE ACTIVO EN EL SIDEBAR
// ============================================
function marcarEnlaceActivo(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });
}

// ============================================
// MOSTRAR ALERTA TEMPORAL (OPCIONAL)
// ============================================
function mostrarAlerta(mensaje, tipo = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.innerHTML = `<span>${tipo === 'warning' ? '⚠️' : 'ℹ️'}</span> ${mensaje}`;
    alertDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 350px;
        background: white;
        border-left: 4px solid #f0ad4e;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-size: 14px;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 4000);
}

// ============================================
// NAVEGACIÓN POR HASH
// ============================================
function handleRoute() {
    let hash = window.location.hash.slice(1) || 'inicio';
    // Separar la página de los parámetros (ej: "detalle?id=123")
    let [page, queryString] = hash.split('?');
    const params = {};
    if (queryString) {
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key && value) params[key] = decodeURIComponent(value);
        });
    }
    // Validar que la ruta exista, si no, redirigir a inicio
    if (!routes[page]) page = 'inicio';
    cargarPagina(page, params);
}

// ============================================
// FUNCIÓN PÚBLICA PARA NAVEGAR PROGRAMÁTICAMENTE
// ============================================
function navegarA(page, params = {}) {
    const queryString = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
    const hash = queryString ? `${page}?${queryString}` : page;
    window.location.hash = hash;
}

// ============================================
// LIMPIAR CACHÉ DE SCRIPTS (ÚTIL PARA RECARGAR)
// ============================================
function limpiarCacheScripts() {
    executedScripts.clear();
    console.log('🗑️ Caché de scripts limpiada');
}

// ============================================
// INICIALIZAR ROUTER
// ============================================
window.addEventListener('hashchange', handleRoute);

// Exponer funciones globales para usar desde otros scripts
window.cambiarPagina = cargarPagina;   // alias
window.navegarA = navegarA;
window.limpiarCacheScripts = limpiarCacheScripts;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleRoute);
} else {
    handleRoute();
}

console.log('✅ Router SPA inicializado');
