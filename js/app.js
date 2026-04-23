// js/app.js - Versión corregida
import { initAuth, haySesionActiva, obtenerUsuarioActual, cerrarSesion } from './auth.js';
import { listLabs, uploadLab, getDownloadUrl, incrementDownloads, deleteLab } from './labs.js';

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
                    actualizarUI();
                    setTimeout(() => {
                        window.location.hash = 'inicio';
                    }, 1500);
                } else {
                    msgDiv.innerHTML = `<div class="alert alert-error">${result.message}</div>`;
                }
            });
            
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
                
                if (password.length < 8) {
                    msgDiv.innerHTML = '<div class="alert alert-error">⚠️ La contraseña debe tener al menos 8 caracteres</div>';
                    return;
                }
                
                const result = await registrarUsuario(nombre, email, password);
                if (result.success) {
                    msgDiv.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                    setTimeout(() => {
                        window.location.hash = 'login';
                    }, 1500);
                } else {
                    msgDiv.innerHTML = `<div class="alert alert-error">${result.message}</div>`;
                }
            });
        }
    }
    
    if (page === 'laboratorios') {
        // Esperar a que el DOM de la página esté listo
        setTimeout(async () => {
            const container = document.getElementById('listaLaboratorios');
            if (!container) return;
            
            container.innerHTML = '<div class="loader"><div class="loader-spinner"></div></div>';
            
            const result = await listLabs();
            console.log('Laboratorios cargados:', result);
            
            if (result.success && result.labs.length > 0) {
                const currentUser = obtenerUsuarioActual();
                
                container.innerHTML = result.labs.map(lab => `
                    <div class="lab-card" data-id="${lab.$id}">
                        <div class="lab-card-content">
                            <span class="lab-card-category">📁 ${lab.category || 'Sin categoría'}</span>
                            <h3 class="lab-card-title">${escapeHtml(lab.title)}</h3>
                            <p class="lab-card-author">👤 ${escapeHtml(lab.userName || lab.userEmail)}</p>
                            <p class="lab-card-description">${escapeHtml(lab.description?.substring(0, 120) || 'Sin descripción')}...</p>
                            <div class="lab-card-stats">
                                <span>📅 ${new Date(lab.createdAt).toLocaleDateString()}</span>
                                <span>⬇️ ${lab.downloads || 0} descargas</span>
                            </div>
                            <div class="btn-group" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                                <button class="btn btn-sm btn-primary ver-detalle-btn" data-lab='${JSON.stringify(lab).replace(/'/g, "\\'")}'>
                                    👁️ Ver detalles
                                </button>
                                <button class="btn btn-sm btn-success descargar-btn" data-fileid="${lab.fileId}" data-docid="${lab.$id}" data-downloads="${lab.downloads || 0}">
                                    📥 Descargar
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                // Eventos de ver detalles
                document.querySelectorAll('.ver-detalle-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const lab = JSON.parse(btn.dataset.lab);
                        window.laboratorioActual = lab;
                        window.location.hash = `detalle?id=${lab.$id}`;
                    });
                });
                
                // Eventos de descarga
                document.querySelectorAll('.descargar-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const fileId = btn.dataset.fileid;
                        const docId = btn.dataset.docid;
                        const downloads = parseInt(btn.dataset.downloads);
                        
                        const url = await getDownloadUrl(fileId);
                        if (url) {
                            window.open(url, '_blank');
                            await incrementDownloads(docId, downloads);
                            btn.dataset.downloads = downloads + 1;
                        }
                    });
                });
            } else {
                container.innerHTML = '<p>No hay laboratorios disponibles.</p>';
            }
        }, 100);
    }
    
    if (page === 'subir') {
        const form = document.getElementById('formSubir');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const titulo = document.getElementById('labNombre')?.value;
                const descripcion = document.getElementById('labDescripcion')?.value;
                const categoria = document.getElementById('labCategoria')?.value;
                const archivo = document.getElementById('labArchivo')?.files[0];
                const msgDiv = document.getElementById('msgSubir');
                
                if (!archivo) {
                    msgDiv.innerHTML = '<div class="alert alert-error">Selecciona un archivo</div>';
                    return;
                }
                
                const btn = form.querySelector('button');
                const originalText = btn.textContent;
                btn.textContent = '⏳ Subiendo...';
                btn.disabled = true;
                
                const result = await uploadLab(archivo, titulo, descripcion, categoria);
                
                if (result.success) {
                    msgDiv.innerHTML = '<div class="alert alert-success">✅ Laboratorio subido con éxito</div>';
                    form.reset();
                    setTimeout(() => {
                        window.location.hash = 'laboratorios';
                    }, 1500);
                } else {
                    msgDiv.innerHTML = `<div class="alert alert-error">❌ ${result.error}</div>`;
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            });
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    
    await initAuth();
    actualizarUI();
    
    // Configurar navegación por hash
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
            await cerrarSesion();
            actualizarUI();
            window.location.hash = 'inicio';
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
