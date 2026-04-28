/**
 * AXON-LAB - Main Application Controller
 * Gestión de SPA, Eventos Globales y Autenticación
 */
import { 
    registrarUsuario, 
    iniciarSesion, 
    cerrarSesion, 
    actualizarUIGlobal, 
    obtenerUsuarioActual 
} from './auth.js';
import { navigateTo } from './router.js';

// ============================================
// 1. INICIALIZACIÓN DE LA APP
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando AXON-LAB...');
    
    // Cargar la página inicial basada en el hash actual
    const initialPage = window.location.hash.replace('#', '') || 'inicio';
    navigateTo(initialPage);

    // Actualizar la interfaz con el estado de sesión actual
    actualizarUIGlobal();
    
    // Configurar observadores globales
    setupGlobalEventListeners();
});

// ============================================
// 2. MANEJO GLOBAL DE FORMULARIOS (Delegación)
// ============================================
/**
 * Escucha todos los 'submit' del documento. 
 * Esto permite capturar formularios inyectados dinámicamente por el router.
 */
document.addEventListener('submit', async (e) => {
    const target = e.target;

    // --- LÓGICA DE REGISTRO ---
    if (target.id === 'registroForm') {
        e.preventDefault();
        const btn = target.querySelector('button[type="submit"]');
        const msg = document.getElementById('regMessage');

        btn.disabled = true;
        btn.innerHTML = '⌛ Procesando...';
        
        const nombre = document.getElementById('regNombre').value;
        const email = document.getElementById('regEmail').value;
        const pass = document.getElementById('regPass').value;

        const res = await registrarUsuario(nombre, email, pass);
        
        if (res.success) {
            msg.className = 'alert alert-success';
            msg.innerHTML = `✅ ${res.message}`;
            msg.style.display = 'block';
            target.reset();
            // Redirigir al login después de 3 segundos
            setTimeout(() => window.location.hash = 'login', 3000);
        } else {
            msg.className = 'alert alert-error';
            msg.innerHTML = `❌ ${res.message}`;
            msg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Registrarse Ahora';
        }
    }

    // --- LÓGICA DE LOGIN ---
    if (target.id === 'loginForm') {
        e.preventDefault();
        const btn = target.querySelector('button[type="submit"]');
        const msg = document.getElementById('loginMessage');

        btn.disabled = true;
        btn.innerHTML = '🔑 Validando...';

        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPass').value;

        const res = await iniciarSesion(email, pass);
        
        if (res.success) {
            // El observador en auth.js detectará el cambio y actualizará la UI
            window.location.hash = 'inicio';
        } else {
            msg.className = 'alert alert-error';
            msg.innerHTML = `❌ ${res.message}`;
            msg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    }
});

// ============================================
// 3. EVENTOS DE NAVEGACIÓN Y UI
// ============================================
function setupGlobalEventListeners() {
    
    // --- Escuchar cambios en el Hash (Navegación SPA) ---
    window.addEventListener('hashchange', () => {
        const page = window.location.hash.replace('#', '') || 'inicio';
        navigateTo(page);
    });

    // --- Sincronizar UI cuando cambie la Auth ---
    document.addEventListener('authChanged', (e) => {
        console.log('🔄 Sincronizando interfaz por cambio de estado...');
        actualizarUIGlobal();
    });

    // --- Manejo del Menú Lateral (Mobile) ---
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // --- Cerrar Sesión ---
    const logoutBtn = document.getElementById('logoutNavLink');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('¿Cerrar sesión en AXON-LAB?')) {
                await cerrarSesion();
            }
        });
    }
}

// ============================================
// 4. UTILIDADES DE CARGA
// ============================================
export function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';
}

export function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}

console.log('✅ AXON-LAB inicializado correctamente');
