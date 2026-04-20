// js/app.js - Inicialización y eventos globales

window.updateUI = (nombre) => {
    const userNameSpan = document.getElementById('userName');
    const subirNavLink = document.getElementById('subirNavLink');
    const registroNavLink = document.getElementById('registroNavLink');
    const loginNavLink = document.getElementById('loginNavLink');
    const logoutNavLink = document.getElementById('logoutNavLink');
    if (nombre) {
        userNameSpan.textContent = nombre;
        subirNavLink.style.display = 'flex';
        registroNavLink.style.display = 'none';
        loginNavLink.style.display = 'none';
        logoutNavLink.style.display = 'flex';
    } else {
        userNameSpan.textContent = 'Invitado';
        subirNavLink.style.display = 'none';
        registroNavLink.style.display = 'flex';
        loginNavLink.style.display = 'flex';
        logoutNavLink.style.display = 'none';
    }
};

window.mostrarNotificacion = (mensaje, tipo = 'info') => {
    const notif = document.createElement('div');
    notif.className = `alert alert-${tipo}`;
    notif.textContent = mensaje;
    notif.style.cssText = `position: fixed; bottom: 20px; right: 20px; z-index: 10000; max-width: 300px; animation: slideInRight 0.3s ease; cursor: pointer;`;
    notif.onclick = () => notif.remove();
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 4000);
};

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!menuToggle) return;
    const toggle = () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    };
    menuToggle.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) toggle();
        });
    });
}

document.getElementById('logoutNavLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.cerrarSesion();
});

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    if (window.initAuth) window.initAuth();
});
console.log('✅ App.js cargado');
