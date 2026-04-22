// js/auth.js - Versión con Appwrite
import { account, ID, updateCurrentUser, currentUser as appwriteCurrentUser } from './appwrite-config.js';

// Variable local para mantener compatibilidad
let currentUser = null;

// Inicializar auth
export async function initAuth() {
    try {
        // Intentar obtener sesión actual de Appwrite
        const user = await account.get();
        currentUser = {
            id: user.$id,
            nombre: user.name || user.email,
            email: user.email
        };
        if (window.updateUI) window.updateUI(currentUser.nombre);
        return currentUser;
    } catch (error) {
        // No hay sesión activa
        currentUser = null;
        if (window.updateUI) window.updateUI(null);
        return null;
    }
}

// Registrar usuario con email y contraseña
export async function registrarUsuario(nombre, email, password) {
    try {
        // Crear usuario en Appwrite
        const response = await account.create(
            ID.unique(),
            email,
            password,
            nombre
        );
        
        // Iniciar sesión automáticamente después del registro
        await iniciarSesion(email, password);
        
        return { 
            success: true, 
            message: 'Registro exitoso. ¡Bienvenido a AXON-LAB!' 
        };
    } catch (error) {
        console.error('Error en registro:', error);
        
        // Manejar errores comunes
        if (error.code === 409) {
            return { success: false, message: 'El correo ya está registrado.' };
        }
        return { success: false, message: error.message || 'Error en el registro.' };
    }
}

// Iniciar sesión con email y contraseña
export async function iniciarSesion(email, password) {
    try {
        // Crear sesión en Appwrite
        const session = await account.createEmailPasswordSession(email, password);
        
        // Obtener datos del usuario
        const user = await account.get();
        
        currentUser = {
            id: user.$id,
            nombre: user.name || user.email,
            email: user.email
        };
        
        // Guardar en sessionStorage para persistencia
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Actualizar UI
        if (window.updateUI) window.updateUI(currentUser.nombre);
        
        return { 
            success: true, 
            message: `Bienvenido, ${currentUser.nombre}` 
        };
    } catch (error) {
        console.error('Error en login:', error);
        return { 
            success: false, 
            message: 'Correo o contraseña incorrectos.' 
        };
    }
}

// Iniciar sesión con Google
export async function iniciarSesionConGoogle() {
    try {
        // Redirigir a Google OAuth
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

// Cerrar sesión
export async function cerrarSesion() {
    try {
        // Cerrar sesión en Appwrite
        await account.deleteSession('current');
        
        // Limpiar variables locales
        currentUser = null;
        sessionStorage.removeItem('currentUser');
        
        // Actualizar UI
        if (window.updateUI) window.updateUI(null);
        
        // Redirigir a inicio
        if (window.cambiarPagina) window.cambiarPagina('inicio');
        
        return { success: true };
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        return { success: false, message: error.message };
    }
}

// Obtener usuario actual (versión síncrona para compatibilidad)
export function obtenerUsuarioActual() {
    return currentUser;
}

// Verificar si hay sesión activa
export function haySesionActiva() {
    return currentUser !== null;
}

// Verificar si el usuario está autenticado (versión async)
export async function isAuthenticated() {
    try {
        await account.get();
        return true;
    } catch {
        return false;
    }
}

// Exportar funciones al objeto window para compatibilidad con código existente
window.registrarUsuario = registrarUsuario;
window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.haySesionActiva = haySesionActiva;
window.iniciarSesionConGoogle = iniciarSesionConGoogle;

// Inicializar al cargar
initAuth();

console.log('✅ Auth.js cargado con Appwrite + Google OAuth');
