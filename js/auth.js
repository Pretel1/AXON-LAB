// js/auth.js
import { supabase } from './supabase-config.js';
import { setCurrentUser } from './labs.js';

let currentUser = null;

// ============================================
// ESCUCHAR CAMBIOS DE SESIÓN (CLAVE)
// ============================================
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔄 Auth change:', event);

    if (session?.user) {
        await initAuth();
    } else {
        currentUser = null;
        setCurrentUser(null);
        actualizarUIGlobal();
    }
});

// ============================================
// INICIALIZAR AUTENTICACIÓN
// ============================================
export async function initAuth() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        currentUser = null;
        setCurrentUser(null);
        return null;
    }

    // 🔥 CAMBIO: usar "perfiles"
    const { data: profile } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();

    currentUser = {
        id: user.id,
        nombre: profile?.nombre || user.email,
        email: user.email,
        emailVerificado: !!user.email_confirmed_at
    };

    setCurrentUser(currentUser);
    actualizarUIGlobal();

    return currentUser;
}

// ============================================
// REGISTRAR USUARIO (FIX CLAVE)
// ============================================
export async function registrarUsuario(nombre, email, password) {
    if (!password || password.length < 8) {
        return { success: false, message: '⚠️ Mínimo 8 caracteres.' };
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        // 🔥 CREAR PERFIL (IMPORTANTE)
        if (data.user) {
            await supabase.from('perfiles').insert({
                id: data.user.id,
                nombre,
                email
            });
        }

        return {
            success: true,
            message: '✅ Revisa tu correo para verificar tu cuenta.'
        };

    } catch (error) {
        if (error.message.includes('already registered')) {
            return { success: false, message: '❌ Correo ya registrado' };
        }
        return { success: false, message: error.message };
    }
}

// ============================================
// LOGIN
// ============================================
export async function iniciarSesion(email, password) {
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        await initAuth();

        return {
            success: true,
            message: '🎉 Bienvenido'
        };

    } catch (error) {
        return {
            success: false,
            message: '❌ Credenciales incorrectas'
        };
    }
}

// ============================================
// GOOGLE LOGIN
// ============================================
export async function iniciarSesionConGoogle() {
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'https://pretel1.github.io/AXON-LAB/'
        }
    });
}

// ============================================
// LOGOUT
// ============================================
export async function cerrarSesion() {
    await supabase.auth.signOut();
}

// ============================================
// RESET PASSWORD
// ============================================
export async function recuperarPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://pretel1.github.io/AXON-LAB/pages/restablecer.html'
    });

    if (error) {
        return { success: false, message: error.message };
    }

    return {
        success: true,
        message: '📧 Revisa tu correo'
    };
}

// ============================================
// HELPERS
// ============================================
export function obtenerUsuarioActual() { return currentUser; }
export function haySesionActiva() { return !!currentUser; }

// ============================================
// UI GLOBAL
// ============================================
export function actualizarUIGlobal() {
    const isAuth = haySesionActiva();
    const user = obtenerUsuarioActual();

    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) userNameSpan.textContent = user?.nombre || 'Invitado';

    const registro = document.getElementById('registroNavLink');
    const login = document.getElementById('loginNavLink');
    const logout = document.getElementById('logoutNavLink');
    const subir = document.getElementById('subirNavLink');

    if (registro) registro.style.display = isAuth ? 'none' : 'flex';
    if (login) login.style.display = isAuth ? 'none' : 'flex';
    if (logout) logout.style.display = isAuth ? 'flex' : 'none';
    if (subir) subir.style.display = isAuth ? 'flex' : 'none';
}

// ============================================
// INIT
// ============================================
initAuth();

console.log('✅ Auth listo PRO');
