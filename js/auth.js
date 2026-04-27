// js/auth.js - VERSIÓN COMPLETA CON VERIFICACIÓN + RECUPERACIÓN
import { account, ID } from './appwrite-config.js';
import { setCurrentUser } from './labs.js';

// Variable local para mantener el usuario actual
let currentUser = null;

// ============================================
// INICIALIZAR AUTENTICACIÓN
// ============================================
export async function initAuth() {
    try {
        const user = await account.get();
        currentUser = {
            id: user.$id,
            nombre: user.name || user.email,
            email: user.email,
            emailVerificado: user.emailVerification || false
        };
        setCurrentUser(currentUser);
        
        // Actualizar UI
        if (window.updateUIGlobal) window.updateUIGlobal();
        
        console.log('✅ Usuario autenticado:', currentUser.email);
        console.log('📧 Email verificado:', currentUser.emailVerificado);
        
        return currentUser;
    } catch (error) {
        currentUser = null;
        setCurrentUser(null);
        if (window.updateUIGlobal) window.updateUIGlobal();
        console.log('👤 No hay sesión activa');
        return null;
    }
}

// ============================================
// REGISTRAR USUARIO (Con verificación opcional)
// ============================================
export async function registrarUsuario(nombre, email, password) {
    // Validar contraseña
    if (!password || password.length < 8) {
        return { 
            success: false, 
            message: '⚠️ La contraseña debe tener al menos 8 caracteres.' 
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
        
        console.log('✅ Usuario creado:', response.$id);
        
        // ============================================
        // SI SMSTÁ CONFIGURADO: Enviar verificación por email
        // ============================================
        try {
            // Appwrite envía automáticamente email de verificación
            // si SMTP está configurado y emailVerification está habilitado
            await account.createVerification(
                'https://pretel1.github.io/AXON-LAB/pages/verificacion.html'
            );
            console.log('📧 Email de verificación enviado');
        } catch (verifyError) {
            console.log('ℹ️ Verificación no enviada (SMTP no configurado o ya verificado)');
        }
        
        return { 
            success: true, 
            message: '✅ ¡Registro exitoso! Se ha enviado un código de verificación a tu correo.',
            userId: response.$id,
            requiereVerificacion: true
        };
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        
        if (error.code === 409) {
            return { success: false, message: '❌ El correo ya está registrado.' };
        }
        if (error.code === 400) {
            return { success: false, message: '❌ Datos inválidos. Verifica tu correo y contraseña.' };
        }
        return { success: false, message: `❌ ${error.message || 'Error en el registro.'}` };
    }
}

// ============================================
// VERIFICAR EMAIL CON CÓDIGO
// ============================================
export async function verificarEmail(codigo, userId) {
    try {
        // Obtener usuario si no se proporcionó
        let usuarioId = userId;
        if (!usuarioId) {
            const user = await account.get();
            usuarioId = user.$id;
        }
        
        // Verificar el código
        await account.updateVerification(usuarioId, codigo);
        
        console.log('✅ Email verificado correctamente');
        
        // Actualizar estado local
        if (currentUser) {
            currentUser.emailVerificado = true;
        }
        
        return { 
            success: true, 
            message: '✅ ¡Email verificado exitosamente! Ahora puedes acceder a todas las funciones.' 
        };
        
    } catch (error) {
        console.error('❌ Error en verificación:', error);
        
        if (error.code === 400) {
            return { success: false, message: '❌ Código de verificación inválido o expirado.' };
        }
        return { success: false, message: `❌ ${error.message || 'Error al verificar email.'}` };
    }
}

// ============================================
// REENVIAR CÓDIGO DE VERIFICACIÓN
// ============================================
export async function reenviarCodigoVerificacion() {
    try {
        await account.createVerification(
            'https://pretel1.github.io/AXON-LAB/pages/verificacion.html'
        );
        return { 
            success: true, 
            message: '📧 Se ha reenviado el código de verificación a tu correo.' 
        };
    } catch (error) {
        console.error('❌ Error al reenviar código:', error);
        return { 
            success: false, 
            message: '❌ No se pudo reenviar el código. Intenta más tarde.' 
        };
    }
}

// ============================================
// INICIAR SESIÓN CON EMAIL/PASSWORD
// ============================================
export async function iniciarSesion(email, password) {
    if (!email || !password) {
        return { 
            success: false, 
            message: '⚠️ Correo y contraseña son requeridos.' 
        };
    }
    
    try {
        // Crear sesión
        const session = await account.createEmailPasswordSession(email, password);
        console.log('✅ Sesión creada:', session.$id);
        
        // Obtener datos del usuario
        const user = await account.get();
        
        currentUser = {
            id: user.$id,
            nombre: user.name || user.email,
            email: user.email,
            emailVerificado: user.emailVerification || false
        };
        
        setCurrentUser(currentUser);
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Actualizar UI
        if (window.updateUIGlobal) window.updateUIGlobal();
        document.dispatchEvent(new CustomEvent('authChanged', { detail: { user: currentUser } }));
        
        // Mensaje según verificación
        let mensaje = `🎉 ¡Bienvenido, ${currentUser.nombre}!`;
        if (!currentUser.emailVerificado) {
            mensaje += ' ⚠️ Por favor, verifica tu email para acceder a todas las funciones.';
        }
        
        return { 
            success: true, 
            message: mensaje,
            emailVerificado: currentUser.emailVerificado
        };
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        
        if (error.code === 401) {
            return { success: false, message: '❌ Correo o contraseña incorrectos.' };
        }
        if (error.code === 404) {
            return { success: false, message: '❌ Usuario no encontrado.' };
        }
        return { 
            success: false, 
            message: '❌ Error al iniciar sesión. Intenta nuevamente.' 
        };
    }
}

// ============================================
// RECUPERAR CONTRASEÑA - ENVIAR EMAIL
// ============================================
export async function recuperarPassword(email) {
    if (!email) {
        return { success: false, message: '⚠️ Ingresa tu correo electrónico.' };
    }
    
    try {
        // Enviar email de recuperación
        await account.createRecovery(
            email,
            'https://pretel1.github.io/AXON-LAB/pages/restablecer.html'
        );
        
        console.log('📧 Email de recuperación enviado a:', email);
        
        return { 
            success: true, 
            message: '📧 Se ha enviado un enlace de recuperación a tu correo. Revisa tu bandeja de entrada y spam.' 
        };
        
    } catch (error) {
        console.error('❌ Error en recuperación:', error);
        
        if (error.code === 404) {
            return { success: false, message: '❌ No existe una cuenta con ese correo.' };
        }
        return { 
            success: false, 
            message: '❌ No se pudo enviar el email de recuperación. Intenta más tarde.' 
        };
    }
}

// ============================================
// RESTABLECER CONTRASEÑA (después del email)
// ============================================
export async function restablecerPassword(userId, secret, newPassword, confirmPassword) {
    // Validar contraseñas
    if (newPassword !== confirmPassword) {
        return { success: false, message: '⚠️ Las contraseñas no coinciden.' };
    }
    
    if (newPassword.length < 8) {
        return { success: false, message: '⚠️ La contraseña debe tener al menos 8 caracteres.' };
    }
    
    try {
        // Actualizar contraseña
        await account.updateRecovery(userId, secret, newPassword, confirmPassword);
        
        console.log('✅ Contraseña restablecida correctamente');
        
        return { 
            success: true, 
            message: '✅ ¡Contraseña restablecida exitosamente! Ahora puedes iniciar sesión con tu nueva contraseña.' 
        };
        
    } catch (error) {
        console.error('❌ Error al restablecer:', error);
        return { 
            success: false, 
            message: '❌ Enlace inválido o expirado. Solicita un nuevo restablecimiento.' 
        };
    }
}

// ============================================
// INICIAR SESIÓN CON GOOGLE
// ============================================
export async function iniciarSesionConGoogle() {
    try {
        await account.createOAuth2Session(
            'google',
            'https://pretel1.github.io/AXON-LAB/',
            'https://pretel1.github.io/AXON-LAB/login.html'
        );
    } catch (error) {
        console.error('❌ Error en login con Google:', error);
        return { 
            success: false, 
            message: '❌ Error al iniciar sesión con Google.' 
        };
    }
}

// ============================================
// CERRAR SESIÓN
// ============================================
export async function cerrarSesion() {
    try {
        await account.deleteSession('current');
        
        currentUser = null;
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
        
        if (window.updateUIGlobal) window.updateUIGlobal();
        document.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null } }));
        
        if (typeof window.cambiarPagina === 'function') {
            window.cambiarPagina('inicio');
        } else {
            window.location.hash = 'inicio';
        }
        
        console.log('✅ Sesión cerrada correctamente');
        return { success: true, message: 'Sesión cerrada' };
        
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        return { success: false, message: error.message };
    }
}

