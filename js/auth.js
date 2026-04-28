/**
 * AXON-LAB - Authentication & RBAC Logic
 * Desarrollado para gestión de LMS con Supabase
 */
import { supabase } from './supabase-config.js';
import { setCurrentUser } from './labs.js';

let currentUser = null;

/**
 * OBSERVADOR DE ESTADO (Auth Listener)
 * Detecta automáticamente cuando el usuario entra o sale.
 */
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log(`🔑 Auth State: ${event}`);

    if (session?.user) {
        // Al detectar sesión, inicializamos el perfil completo
        await initAuth();
    } else {
        // Limpieza total en caso de Logout
        currentUser = null;
        setCurrentUser(null);
        actualizarUIGlobal();
    }

    // Notificar al sistema que la autenticación cambió
    document.dispatchEvent(new CustomEvent('authChanged', { detail: { event } }));
});

/**
 * INICIALIZACIÓN DE USUARIO
 * Recupera el usuario de Auth y sus metadatos de la tabla 'perfiles'
 */
export async function initAuth() {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            currentUser = null;
            return null;
        }

        // Obtener datos extendidos (Rol y Nombre) desde la tabla SQL
        const { data: profile, error: profileError } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.warn("⚠️ Perfil no encontrado en SQL. Es posible que el registro esté incompleto.");
        }

        // Estructura de usuario global para la App
        currentUser = {
            id: user.id,
            nombre: profile?.nombre || user.email.split('@')[0],
            email: user.email,
            rol: profile?.rol || 'estudiante', // Default seguro
            emailVerificado: !!user.email_confirmed_at
        };

        // Sincronizar con el módulo de laboratorios y la UI
        setCurrentUser(currentUser);
        actualizarUIGlobal();

        return currentUser;

    } catch (err) {
        console.error("❌ Error de inicialización:", err.message);
        return null;
    }
}

/**
 * REGISTRO DE NUEVOS USUARIOS
 * @param {string} nombre - Nombre completo del usuario
 * @param {string} email - Correo institucional o personal
 * @param {string} password - Mínimo 8 caracteres
 */
export async function registrarUsuario(nombre, email, password) {
    if (!password || password.length < 8) {
        return { success: false, message: 'La contraseña es demasiado corta (mínimo 8).' };
    }

    try {
        // 1. Crear usuario en el servicio de Autenticación
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        // 2. Si el usuario se creó, insertar sus datos en nuestra tabla de perfiles
        if (data.user) {
            const { error: pError } = await supabase.from('perfiles').insert({
                id: data.user.id,
                nombre: nombre,
                email: email,
                rol: 'estudiante' // Todo registro nuevo es estudiante por defecto
            });

            if (pError) throw pError;
        }

        return { 
            success: true, 
            message: '✅ Registro exitoso. Por favor, verifica tu bandeja de entrada.' 
        };

    } catch (error) {
        console.error("Error en Registro:", error.message);
        return { success: false, message: error.message };
    }
}

/**
 * INICIO DE SESIÓN
 */
export async function iniciarSesion(email, password) {
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Forzar inicialización tras login exitoso
        await initAuth();

        return { success: true, message: '🎉 Acceso concedido.' };
    } catch (error) {
        return { success: false, message: 'Credenciales inválidas o correo no verificado.' };
    }
}

/**
 * CIERRE DE SESIÓN
 */
export async function cerrarSesion() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error al salir:", error.message);
    
    // Limpieza agresiva de estado
    currentUser = null;
    setCurrentUser(null);
    window.location.reload(); 
}

/**
 * RECUPERACIÓN DE CONTRASEÑA
 */
export async function recuperarPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${window.location.pathname}#restablecer`
    });

    if (error) return { success: false, message: error.message };
    return { success: true, message: '📧 Se ha enviado un enlace a tu correo.' };
}

/**
 * ACTUALIZACIÓN DE CONTRASEÑA (Desde el enlace de recuperación)
 */
export async function restablecerPassword(nuevaPassword) {
    try {
        const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
        if (error) throw error;
        return { success: true, message: '✅ Contraseña actualizada correctamente.' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * HELPERS DE ESTADO
 */
export function obtenerUsuarioActual() { return currentUser; }
export function haySesionActiva() { return !!currentUser; }

/**
 * ACTUALIZACIÓN DINÁMICA DE LA INTERFAZ
 * Controla qué elementos del menú son visibles según el usuario y su ROL
 */
export function actualizarUIGlobal() {
    const isAuth = !!currentUser;
    const user = currentUser;

    // Actualizar nombre en el Header
    const userNameDisplay = document.getElementById('userName');
    if (userNameDisplay) {
        userNameDisplay.textContent = user?.nombre || 'Invitado';
    }

    // Gestión de visibilidad de enlaces (IDs definidos en el index.html)
    const elementos = {
        'registroNavLink': !isAuth,
        'loginNavLink': !isAuth,
        'logoutNavLink': isAuth,
        // Solo profesores y admins ven el botón de subir
        'subirNavLink': isAuth && (user?.rol === 'profesor' || user?.rol === 'admin')
    };

    Object.entries(elementos).forEach(([id, visible]) => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = visible ? 'flex' : 'none';
        }
    });

    console.log(`🎨 UI Refrescada: [Auth: ${isAuth}] [Rol: ${user?.rol || 'ninguno'}]`);
}

// Ejecución inicial para recuperar sesión persistente al recargar
initAuth();
