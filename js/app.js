/**
 * AXON - APP.JS
 * Inicialización global, UI dinámica y eventos principales
 */

// ============================================
// VARIABLES GLOBALES
// ============================================
let currentUser = null;
let userDataCache = null;

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 AXON - Sistema de Laboratorios Académicos iniciado');
    
    // Inicializar componentes UI
    inicializarMenuMovil();
    inicializarTema();
    inicializarEventosGlobales();
    
    // Escuchar cambios en autenticación
    firebaseAuth.onAuthStateChanged(async (user) => {
        currentUser = user;
        await actualizarUIUsuario(user);
        
        // Disparar evento personalizado
        const event = new CustomEvent('authChanged', { detail: { user } });
        document.dispatchEvent(event);
        
        if (user) {
            console.log('👤 Usuario conectado:', user.email);
            await cargarDatosUsuario(user.uid);
        } else {
            console.log('👤 Usuario desconectado');
            userDataCache = null;
        }
    });
});

// ============================================
// ACTUALIZAR UI SEGÚN USUARIO LOGUEADO
// ============================================
async function actualizarUIUsuario(user) {
    // Elementos del DOM
    const userNameSpan = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const subirNavLink = document.getElementById('subirNavLink');
    const registroNavLink = document.getElementById('registroNavLink');
    const loginNavLink = document.getElementById('loginNavLink');
    const logoutNavLink = document.getElementById('logoutNavLink');
    const heroSubirBtn = document.getElementById('heroSubirBtn');
    const subirNavLinkDesktop = document.querySelector('.nav-link[data-page="subir"]');
    
    if (user) {
        // Usuario logueado - obtener datos de Firestore
        try {
            const userDoc = await firebaseDB.collection('usuarios').doc(user.uid).get();
            const nombre = userDoc.exists ? userDoc.data().nombre : user.email.split('@')[0];
            if (userNameSpan) userNameSpan.textContent = nombre;
            if (userAvatar) userAvatar.textContent = nombre.charAt(0).toUpperCase();
        } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            if (userNameSpan) userNameSpan.textContent = user.email.split('@')[0];
        }
        
        // Mostrar/ocultar elementos del menú
        if (subirNavLink) subirNavLink.style.display = 'flex';
        if (subirNavLinkDesktop) subirNavLinkDesktop.style.display = 'flex';
        if (registroNavLink) registroNavLink.style.display = 'none';
        if (loginNavLink) loginNavLink.style.display = 'none';
        if (logoutNavLink) logoutNavLink.style.display = 'flex';
        if (heroSubirBtn) heroSubirBtn.style.display = 'inline-flex';
        
    } else {
        // Usuario no logueado
        if (userNameSpan) userNameSpan.textContent = 'Invitado';
        if (userAvatar) userAvatar.textContent = '👤';
        if (subirNavLink) subirNavLink.style.display = 'none';
        if (subirNavLinkDesktop) subirNavLinkDesktop.style.display = 'none';
        if (registroNavLink) registroNavLink.style.display = 'flex';
        if (loginNavLink) loginNavLink.style.display = 'flex';
        if (logoutNavLink) logoutNavLink.style.display = 'none';
        if (heroSubirBtn) heroSubirBtn.style.display = 'none';
    }
}

// ============================================
// CARGAR DATOS DEL USUARIO EN CACHE
// ============================================
async function cargarDatosUsuario(uid) {
    try {
        const userDoc = await firebaseDB.collection('usuarios').doc(uid).get();
        if (userDoc.exists) {
            userDataCache = userDoc.data();
        }
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

// ============================================
// OBTENER DATOS DEL USUARIO ACTUAL
// ============================================
function obtenerUsuarioActual() {
    return {
        user: currentUser,
        data: userDataCache
    };
}

// ============================================
// CERRAR SESIÓN
// ============================================
async function cerrarSesionGlobal() {
    try {
        await firebaseAuth.signOut();
        mostrarNotificacion('✅ Sesión cerrada exitosamente', 'success');
        if (typeof window.cambiarPagina === 'function') {
            window.cambiarPagina('inicio');
        } else {
            window.location.hash = '#inicio';
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        mostrarNotificacion('❌ Error al cerrar sesión', 'error');
    }
}

// ============================================
// MOSTRAR NOTIFICACIÓN TEMPORAL
// ============================================
function mostrarNotificacion(mensaje, tipo = 'info', duracion = 3000) {
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo}`;
    notificacion.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'}</span>
            <span>${mensaje}</span>
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
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notificacion.onclick = () => notificacion.remove();
    document.body.appendChild(notificacion);
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.style.animation = 'fadeOutRight 0.3s ease';
            setTimeout(() => notificacion.remove(), 300);
        }
    }, duracion);
}

// ============================================
// MENÚ MÓVIL (SIDEBAR RESPONSIVE)
// ============================================
function inicializarMenuMovil() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!menuToggle || !sidebar) return;
    
    const toggleSidebar = () => {
        sidebar.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    };
    
    menuToggle.addEventListener('click', toggleSidebar);
    
    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }
    
    // Cerrar sidebar al hacer clic en un enlace (móvil)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                toggleSidebar();
            }
        });
    });
}

// ============================================
// TEMA OSCURO/CLARO
// ============================================
function inicializarTema() {
    const savedTheme = localStorage.getItem('axon_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    
    // Agregar botón de tema si no existe
    if (!document.querySelector('.theme-toggle')) {
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            const themeBtn = document.createElement('button');
            themeBtn.className = 'theme-toggle';
            themeBtn.setAttribute('aria-label', 'Cambiar tema');
            themeBtn.innerHTML = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
            themeBtn.addEventListener('click', toggleTheme);
            userInfo.insertBefore(themeBtn, userInfo.firstChild);
        }
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('axon_theme', isLight ? 'light' : 'dark');
    
    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) {
        themeBtn.innerHTML = isLight ? '☀️' : '🌙';
    }
}

// ============================================
// EVENTOS GLOBALES
// ============================================
function inicializarEventosGlobales() {
    // Cerrar sesión desde el menú
    const logoutLink = document.getElementById('logoutNavLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            cerrarSesionGlobal();
        });
    }
    
    // Detectar cambios de conexión
    window.addEventListener('online', () => {
        mostrarNotificacion('✅ Conexión restablecida', 'success', 2000);
    });
    
    window.addEventListener('offline', () => {
        mostrarNotificacion('⚠️ Sin conexión a internet', 'warning', 3000);
    });
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.actualizarUIUsuario = actualizarUIUsuario;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.mostrarNotificacion = mostrarNotificacion;
window.cerrarSesion = cerrarSesionGlobal;
window.cargarDatosUsuario = cargarDatosUsuario;
window.toggleTheme = toggleTheme;
