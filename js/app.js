// js/app.js - Versión minimalista que funciona
import { initAuth, haySesionActiva, obtenerUsuarioActual } from './auth.js';

// Variables globales
let paginaActual = 'inicio';

// Mapeo de páginas
const pages = {
    'inicio': 'pages/inicio.html',
    'laboratorios': 'pages/laboratorios.html',
    'categorias': 'pages/categorias.html',
    'subir': 'pages/subir.html',
    'registro': 'pages/registro.html',
    'login': 'pages/login.html',
    'verificacion': 'pages/verificacion.html',
    'detalle': 'pages/detalle.html'
};

// Función para ocultar loader
function hideLoader() {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.display = 'none';
        console.log('✅ Loader ocultado');
    }
}

// Función para mostrar loader
function showLoader() {
    const contentDiv = document.getElementById('page-content');
    if (contentDiv) {
        contentDiv.innerHTML = '<div class="loader"><div class="loader-spinner"></div></div>';
    }
}

// Función para cargar página
async function loadPage(page) {
    console.log(`📄 Cargando página: ${page}`);
    
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;
    
    // Verificar si la página requiere autenticación
    const protectedPages = ['subir'];
    if (protectedPages.includes(page) && !haySesionActiva()) {
        page = 'login';
        window.location.hash = 'login';
    }
    
    const pageFile = pages[page];
    if (!pageFile) {
        contentDiv.innerHTML = '<h2>Página no encontrada</h2>';
        hideLoader();
        return;
    }
    
    try {
        const response = await fetch(pageFile);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        let html = await response.text();
        contentDiv.innerHTML = html;
        
        // Actualizar clase activa en el menú
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });
        
        // Ejecutar scripts específicos de la página
        await executePageScripts(page);
        
        console.log(`✅ Página cargada: ${page}`);
    } catch (error) {
        console.error(`Error cargando ${page}:`, error);
        contentDiv.innerHTML = `<div class="alert alert-error">Error al cargar la página: ${error.message}</div>`;
    }
    
    hideLoader();
}

// Ejecutar scripts específicos según la página
async function executePageScripts(page) {
    if (page === 'login') {
        // Inicializar formulario de login
        const form = document.getElementById('formLogin');
        if (form) {
            const { iniciarSesion, iniciarSesionConGoogle } = await import('./auth.js');
            
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail')?.value;
                const password = document.getElementById('loginPassword')?.value;
                const msgDiv = document.getElementById('msgLogin');
                
                const result = await iniciarSesion(email, password);
                if (result.success) {
                    msgDiv.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                    setTimeout(() => {
                        window.location.hash = 'inicio';
                        loadPage('inicio');
                        actualizarUI();
                    }, 1500);
                } else {
                    msgDiv.innerHTML = `<div class="alert alert-error">${result.message}</div>`;
                }
            });
            
            // Botón de Google
            const googleBtn = document.getElementById('googleLoginBtn');
            if (googleBtn) {
                googleBtn.addEventListener('click', () => iniciarSesionConGoogle());
            }
        }
    }
    
    if (page === 'registro') {
        const form = document.getElementById('formRegistro');
        if (form) {
            const { registrarUsuario } = await import('./auth.js');
            
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nombre = document.getElementById('regNombre')?.value;
                const email = document.getElementById('regEmail')?.value;
                const password = document.getElementById('regPassword')?.value;
                const msgDiv = document.getElementById('msgRegistro');
                
                const result = await registrarUsuario(nombre, email, password);
                if (result.success) {
                    msgDiv.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                    setTimeout(() => {
                        window.location.hash = 'inicio';
                        loadPage('inicio');
                        actualizarUI();
                    }, 1500);
                } else {
                    msgDiv.innerHTML = `<div class="alert alert-error">${result.message}</div>`;
                }
            });
        }
    }
    
    if (page === 'laboratorios') {
        const { listLabs, getDownloadUrl, incrementDownloads } = await import('./labs.js');
        const container = document.getElementById('listaLaboratorios');
        if (container) {
            const result = await listLabs();
            if (result.success && result.labs.length > 0) {
                container.innerHTML = result.labs.map(lab => `
                    <div class="lab-card">
                        <div class="lab-card-content">
                            <span class="lab-card-category">${lab.category}</span>
                            <h3 class="lab-card-title">${lab.title}</h3>
                            <p class="lab-card-author">📧 ${lab.userEmail}</p>
                            <p class="lab-card-description">${lab.description.substring(0, 100)}...</p>
                            <div class="lab-card-stats">
                                <span>📅 ${new Date(lab.createdAt).toLocaleDateString()}</span>
                                <span>⬇️ ${lab.downloads} descargas</span>
                            </div>
                            <button class="btn btn-sm btn-primary" data-fileid="${lab.fileId}" data-docid="${lab.$id}" data-downloads="${lab.downloads}">
                                📥 Descargar
                            </button>
                        </div>
                    </div>
                `).join('');
                
                // Agregar eventos a botones de descarga
                document.querySelectorAll('[data-fileid]').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const fileId = btn.dataset.fileid;
                        const url = await getDownloadUrl(fileId);
                        if (url) window.open(url, '_blank');
                    });
                });
            } else {
                container.innerHTML = '<p>No hay laboratorios disponibles.</p>';
            }
        }
    }
}

// Actualizar UI según autenticación
function actualizarUI() {
    const isAuth = haySesionActiva();
    const user = obtenerUsuarioActual();
    
    const userNameSpan = document.getElementById('userName');
    const registroLink = document.getElementById('registroNavLink');
    const loginLink = document.getElementById('loginNavLink');
    const logoutLink = document.getElementById('logoutNavLink');
    const subirLink = document.getElementById('subirNavLink');
    
    if (userNameSpan) {
        userNameSpan.textContent = user?.nombre || 'Invitado';
    }
    
    if (isAuth) {
        if (registroLink) registroLink.style.display = 'none';
        if (loginLink) loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'flex';
        if (subirLink) subirLink.style.display = 'flex';
    } else {
        if (registroLink) registroLink.style.display = 'flex';
        if (loginLink) loginLink.style.display = 'flex';
        if (logoutLink) logoutLink.style.display = 'none';
        if (subirLink) subirLink.style.display = 'none';
    }
}

// Inicializar la aplicación
async function initApp() {
    console.log('🚀 Iniciando AXON-LAB...');
    
    // Inicializar autenticación
    await initAuth();
    actualizarUI();
    
    // Configurar navegación
    window.addEventListener('hashchange', () => {
        const page = window.location.hash.slice(1) || 'inicio';
        loadPage(page);
    });
    
    // Configurar clics en el menú
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            window.location.hash = page;
        });
    });
    
    // Configurar logout
    const logoutLink = document.getElementById('logoutNavLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const { cerrarSesion } = await import('./auth.js');
            await cerrarSesion();
            actualizarUI();
            window.location.hash = 'inicio';
            loadPage('inicio');
        });
    }
    
    // Cargar página inicial
    const initialPage = window.location.hash.slice(1) || 'inicio';
    await loadPage(initialPage);
}

// Iniciar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
