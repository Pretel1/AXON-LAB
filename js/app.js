/**
 * AXON-LAB - Main Application Controller
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
    
    try {
        // Obtenemos la página desde el hash
        const initialPage = window.location.hash.replace('#', '') || 'inicio';
        
        // CRÍTICO: Usamos await para que el inicio no termine hasta que la página cargue
        await navigateTo(initialPage);
        
        // Una vez cargada la página, refrescamos la UI
        actualizarUIGlobal();
        setupGlobalEventListeners();
        
        console.log('✅ AXON-LAB inicializado correctamente');
    } catch (error) {
        console.error('❌ Error crítico en el arranque:', error);
    } finally {
        // "Kill Switch" de seguridad: Si después de 1 segundo el loader sigue ahí, lo borramos
        setTimeout(hideLoader, 1000);
    }
});

// ============================================
// 2. MANEJO GLOBAL DE FORMULARIOS
// ============================================
document.addEventListener('submit', async (e) => {
    const target = e.target;

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
            setTimeout(() => window.location.hash = 'login', 3000);
        } else {
            msg.className = 'alert alert-error';
            msg.innerHTML = `❌ ${res.message}`;
            msg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Registrarse Ahora';
        }
    }

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
    window.addEventListener('hashchange', () => {
        const page = window.location.hash.replace('#', '') || 'inicio';
        navigateTo(page);
    });

    document.addEventListener('authChanged', () => {
        console.log('🔄 Sincronizando interfaz por cambio de estado...');
        actualizarUIGlobal();
    });

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuToggle) {
        menuToggle.onclick = () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        };
    }

    if (overlay) {
        overlay.onclick = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        };
    }

    const logoutBtn = document.getElementById('logoutNavLink');
    if (logoutBtn) {
        logoutBtn.onclick = async (e) => {
            e.preventDefault();
            if (confirm('¿Cerrar sesión en AXON-LAB?')) {
                await cerrarSesion();
            }
        };
    }
}

// ============================================
// 4. UTILIDADES DE CARGA
// ============================================
export function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }
}

export function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.opacity = '0';
        // Esperamos a que termine la transición de CSS antes de ocultar
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
}