// ============================================
// OBTENER USUARIO ACTUAL
// ============================================
export function obtenerUsuarioActual() {
    if (currentUser) return currentUser;
    
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
// VERIFICAR SI EL EMAIL ESTÁ VERIFICADO
// ============================================
export function emailEstaVerificado() {
    const user = obtenerUsuarioActual();
    return user?.emailVerificado === true;
}

// ============================================
// VERIFICAR SI HAY SESIÓN ACTIVA
// ============================================
export function haySesionActiva() {
    return obtenerUsuarioActual() !== null;
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
        let nombreMostrar = user?.nombre || 'Invitado';
        if (user && !user.emailVerificado) {
            nombreMostrar += ' ⚠️';
        }
        userNameSpan.textContent = nombreMostrar;
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
window.verificarEmail = verificarEmail;
window.reenviarCodigoVerificacion = reenviarCodigoVerificacion;
window.recuperarPassword = recuperarPassword;
window.restablecerPassword = restablecerPassword;
window.emailEstaVerificado = emailEstaVerificado;

// 🔥 EXPORTACIÓN DE 'account' PARA PRUEBAS EN CONSOLA
export { account };

// ============================================
// INICIALIZAR AL CARGAR
// ============================================
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

console.log('✅ Auth.js cargado con Appwrite + Google OAuth + Verificación + Recuperación');
