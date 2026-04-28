import { supabase } from './supabase-config.js';
import { setCurrentUser } from './labs.js';

let currentUser = null;

supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
        await initAuth();
    } else {
        currentUser = null;
        setCurrentUser(null);
        actualizarUIGlobal();
    }
});

export async function initAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase.from('perfiles').select('*').eq('id', user.id).single();

    currentUser = {
        id: user.id,
        nombre: profile?.nombre || user.email,
        email: user.email,
        rol: profile?.rol || 'estudiante',
        emailVerificado: !!user.email_confirmed_at
    };

    setCurrentUser(currentUser);
    actualizarUIGlobal();
    return currentUser;
}

export async function registrarUsuario(nombre, email, password) {
    if (!password || password.length < 8) return { success: false, message: '⚠️ Mínimo 8 caracteres.' };
    
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
            await supabase.from('perfiles').insert({
                id: data.user.id,
                nombre,
                email,
                rol: 'estudiante'
            });
        }
        return { success: true, message: '✅ Revisa tu correo para verificar tu cuenta.' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

export async function iniciarSesion(email, password) {
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await initAuth();
        return { success: true, message: '🎉 Bienvenido' };
    } catch (error) {
        return { success: false, message: '❌ Credenciales incorrectas' };
    }
}

export async function cerrarSesion() { await supabase.auth.signOut(); }

export async function recuperarPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/AXON-LAB/#restablecer'
    });
    if (error) return { success: false, message: error.message };
    return { success: true, message: '📧 Revisa tu correo' };
}

export async function restablecerPassword(nuevaPassword) {
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Contraseña actualizada' };
}

export function obtenerUsuarioActual() { return currentUser; }
export function haySesionActiva() { return !!currentUser; }

export function actualizarUIGlobal() {
    const isAuth = haySesionActiva();
    const user = obtenerUsuarioActual();
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) userNameSpan.textContent = user?.nombre || 'Invitado';

    const rolesMap = { 'estudiante': 'none', 'profesor': 'flex', 'admin': 'flex' };
    const canUpload = isAuth && user ? rolesMap[user.rol] : 'none';

    document.getElementById('registroNavLink')?.style.setProperty('display', isAuth ? 'none' : 'flex');
    document.getElementById('loginNavLink')?.style.setProperty('display', isAuth ? 'none' : 'flex');
    document.getElementById('logoutNavLink')?.style.setProperty('display', isAuth ? 'flex' : 'none');
    document.getElementById('subirNavLink')?.style.setProperty('display', canUpload);
}
initAuth();
