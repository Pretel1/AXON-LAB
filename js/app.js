/**
 * AXON - APP.JS
 * Inicialización global, eventos principales y FCM
 * 
 * Proyecto: axon-labs-b720e
 * Fecha: 2024
 */

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AXON - Sistema de Laboratorios Académicos iniciado');
    
    inicializarModulos();
    configurarEventosGlobales();
    verificarSesionActiva();
    
    // Inicializar FCM después de que Firebase esté listo
    setTimeout(() => {
        if (typeof window.initFCM === 'function') {
            window.initFCM().then(success => {
                if (success) {
                    console.log('✅ FCM inicializado correctamente');
                } else {
                    console.log('⚠️ FCM no disponible en este navegador');
                }
            }).catch(error => {
                console.log('⚠️ Error al inicializar FCM:', error.message);
            });
        }
    }, 2000);
});

// ============================================
// INICIALIZAR MÓDULOS
// ============================================

function inicializarModulos() {
    // UI de usuario
    if (typeof window.actualizarUIUsuario === 'function') {
        window.actualizarUIUsuario();
    }
    
    // Tema oscuro/claro
    if (typeof window.cargarTemaGuardado === 'function') {
        window.cargarTemaGuardado();
    } else {
        initTheme();
    }
    
    // Scroll reveal
    if (typeof window.initScrollReveal === 'function') {
        window.initScrollReveal();
    } else {
        initScrollReveal();
    }
    
    // Componentes UI
    inicializarTooltips();
    inicializarDropdowns();
    inicializarModales();
}

// ============================================
// TEMA OSCURO/CLARO
// ============================================

function initTheme() {
    const savedTheme = localStorage.getItem('axon_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLightMode = document.body.classList.contains('light-mode');
    localStorage.setItem('axon_theme', isLightMode ? 'light' : 'dark');
    
    // Notificar cambio de tema
    const event = new CustomEvent('themeChanged', {
        detail: { theme: isLightMode ? 'light' : 'dark' }
    });
    document.dispatchEvent(event);
}

function addThemeToggle() {
    const userInfo = document.querySelector('.user-info');
    if (userInfo && !document.querySelector('.theme-toggle')) {
        const themeBtn = document.createElement('button');
        themeBtn.className = 'theme-toggle';
        themeBtn.setAttribute('aria-label', 'Cambiar tema');
        themeBtn.innerHTML = '<span class="icon-moon">🌙</span><span class="icon-sun" style="display: none;">☀️</span>';
        themeBtn.addEventListener('click', toggleTheme);
        
        // Actualizar icono según tema actual
        if (document.body.classList.contains('light-mode')) {
            themeBtn.querySelector('.icon-moon').style.display = 'none';
            themeBtn.querySelector('.icon-sun').style.display = 'inline';
        }
        
        userInfo.insertBefore(themeBtn, userInfo.firstChild);
    }
}

// ============================================
// SCROLL REVEAL
// ============================================

function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    revealElements.forEach(el => observer.observe(el));
}

// ============================================
// TOOLTIPS
// ============================================

function inicializarTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        if (!element.hasAttribute('data-tooltip-initialized')) {
            element.setAttribute('data-tooltip-initialized', 'true');
            element.addEventListener('mouseenter', showTooltip);
            element.addEventListener('mouseleave', hideTooltip);
        }
    });
}

function showTooltip(e) {
    const element = e.target;
    const text = element.getAttribute('data-tooltip');
    if (!text) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        background: var(--bg-card);
        color: var(--text-primary);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-md);
        font-size: var(--text-xs);
        border: 1px solid var(--border-color);
        z-index: 1000;
        white-space: nowrap;
        box-shadow: var(--shadow-md);
        pointer-events: none;
    `;
    
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.top - 30 + window.scrollY}px`;
    tooltip.style.left = `${rect.left + (rect.width / 2) - 50}px`;
    
    document.body.appendChild(tooltip);
    element._tooltip = tooltip;
}

function hideTooltip(e) {
    const element = e.target;
    if (element._tooltip) {
        element._tooltip.remove();
        delete element._tooltip;
    }
}

// ============================================
// DROPDOWNS
// ============================================

function inicializarDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        if (!dropdown.hasAttribute('data-dropdown-initialized')) {
            dropdown.setAttribute('data-dropdown-initialized', 'true');
            const trigger = dropdown.querySelector('.dropdown-trigger');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (trigger && menu) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    menu.classList.toggle('active');
                });
                
                document.addEventListener('click', () => {
                    menu.classList.remove('active');
                });
            }
        }
    });
}

// ============================================
// MODALES
// ============================================

function inicializarModales() {
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modal => {
        if (!modal.hasAttribute('data-modal-initialized')) {
            modal.setAttribute('data-modal-initialized', 'true');
            
            const closeBtn = modal.querySelector('.modal-close, .modal-close-btn');
            const overlay = modal.querySelector('.modal-overlay');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => cerrarModal(modal));
            }
            
            if (overlay) {
                overlay.addEventListener('click', () => cerrarModal(modal));
            }
        }
    });
}

function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// ============================================
// NOTIFICACIONES LOCALES
// ============================================

function mostrarNotificacionLocal(mensaje, tipo = 'info', duracion = 3000) {
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo}`;
    
    const iconos = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notificacion.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2rem;">${iconos[tipo] || '📢'}</span>
            <span>${mensaje}</span>
        </div>
    `;
    
    notificacion.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 350px;
        animation: slideInRight 0.3s ease;
        cursor: pointer;
        box-shadow: var(--shadow-lg);
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
// EVENTOS GLOBALES
// ============================================

function configurarEventosGlobales() {
    // Evento cuando se carga una página (SPA)
    document.addEventListener('pageLoaded', function(e) {
        console.log('📄 Página cargada:', e.detail.page);
        
        if (typeof window.initScrollReveal === 'function') {
            window.initScrollReveal();
        } else {
            initScrollReveal();
        }
        
        inicializarTooltips();
        inicializarDropdowns();
        inicializarModales();
        
        // Verificar botón de notificaciones en cada página
        if (typeof window.crearBotonNotificaciones === 'function' && 
            Notification.permission !== 'granted' && 
            Notification.permission !== 'denied') {
            window.crearBotonNotificaciones();
        }
    });
    
    // Evento de cambio de autenticación
    document.addEventListener('authStateChanged', function(e) {
        const user = e.detail.user;
        if (user) {
            console.log('👤 Usuario autenticado:', user.email);
            // Recargar datos del usuario
            if (typeof window.cargarDatosUsuario === 'function') {
                window.cargarDatosUsuario();
            }
        } else {
            console.log('👤 Usuario no autenticado');
        }
    });
    
    // Evento de progreso actualizado
    document.addEventListener('progresoActualizado', function(e) {
        console.log('📊 Progreso actualizado');
        if (typeof window.actualizarEstadisticasProgreso === 'function') {
            window.actualizarEstadisticasProgreso();
        }
    });
    
    // Detectar cambios de conexión
    window.addEventListener('online', function() {
        mostrarNotificacionLocal('✅ Conexión restablecida', 'success', 2000);
    });
    
    window.addEventListener('offline', function() {
        mostrarNotificacionLocal('⚠️ Sin conexión a internet', 'warning', 3000);
    });
}

// ============================================
// VERIFICAR SESIÓN ACTIVA
// ============================================

function verificarSesionActiva() {
    const sesionActiva = localStorage.getItem('axon_sesion_activa');
    if (sesionActiva === 'true' && firebaseAuth && firebaseAuth.currentUser) {
        console.log('👤 Sesión activa:', firebaseAuth.currentUser.email);
    }
}

// ============================================
// CARGAR DATOS DEL USUARIO
// ============================================

async function cargarDatosUsuario() {
    const user = firebaseAuth?.currentUser;
    if (!user) return null;
    
    try {
        const userDoc = await firebaseDB.collection('usuarios').doc(user.uid).get();
        if (userDoc.exists) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        return null;
    }
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================

window.mostrarNotificacionLocal = mostrarNotificacionLocal;
window.inicializarTooltips = inicializarTooltips;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.cargarDatosUsuario = cargarDatosUsuario;
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.addThemeToggle = addThemeToggle;
window.initScrollReveal = initScrollReveal;

// Agregar estilos de animación si no existen
if (!document.querySelector('#animation-styles')) {
    const style = document.createElement('style');
    style.id = 'animation-styles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .tooltip {
            animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}