// js/app.js - VERSIÓN SIMPLIFICADA (solo inicialización y UI)
// El enrutamiento ahora está en router.js

import { initAuth, haySesionActiva, obtenerUsuarioActual, cerrarSesion, actualizarUIGlobal } from './auth.js';
import { initRouter } from './router.js';

// ============================================
// ACTUALIZAR UI SEGÚN AUTENTICACIÓN
// ============================================
function actualizarUI() {
    const isAuth = haySesionActiva();
    const user = obtenerUsuarioActual();
    
    // Actualizar nombre del usuario en el header
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) {
        let nombre = user?.nombre || 'Invitado';
        if (user && !user.emailVerificado) {
            nombre += ' (⚠️ verificar email)';
        }
        userNameSpan.textContent = nombre;
    }
    
    // Actualizar avatar
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) {
        userAvatar.textContent = user ? '👤' : '👤';
    }
    
    // Actualizar enlaces del menú
    const registroLink = document.getElementById('registroNavLink');
    const loginLink = document.getElementById('loginNavLink');
    const logoutLink = document.getElementById('logoutNavLink');
    const subirLink = document.getElementById('subirNavLink');
    
    if (registroLink) registroLink.style.display = isAuth ? 'none' : 'flex';
    if (loginLink) loginLink.style.display = isAuth ? 'none' : 'flex';
    if (logoutLink) logoutLink.style.display = isAuth ? 'flex' : 'none';
    if (subirLink) subirLink.style.display = isAuth ? 'flex' : 'none';
    
    console.log('🎨 UI actualizada - Autenticado:', isAuth);
}

// ============================================
// ESCUCHAR EVENTOS DE AUTENTICACIÓN
// ============================================
function setupAuthListener() {
    document.addEventListener('authChanged', () => {
        console.log('🔔 Evento authChanged recibido');
        actualizarUI();
    });
    
    document.addEventListener('pageLoaded', (event) => {
        console.log(`📄 Página cargada: ${event.detail?.page}`);
    });
}

// ============================================
// CONFIGURAR CIERRE DE SESIÓN
// ============================================
function setupLogout() {
    const logoutLink = document.getElementById('logoutNavLink');
    if (logoutLink) {
        // Remover event listeners anteriores para evitar duplicados
        const newLogoutLink = logoutLink.cloneNode(true);
        logoutLink.parentNode.replaceChild(newLogoutLink, logoutLink);
        
        newLogoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('🚪 Cerrando sesión...');
            await cerrarSesion();
            actualizarUI();
            // Redirigir a inicio después de cerrar sesión
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('inicio');
            } else {
                window.location.hash = 'inicio';
            }
        });
    }
}

// ============================================
// CONFIGURAR MENÚ MÓVIL
// ============================================
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (menuToggle && sidebar && overlay) {
        // Remover event listeners anteriores
        const newMenuToggle = menuToggle.cloneNode(true);
        menuToggle.parentNode.replaceChild(newMenuToggle, menuToggle);
        
        newMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

// ============================================
// ESCUCHAR CLICS EN ENLACES DEL MENÚ
// ============================================
function setupNavLinks() {
    // Los enlaces ahora son manejados por router.js
    // Solo aseguramos que los enlaces tengan data-page
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        if (!link.hasAttribute('data-listener')) {
            link.setAttribute('data-listener', 'true');
            // No agregamos evento aquí porque router.js ya lo hace
        }
    });
}

// ============================================
// INICIALIZAR APLICACIÓN
// ============================================
async function initApp() {
    console.log('🚀 Iniciando AXON-LAB...');
    
    // 1. Inicializar autenticación
    await initAuth();
    
    // 2. Actualizar UI
    actualizarUI();
    
    // 3. Configurar listeners
    setupAuthListener();
    setupLogout();
    setupMobileMenu();
    setupNavLinks();
    
    // 4. Inicializar router (maneja hashchange y carga de páginas)
    initRouter();
    
    // 5. Ocultar loader inicial
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
    
    console.log('✅ AXON-LAB inicializado correctamente');
}

// ============================================
// EXPORTAR FUNCIONES AL WINDOW
// ============================================
window.actualizarUIApp = actualizarUI;
window.haySesionActiva = haySesionActiva;
window.obtenerUsuarioActual = obtenerUsuarioActual;

// ============================================
// INICIAR
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
