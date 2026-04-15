/**
 * AXON - UTILS.JS
 * Funciones utilitarias y helpers
 */

/**
 * Muestra una notificación temporal
 * @param {string} mensaje
 * @param {string} tipo - success, error, warning, info
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo}`;
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 350px;
        animation: slideInRight 0.3s ease;
        box-shadow: var(--shadow-lg);
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'fadeOutRight 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

/**
 * Formatea una fecha
 * @param {string} fecha
 * @param {string} formato
 * @returns {string}
 */
function formatearFecha(fecha, formato = 'dd/mm/yyyy') {
    if (!fecha) return 'Fecha no disponible';
    
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return fecha;
    
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const año = date.getFullYear();
    
    switch (formato) {
        case 'dd/mm/yyyy':
            return `${dia}/${mes}/${año}`;
        case 'yyyy-mm-dd':
            return `${año}-${mes}-${dia}`;
        case 'relative':
            return formatearFechaRelativa(date);
        default:
            return `${dia}/${mes}/${año}`;
    }
}

/**
 * Formatea una fecha relativa (hace X días)
 * @param {Date} date
 * @returns {string}
 */
function formatearFechaRelativa(date) {
    const ahora = new Date();
    const diffTime = Math.abs(ahora - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} texto
 * @param {number} maxLength
 * @returns {string}
 */
function truncarTexto(texto, maxLength = 100) {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
}

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} texto
 * @returns {string}
 */
function capitalizar(texto) {
    if (!texto) return '';
    return texto.split(' ').map(palabra => 
        palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
    ).join(' ');
}

/**
 * Genera un ID único
 * @returns {string}
 */
function generarIdUnico() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce para eventos de scroll/resize
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle para eventos de scroll
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
function throttle(func, limit = 100) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Detecta si es dispositivo móvil
 * @returns {boolean}
 */
function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Detecta si es dispositivo tablet
 * @returns {boolean}
 */
function isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

/**
 * Detecta si es touch device
 * @returns {boolean}
 */
function isTouchDevice() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
}

/**
 * Copia texto al portapapeles
 * @param {string} texto
 * @returns {Promise}
 */
async function copiarAlPortapapeles(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        mostrarNotificacion('✅ Copiado al portapapeles', 'success');
        return true;
    } catch (err) {
        console.error('Error al copiar:', err);
        mostrarNotificacion('❌ No se pudo copiar', 'error');
        return false;
    }
}

/**
 * Descarga un archivo desde una URL
 * @param {string} url
 * @param {string} nombre
 */
function descargarArchivo(url, nombre) {
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Configura scroll reveal para elementos
 */
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

/**
 * Obtiene parámetros de la URL
 * @returns {URLSearchParams}
 */
function getUrlParams() {
    return new URLSearchParams(window.location.search);
}

/**
 * Recarga la página actual
 */
function recargarPagina() {
    window.location.reload();
}

/**
 * Scroll suave a un elemento
 * @param {string} selector
 */
function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Exportar funciones globales
window.mostrarNotificacion = mostrarNotificacion;
window.formatearFecha = formatearFecha;
window.truncarTexto = truncarTexto;
window.capitalizar = capitalizar;
window.generarIdUnico = generarIdUnico;
window.debounce = debounce;
window.throttle = throttle;
window.isMobile = isMobile;
window.isTablet = isTablet;
window.isTouchDevice = isTouchDevice;
window.copiarAlPortapapeles = copiarAlPortapapeles;
window.descargarArchivo = descargarArchivo;
window.initScrollReveal = initScrollReveal;
window.getUrlParams = getUrlParams;
window.recargarPagina = recargarPagina;
window.scrollToElement = scrollToElement;