// js/auth.js
import { account, ID, updateCurrentUser, currentUser } from './appwrite-config.js';

// Registrar usuario
export async function registerUser(email, password, name) {
    try {
        const response = await account.create(ID.unique(), email, password, name);
        // Iniciar sesión automáticamente después del registro
        await loginUser(email, password);
        return { success: true, user: response };
    } catch (error) {
        console.error('Error en registro:', error);
        return { success: false, error: error.message };
    }
}

// Iniciar sesión
export async function loginUser(email, password) {
    try {
        const session = await account.createEmailPasswordSession(email, password);
        await updateCurrentUser();
        
        // Guardar sesión en localStorage
        localStorage.setItem('userSession', 'active');
        localStorage.setItem('userEmail', email);
        
        // Actualizar UI
        updateAuthUI();
        
        return { success: true, session };
    } catch (error) {
        console.error('Error en login:', error);
        return { success: false, error: error.message };
    }
}

// Cerrar sesión
export async function logoutUser() {
    try {
        await account.deleteSession('current');
        localStorage.removeItem('userSession');
        localStorage.removeItem('userEmail');
        currentUser = null;
        
        // Actualizar UI
        updateAuthUI();
        
        // Redirigir a inicio
        window.location.hash = '#inicio';
        
        return { success: true };
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        return { success: false, error: error.message };
    }
}

// Verificar si hay sesión activa
export function isAuthenticated() {
    return localStorage.getItem('userSession') !== null;
}

// Obtener usuario actual (síncrono)
export function getCurrentUser() {
    return currentUser;
}

// Actualizar interfaz según autenticación
export function updateAuthUI() {
    const isAuth = isAuthenticated();
    const userNameSpan = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const registroLink = document.getElementById('registroNavLink');
    const loginLink = document.getElementById('loginNavLink');
    const logoutLink = document.getElementById('logoutNavLink');
    const subirLink = document.getElementById('subirNavLink');
    
    if (isAuth && currentUser) {
        // Usuario logueado
        if (userNameSpan) userNameSpan.textContent = currentUser.name || currentUser.email;
        if (userAvatar) userAvatar.textContent = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '👤';
        if (registroLink) registroLink.style.display = 'none';
        if (loginLink) loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'flex';
        if (subirLink) subirLink.style.display = 'flex';
    } else {
        // Usuario invitado
        if (userNameSpan) userNameSpan.textContent = 'Invitado';
        if (userAvatar) userAvatar.textContent = '👤';
        if (registroLink) registroLink.style.display = 'flex';
        if (loginLink) loginLink.style.display = 'flex';
        if (logoutLink) logoutLink.style.display = 'none';
        if (subirLink) subirLink.style.display = 'none';
    }
}

// Cargar usuario actual al iniciar
export async function loadCurrentUser() {
    await updateCurrentUser();
    updateAuthUI();
}
