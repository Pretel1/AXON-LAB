// js/auth.js - Versión completa con Appwrite + Google OAuth
import { account, ID } from './appwrite-config.js';
import { setCurrentUser } from './labs.js';

// Variable local para mantener el usuario actual
let currentUser = null;

// ============================================
// INICIALIZAR AUTENTICACIÓN
// ============================================
export async function initAuth() {
    try {
        // Intentar obtener sesión actual de Appwrite
        const user = await account.get();
        currentUser = {
            id: user.$id,
            nombre: user.name || user.email,
            email: user.email
        };
        // Sincronizar con labs.js
        setCurrentUser(currentUser);
        // Actualizar UI si existe la función
        if (window.updateUI) window.updateUI(currentUser.nombre);
        console.log('✅ Usuario autenticado:', currentUser.email);
        return currentUser;
    } catch (error) {
        // No hay sesión activa (error 401 es normal)
        currentUser = null;
        setCurrentUser(null);
        if (window.updateUI) window.updateUI(null);
        console.log('👤 No hay sesión activa');
        return null;
    }
}

// ============================================
// REGISTRAR USUARIO
// ============================================
export async function registrarUsuario(nombre, email, password) {
    // Validar contraseña (Appwrite requiere mínimo 8 caracteres)
    if (!password || password.length < 8) {
        return { 
            success: false, 
            message: 'La contraseña debe tener al menos 8 caracteres.' 
        };
    }
    
    try {
        // Crear usuario en Appwrite
        const response = await account.create(
            ID.unique(),
            email,
            password,
            nombre
        );
        
        console.log('Usuario creado:', response);
        
        // Iniciar sesión automáticamente después del registro
        const loginResult = await iniciarSesion(email, password);
        
        if (loginResult.success) {
            return { 
                success: true, 
                message: 'Registro exitoso. ¡Bienvenido a AXON-LAB!' 
            };
        } else {
            return { 
                success: true, 
                message: 'Registro exitoso. Ahora puedes iniciar sesión.' 
            };
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        
        // Manejar errores comunes de Appwrite
        if (error.code === 409) {
            return { success: false, message: 'El correo ya está registrado.' };
        }
        if (error.code === 400) {
            return { success: false, message: 'Datos inválidos. Verifica tu correo y contraseña.' };
        }
        return { success: false, message: error.message || 'Error en el registro.' };
    }
}

// ============================================
// INICIAR SESIÓN CON EMAIL/PASSWORD
// ============================================
export async function iniciarSesion(email, password) {
    // Validar campos
    if (!email || !password) {
        return { 
            success: false, 
            message: 'Correo y contraseña son requeridos.' 
        };
    }
    
    try {
        // Crear sesión en Appwrite
        const session = await account.createEmailPasswordSession(email, password);
        console.log('Sesión creada:', session);
        
        // Obtener datos completos del usuario
        const user = await account.get();
        
        currentUser = {
            id: user.$id,
            nombre: user.name || user.email,
            email: user.email
        };
        
        // Sincronizar con labs.js
        setCurrentUser(currentUser);
        
        // Guardar en sessionStorage para persistencia entre recargas
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Actualizar UI si existe la función
        if (window.updateUI) window.updateUI(currentUser.nombre);
        
        // Disparar evento de autenticación
        document.dispatchEvent(new CustomEvent('authChanged', { detail: { user: currentUser } }));
        
        return { 
            success: true, 
            message: `¡Bienvenido, ${currentUser.nombre}!` 
        };
        
    } catch (error) {
        console.error('Error en login:', error);
        
        // Manejar errores comunes
        if (error.code === 401) {
            return { success: false, message: 'Correo o contraseña incorrectos.' };
        }
        if (error.code === 404) {
            return { success: false, message: 'Usuario no encontrado.' };
        }
        return { 
            success: false, 
            message: 'Error al iniciar sesión. Intenta nuevamente.' 
        };
    }
}

// ============================================
// INICIAR SESIÓN CON GOOGLE
// ============================================
export async function iniciarSesionConGoogle() {
    try {
        // Redirigir a Google OAuth
        // Los parámetros son: provider, success URL, failure URL
        await account.createOAuth2Session(
            'google',
            'https://pretel1.github.io/AXON-LAB/',
            'https://pretel1.github.io/AXON-LAB/login.html'
        );
    } catch (error) {
        console.error('Error en login con Google:', error);
        return { 
            success: false, 
            message: 'Error al iniciar sesión con Google.' 
        };
    }
}

// ============================================
// CERRAR SESIÓN
// ============================================
export async function cerrarSesion() {
    try {
        // Cerrar sesión en Appwrite
        await account.deleteSession('current');
        
        // Limpiar variables locales
        currentUser = null;
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
        
        // Actualizar UI si existe la función
        if (window.updateUI) window.updateUI(null);
        
        // Disparar evento de autenticación
        document.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null } }));
        
        // Redirigir a inicio si existe la función
        if (typeof window.cambiarPagina === 'function') {
            window.cambiarPagina('inicio');
        } else {
            window.location.hash = 'inicio';
        }
        
        console.log('✅ Sesión cerrada correctamente');
        return { success: true, message: 'Sesión cerrada' };
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        return { success: false, message: error.message };
    }
}

// ============================================
// OBTENER USUARIO ACTUAL (SÍNCRONO)
// ============================================
export function obtenerUsuarioActual() {
    // Primero intentar desde memoria
    if (currentUser) return currentUser;
    
    // Si no, intentar desde sessionStorage
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
        try {
            currentUser = JSON.parse(stored);
            setCurrentUser(currentUser);
            return currentUser;
        } catch (e) {
            console.error('Error al parsear usuario guardado:', e);
        }
    }
    
    return null;
}

// ============================================
// VERIFICAR SI HAY SESIÓN ACTIVA
// ============================================
export function haySesionActiva() {
    return obtenerUsuarioActual() !== null;
}

// ============================================
// VERIFICAR AUTENTICACIÓN (ASÍNCRONO)
// ============================================
export async function isAuthenticated() {
    try {
        const user = await account.get();
        return true;
    } catch {
        return false;
    }
}

// ============================================
// ACTUALIZAR UI GLOBAL
// ============================================
export function actualizarUIGlobal() {
    const isAuth = haySesionActiva();
    const user = obtenerUsuarioActual();
    
    // Actualizar nombre en header
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) {
        userNameSpan.textContent = user?.nombre || 'Invitado';
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
}

// ============================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ============================================
window.registrarUsuario = registrarUsuario;
window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.haySesionActiva = haySesionActiva;
window.iniciarSesionConGoogle = iniciarSesionConGoogle;
window.actualizarUIGlobal = actualizarUIGlobal;

// ============================================
// INICIALIZAR AL CARGAR
// ============================================
// Inicializar autenticación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initAuth().then(() => {
            actualizarUIGlobal();
        });
    });
} else {
    initAuth().then(() => {
        actualizarUIGlobal();
    });
}

console.log('✅ Auth.js cargado con Appwrite + Google OAuth');
