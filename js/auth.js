/**
 * AXON-LAB - Authentication & RBAC Logic
 * Gestión de identidades y control de acceso basado en roles.
 */
import { supabase } from './supabase-config.js';
import { setCurrentUser } from './labs.js';

let currentUser = null;

// ============================================
// 1. OBSERVADOR DE ESTADO (Auth Listener)
// ============================================
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log(`🔑 Auth State: ${event}`);

    if (session?.user) {
        await initAuth();
    } else {
        currentUser = null;
        setCurrentUser(null);
        actualizarUIGlobal();
    }

    // Notificar cambio de estado para que app.js y router.js reaccionen
    document.dispatchEvent(new CustomEvent('authChanged', { detail: { event } }));
});

// ============================================
// 2. INICIALIZACIÓN DE USUARIO
// ============================================
export async function initAuth() {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            currentUser = null;
            return null;
        }

        // Recuperar perfil extendido desde la tabla SQL
        const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.warn("⚠️ Perfil SQL no encontrado. Es posible que el registro esté incompleto.");
        }

        // Objeto de usuario global
        currentUser = {
            id: user.id,
            nombre: profile?.nombre || user.email.split('@')[0],
            email: user.email,
            rol: profile?.rol || 'estudiante', 
            emailVerificado: !!user.email_confirmed_at
        };

        // Sincronizar con otros módulos
        setCurrentUser(currentUser);
        actualizarUIGlobal();

        return currentUser;

    } catch (err) {
        console.error("❌ Error de inicialización:", err.message);
        return null;
    }
}

// ============================================
// 3. REGISTRO DE USUARIOS
// ============================================
export async function registrarUsuario(nombre, email, password) {
    if (!password || password.length < 8) {
        return { success: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
    }

    try {
        // Registro en Supabase Auth
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
            // Inserción en tabla de perfiles pública
            const { error: pError } = await supabase.from('perfiles').insert({
                id: data.user.id,
                nombre: nombre,
                email: email,
                rol: 'estudiante' // Rol por defecto
            });
            if (pError) throw pError;
        }

        return { 
            success: true, 
            message: 'Registro exitoso. Revisa tu correo para verificar la cuenta.' 
        };

    } catch (error) {
        console.error("Error en Registro:", error.message);
        return { success: false, message: error.message };
    }
}

// ============================================
// 4. INICIO Y CIERRE DE SESIÓN
// ============================================
export async function iniciarSesion(email, password) {
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        await initAuth();
        return { success: true, message: '🎉 Acceso concedido.' };
    } catch (error) {
        return { success: false, message: 'Credenciales inválidas o correo no verificado.' };
    }
}

export async function cerrarSesion() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        setCurrentUser(null);
        window.location.hash = 'login';
        window.location.reload(); 
    } catch (error) {
        console.error("Error al salir:", error.message);
    }
}

// ============================================
// 5. GESTIÓN DINÁMICA DE LA INTERFAZ (UI)
// ============================================
export function actualizarUIGlobal() {
    const isAuth = !!currentUser;
    const user = currentUser;

    // Actualizar nombre en el Header
    const nameDisplay = document.getElementById('userName');
    if (nameDisplay) {
        nameDisplay.textContent = user?.nombre || 'Invitado';
    }

    // Configuración de visibilidad de enlaces
    const navElements = {
        'registroNavLink': !isAuth,
        'loginNavLink': !isAuth,
        'logoutNavLink': isAuth,
        // Solo profesores y administradores ven el acceso a subida
        'subirNavLink': isAuth && (user?.rol === 'profesor' || user?.rol === 'admin')
    };

    Object.entries(navElements).forEach(([id, visible]) => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = visible ? 'flex' : 'none';
        }
    });

    console.log(`🎨 UI Sincronizada: [Auth: ${isAuth}] [Rol: ${user?.rol || 'none'}]`);
}

// ============================================
// 6. HELPERS Y EXPORTACIONES GLOBALES
// ============================================
export function obtenerUsuarioActual() { return currentUser; }
export function haySesionActiva() { return !!currentUser; }

// Exponer para uso del Router
window.actualizarUIGlobal = actualizarUIGlobal;

// Inicialización inmediata al cargar el script
initAuth();
