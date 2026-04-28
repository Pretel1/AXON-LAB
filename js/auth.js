// js/auth.js - Migrado a Supabase
import { supabase } from './supabase-config.js';
import { setCurrentUser } from './labs.js';

let currentUser = null;

// ============================================
// INICIALIZAR AUTENTICACIÓN
// ============================================
export async function initAuth() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            currentUser = null;
            setCurrentUser(null);
            if (window.updateUIGlobal) window.updateUIGlobal();
            console.log('👤 No hay sesión activa');
            return null;
        }
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        currentUser = {
            id: user.id,
            nombre: profile?.nombre || user.email,
            email: user.email,
            emailVerificado: user.email_confirmed_at !== null
        };
        
        setCurrentUser(currentUser);
        if (window.updateUIGlobal) window.updateUIGlobal();
        console.log('✅ Usuario autenticado:', currentUser.email);
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
// REGISTRAR USUARIO
// ============================================
export async function registrarUsuario(nombre, email, password) {
    if (!password || password.length < 8) {
        return { success: false, message: '⚠️ La contraseña debe tener al menos 8 caracteres.' };
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { nombre: nombre }
            }
        });
        
        if (error) throw error;
        
        console.log('✅ Usuario creado:', data.user.id);
        
        return {
            success: true,
            message: '✅ ¡Registro exitoso! Revisa tu correo para verificar tu cuenta.',
            userId: data.user.id
        };
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        
        if (error.message.includes('already registered')) {
            return { success: false, message: '❌ El correo ya está registrado.' };
        }
        return { success: false, message: error.message };
    }
}

// ============================================
// INICIAR SESIÓN
// ============================================
export async function iniciarSesion(email, password) {
    if (!email || !password) {
        return { success: false, message: '⚠️ Correo y contraseña son requeridos.' };
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        await initAuth();
        
        return {
            success: true,
            message: `🎉 ¡Bienvenido, ${currentUser.nombre}!`
        };
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        
        if (error.message.includes('Invalid login credentials')) {
            return { success: false, message: '❌ Correo o contraseña incorrectos.' };
        }
        return { success: false, message: error.message };
    }
}

// ============================================
// INICIAR SESIÓN CON GOOGLE
// ============================================
export async function iniciarSesionConGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'https://pretel1.github.io/AXON-LAB/'
        }
    });
    
    if (error) {
        console.error('❌ Error en login con Google:', error);
        alert('Error al iniciar sesión con Google: ' + error.message);
    }
}

// ============================================
// CERRAR SESIÓN
// ============================================
export async function cerrarSesion() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        currentUser = null;
        setCurrentUser(null);
        if (window.updateUIGlobal) window.updateUIGlobal();
        window.location.hash = 'inicio';
        console.log('✅ Sesión cerrada');
    }
}

// ============================================
// RECUPERAR CONTRASEÑA
// ============================================
export async function recuperarPassword(email) {
    if (!email) {
        return { success: false, message: '⚠️ Ingresa tu correo electrónico.' };
    }
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://pretel1.github.io/AXON-LAB/pages/restablecer.html'
        });
        
        if (error) throw error;
        
        return {
            success: true,
            message: '📧 Se ha enviado un enlace de recuperación a tu correo.'
        };
        
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
export function obtenerUsuarioActual() { return currentUser; }
export function haySesionActiva() { return currentUser !== null; }

export function actualizarUIGlobal() {
    const isAuth = haySesionActiva();
    const user = obtenerUsuarioActual();
    
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) {
        userNameSpan.textContent = user?.nombre || 'Invitado';
    }
    
    const registroLink = document.getElementById('registroNavLink');
    const loginLink = document.getElementById('loginNavLink');
    const logoutLink = document.getElementById('logoutNavLink');
    const subirLink = document.getElementById('subirNavLink');
    
    if (registroLink) registroLink.style.display = isAuth ? 'none' : 'flex';
    if (loginLink) loginLink.style.display = isAuth ? 'none' : 'flex';
    if (logoutLink) logoutLink.style.display = isAuth ? 'flex' : 'none';
    if (subirLink) subirLink.style.display = isAuth ? 'flex' : 'none';
}

// Exportar account para compatibilidad
export const account = supabase.auth;

// ============================================
// INICIALIZAR
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initAuth().then(() => actualizarUIGlobal());
    });
} else {
    initAuth().then(() => actualizarUIGlobal());
}

console.log('✅ Auth.js migrado a Supabase');
