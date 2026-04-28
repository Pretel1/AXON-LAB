/**
 * AXON-LAB - SPA Router & Route Guard
 * Gestiona la navegación dinámica y la seguridad de vistas.
 */
import { showLoader, hideLoader } from './app.js';
import { haySesionActiva, actualizarUIGlobal } from './auth.js';

// ============================================
// 1. MAPEO DE RUTAS (Físico en carpeta pages/)
// ============================================
const routes = {
    'inicio': './pages/inicio.html',
    'laboratorios': './pages/laboratorios.html',
    'categorias': './pages/categorias.html',
    'subir': './pages/subir.html',
    'registro': './pages/registro.html',
    'login': './pages/login.html',
    'detalle': './pages/detalle.html'
};

// Configuración de Seguridad
const protectedPages = ['subir']; // Solo con sesión activa
const publicOnlyPages = ['login', 'registro']; // Solo si NO hay sesión

// ============================================
// 2. GESTOR DE NAVEGACIÓN (Navegar vía código)
// ============================================
export function navigateTo(page, params = {}) {
    let query = '';
    if (Object.keys(params).length > 0) {
        query = '?' + new URLSearchParams(params).toString();
    }
    window.location.hash = page + query;
}

// ============================================
// 3. CONTROLADOR DE RUTAS (Lógica Principal)
// ============================================
export async function handleRoute() {
    // Iniciamos la animación de carga
    showLoader();

    const fullHash = window.location.hash.slice(1) || 'inicio';
    const [page] = fullHash.split('?');
    const isAuth = haySesionActiva();

    console.log(`🧭 Navegando a: ${page} [Auth: ${isAuth}]`);

    // --- GUARDAS DE SEGURIDAD ---
    // A. Bloquear acceso a páginas protegidas
    if (protectedPages.includes(page) && !isAuth) {
        console.warn('🔒 Acceso denegado: Redirigiendo a Login');
        window.location.hash = 'login';
        return;
    }

    // B. Evitar que un usuario logueado vaya a Login o Registro
    if (publicOnlyPages.includes(page) && isAuth) {
        window.location.hash = 'inicio';
        return;
    }

    // Actualizar elementos visuales del menú
    updateActiveNavLink(page);
    actualizarUIGlobal();

    // Cargar el contenido físico
    await loadPage(page);
}

// ============================================
// 4. CARGA DINÁMICA DE CONTENIDO (Fetch)
// ============================================
async function loadPage(page) {
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;

    const path = routes[page] || routes['inicio'];

    try {
        const response = await fetch(path);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: No se encontró ${path}`);
        }

        const html = await response.text();
        
        // Inyectar el HTML en el contenedor principal
        contentDiv.innerHTML = html;
        
        // Ejecutar scripts específicos si la página los requiere
        await executePageScripts(page);

    } catch (error) {
        console.error('❌ Error de Router:', error.message);
        contentDiv.innerHTML = `
            <div class="container" style="padding: 4rem 2rem; text-align: center;">
                <h2 style="color: var(--color-error); margin-bottom: 1rem;">⚠️ Error de Carga</h2>
                <p style="color: var(--text-secondary);">No pudimos obtener la vista: <strong>${page}</strong></p>
                <code style="display:block; margin-top: 1rem; color: #ff8888;">${error.message}</code>
                <button onclick="window.location.hash='inicio'" class="btn btn-outline" style="margin-top: 2rem;">
                    Volver al Inicio
                </button>
            </div>
        `;
    } finally {
        // Apagamos el loader SIEMPRE al final
        setTimeout(hideLoader, 500);
    }
}

// ============================================
// 5. INICIALIZADOR DE SCRIPTS POR VISTA
// ============================================
async function executePageScripts(page) {
    try {
        // Importamos labs.js solo si es necesario (Optimización)
        const labs = await import('./labs.js');

        switch (page) {
            case 'inicio': 
                if (typeof labs.initHomePage === 'function') labs.initHomePage();
                break;
            case 'laboratorios': 
                if (typeof labs.initLabsPage === 'function') labs.initLabsPage();
                break;
            case 'subir': 
                if (typeof labs.initUploadPage === 'function') labs.initUploadPage();
                break;
        }
    } catch (e) {
        // Muchas páginas no tienen scripts de inicio, esto evita errores en consola
        console.log(`ℹ️ Vista ${page} cargada sin módulos adicionales.`);
    }
}

// Actualiza la clase 'active' en el CSS del menú lateral
function updateActiveNavLink(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
}

// Exponer navegación globalmente
window.navigateTo = navigateTo;
