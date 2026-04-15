/**
 * AXON - AUTH.JS
 * Autenticación con Firebase + Notificaciones FCM
 */

// ============================================
// REGISTRO DE USUARIO
// ============================================
async function registrarUsuario(email, password, nombre) {
    try {
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await firebaseDB.collection('usuarios').doc(user.uid).set({
            uid: user.uid,
            email: email,
            nombre: nombre,
            rol: 'usuario',
            verificado: user.emailVerified,
            fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
            avatar: '👤',
            notificacionesActivas: false
        });
        
        await user.sendEmailVerification();
        
        console.log('✅ Usuario registrado:', email);
        
        return {
            success: true,
            message: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.',
            user: user
        };
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        let mensaje = 'Error al registrar usuario';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                mensaje = 'Este correo ya está registrado';
                break;
            case 'auth/invalid-email':
                mensaje = 'Correo electrónico inválido';
                break;
            case 'auth/weak-password':
                mensaje = 'La contraseña debe tener al menos 6 caracteres';
                break;
        }
        
        return {
            success: false,
            message: mensaje,
            error: error.code
        };
    }
}

// ============================================
// INICIO DE SESIÓN (CON NOTIFICACIONES)
// ============================================
async function iniciarSesion(email, password) {
    try {
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
            await firebaseAuth.signOut();
            return {
                success: false,
                message: 'Debes verificar tu cuenta. Revisa tu correo electrónico.'
            };
        }
        
        const userDoc = await firebaseDB.collection('usuarios').doc(user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : { nombre: email.split('@')[0] };
        
        // Registrar token FCM después del login
        if (typeof window.registrarTokenFCM === 'function') {
            await window.registrarTokenFCM();
        }
        
        // Mostrar notificación de bienvenida
        if (typeof window.notificarEventoSistema === 'function') {
            window.notificarEventoSistema('bienvenida', {});
        }
        
        // Crear botón de notificaciones si no hay permiso
        if (typeof window.crearBotonNotificaciones === 'function' && Notification.permission !== 'granted') {
            setTimeout(() => window.crearBotonNotificaciones(), 1000);
        }
        
        console.log('✅ Sesión iniciada:', email);
        
        return {
            success: true,
            message: `Bienvenido, ${userData.nombre}`,
            user: {
                uid: user.uid,
                email: user.email,
                nombre: userData.nombre,
                rol: userData.rol
            }
        };
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        let mensaje = 'Error al iniciar sesión';
        
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                mensaje = 'Correo o contraseña incorrectos';
                break;
            case 'auth/invalid-email':
                mensaje = 'Correo electrónico inválido';
                break;
            case 'auth/user-disabled':
                mensaje = 'Esta cuenta ha sido deshabilitada';
                break;
        }
        
        return {
            success: false,
            message: mensaje,
            error: error.code
        };
    }
}

// ============================================
// CERRAR SESIÓN (ELIMINAR TOKEN FCM)
// ============================================
async function cerrarSesion() {
    try {
        // Eliminar token FCM
        if (typeof window.eliminarTokenFCM === 'function') {
            await window.eliminarTokenFCM();
        }
        
        await firebaseAuth.signOut();
        console.log('✅ Sesión cerrada');
        
        return {
            success: true,
            message: 'Sesión cerrada exitosamente'
        };
        
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        return {
            success: false,
            message: 'Error al cerrar sesión'
        };
    }
}

// ============================================
// REENVIAR EMAIL DE VERIFICACIÓN
// ============================================
async function reenviarVerificacion() {
    const user = firebaseAuth.currentUser;
    if (!user) {
        return {
            success: false,
            message: 'No hay sesión activa'
        };
    }
    
    try {
        await user.sendEmailVerification();
        return {
            success: true,
            message: 'Email de verificación reenviado. Revisa tu bandeja de entrada.'
        };
        
    } catch (error) {
        console.error('❌ Error al reenviar:', error);
        return {
            success: false,
            message: 'Error al reenviar el email de verificación'
        };
    }
}

// ============================================
// RESTABLECER CONTRASEÑA
// ============================================
async function restablecerPassword(email) {
    try {
        await firebaseAuth.sendPasswordResetEmail(email);
        return {
            success: true,
            message: 'Email de restablecimiento enviado. Revisa tu correo.'
        };
        
    } catch (error) {
        console.error('❌ Error al restablecer:', error);
        let mensaje = 'Error al enviar email de restablecimiento';
        
        if (error.code === 'auth/user-not-found') {
            mensaje = 'No existe una cuenta con este correo';
        }
        
        return {
            success: false,
            message: mensaje
        };
    }
}

// ============================================
// OBTENER USUARIO ACTUAL
// ============================================
function obtenerUsuarioActual() {
    const user = firebaseAuth.currentUser;
    if (!user) return null;
    
    return {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
    };
}

// ============================================
// VERIFICAR SESIÓN ACTIVA
// ============================================
function haySesionActiva() {
    return firebaseAuth.currentUser !== null;
}

// ============================================
// OBTENER DATOS DEL USUARIO
// ============================================
async function obtenerDatosUsuario(uid) {
    try {
        const userDoc = await firebaseDB.collection('usuarios').doc(uid).get();
        if (userDoc.exists) {
            return userDoc.data();
        }
        return null;
        
    } catch (error) {
        console.error('❌ Error al obtener datos:', error);
        return null;
    }
}

// ============================================
// ACTUALIZAR UI SEGÚN AUTENTICACIÓN
// ============================================
function actualizarUIUsuario() {
    const user = firebaseAuth.currentUser;
    const userNameSpan = document.getElementById('userName');
    const registroLink = document.getElementById('registroNavLink');
    const loginLink = document.getElementById('loginNavLink');
    const logoutLink = document.getElementById('logoutNavLink');
    const subirLink = document.getElementById('subirNavLink');
    
    if (user) {
        firebaseDB.collection('usuarios').doc(user.uid).get().then(doc => {
            const nombre = doc.exists ? doc.data().nombre : user.email.split('@')[0];
            if (userNameSpan) userNameSpan.textContent = nombre;
        });
        
        if (registroLink) registroLink.style.display = 'none';
        if (loginLink) loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'flex';
        if (subirLink) subirLink.style.display = 'flex';
        
    } else {
        if (userNameSpan) userNameSpan.textContent = 'Invitado';
        if (registroLink) registroLink.style.display = 'flex';
        if (loginLink) loginLink.style.display = 'flex';
        if (logoutLink) logoutLink.style.display = 'none';
        if (subirLink) subirLink.style.display = 'none';
    }
}

// ============================================
// ESCUCHAR CAMBIOS EN AUTENTICACIÓN
// ============================================
function initAuthListener() {
    firebaseAuth.onAuthStateChanged(async (user) => {
        actualizarUIUsuario();
        
        const event = new CustomEvent('authStateChanged', {
            detail: { user: user }
        });
        document.dispatchEvent(event);
        
        if (user) {
            console.log('👤 Usuario conectado:', user.email);
        } else {
            console.log('👤 Usuario desconectado');
        }
    });
}

// Exportar funciones
window.registrarUsuario = registrarUsuario;
window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;
window.reenviarVerificacion = reenviarVerificacion;
window.restablecerPassword = restablecerPassword;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.haySesionActiva = haySesionActiva;
window.obtenerDatosUsuario = obtenerDatosUsuario;
window.actualizarUIUsuario = actualizarUIUsuario;
window.initAuthListener = initAuthListener;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    initAuthListener();
});