// js/app.js
window.updateUI = (nombre) => {
    const userNameSpan = document.getElementById('userName');
    const subirLink = document.getElementById('subirNavLink');
    const registroLink = document.getElementById('registroNavLink');
    const loginLink = document.getElementById('loginNavLink');
    const logoutLink = document.getElementById('logoutNavLink');
    if (nombre) {
        userNameSpan.textContent = nombre;
        subirLink.style.display = 'flex';
        registroLink.style.display = 'none';
        loginLink.style.display = 'none';
        logoutLink.style.display = 'flex';
    } else {
        userNameSpan.textContent = 'Invitado';
        subirLink.style.display = 'none';
        registroLink.style.display = 'flex';
        loginLink.style.display = 'flex';
        logoutLink.style.display = 'none';
    }
};

window.mostrarNotificacion = (mensaje, tipo = 'info') => {
    const notif = document.createElement('div');
    notif.className = `alert alert-${tipo}`;
    notif.textContent = mensaje;
    notif.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
        cursor: pointer;
        background: white;
        border-radius: 8px;
        padding: 12px 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
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
});

console.log('✅ App.js cargado');
