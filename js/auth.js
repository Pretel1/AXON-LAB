/**
 * AXON - AUTH.JS
 * Autenticación completa: registro, login, OTP, recuperar contraseña
 */

// ============================================
// VARIABLES DE CONFIGURACIÓN
// ============================================
const OTP_EXPIRY_MINUTES = 15;

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function generarOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOTPExpiry() {
    return Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000);
}

// ============================================
// REGISTRO DE USUARIO
// ============================================
async function registrarUsuario(email, password, nombre) {
    try {
        // Verificar si el usuario ya existe
        const methods = await firebaseAuth.fetchSignInMethodsForEmail(email);
        if (methods.length > 0) {
            return { success: false, message: 'Este correo ya está registrado' };
        }
        
        // Crear usuario en Firebase Auth
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Generar OTP
        const otp = generarOTP();
        const otpExpiry = getOTPExpiry();
        
        // Guardar en Firestore
        await firebaseDB.collection('usuarios').doc(user.uid).set({
            uid: user.uid,
            email: email,
            nombre: nombre,
            rol: 'usuario',
            verificado: false,
            otp: otp,
            otpExpiry: otpExpiry,
            fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
            avatar: '👤'
        });
        
        // Enviar OTP por email (usando EmailJS)
        const emailEnviado = await enviarEmailOTP(email, nombre, otp);
        
        if (emailEnviado) {
            // Guardar email temporalmente para verificación
            localStorage.setItem('axon_temp_registro', JSON.stringify({ email: email, timestamp: Date.now() }));
            
            return {
                success: true,
                message: `Se ha enviado un código de verificación a ${email}. Revisa tu bandeja de entrada.`,
                email: email,
                verificacionRequerida: true
            };
        } else {
            // Si falla el email, marcar como verificado automáticamente (modo desarrollo)
            await firebaseDB.collection('usuarios').doc(user.uid).update({
                verificado: true,
                otp: null,
                otpExpiry: null
            });
            
            return {
                success: true,
                message: 'Registro exitoso. Ya puedes iniciar sesión.',
                email: email,
                verificacionRequerida: false
            };
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
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
            case 'auth/network-request-failed':
                mensaje = 'Error de red. Verifica tu conexión a internet.';
                break;
        }
        
        return { success: false, message: mensaje };
    }
}

// ============================================
// ENVIAR EMAIL CON OTP (EmailJS)
// ============================================
async function enviarEmailOTP(email, nombre, otp) {
    // Si EmailJS no está configurado, simular envío
    if (typeof emailjs === 'undefined') {
        console.log('📧 EmailJS no configurado. Código OTP:', otp);
        console.log('⚠️ En producción, configura EmailJS con tus credenciales');
        return true;
    }
    
    try {
        const templateParams = {
            to_email: email,
            to_name: nombre,
            otp: otp,
            time: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toLocaleString(),
            subject: '🔐 Código de verificación AXON'
        };
        
        // Configuración de EmailJS (REEMPLAZAR CON TUS DATOS)
        const EMAILJS_CONFIG = {
            serviceId: "service_2m0odrp",
            templateId: "template_OTP_AXON",
            publicKey: "TU_PUBLIC_KEY"
        };
        
        emailjs.init(EMAILJS_CONFIG.publicKey);
        await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, templateParams);
        
        console.log('✅ Email enviado a:', email);
        return true;
        
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        console.log('📧 Código OTP para desarrollo:', otp);
        return false;
    }
}

// ============================================
// VERIFICAR OTP
// ============================================
async function verificarOTP(email, otpIngresado) {
    try {
        // Buscar usuario por email
        const usuariosRef = firebaseDB.collection('usuarios');
        const query = await usuariosRef.where('email', '==', email).get();
        
        if (query.empty) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        
        const userDoc = query.docs[0];
        const userData = userDoc.data();
        const user = firebaseAuth.currentUser;
        
        // Verificar OTP
        if (!userData.otp) {
            return { success: false, message: 'No hay código pendiente. Solicita uno nuevo.' };
        }
        
        if (userData.otp !== otpIngresado) {
            return { success: false, message: 'Código incorrecto. Verifica e intenta nuevamente.' };
        }
        
        if (Date.now() > userData.otpExpiry) {
            return { success: false, message: 'El código ha expirado. Solicita uno nuevo.' };
        }
        
        // Marcar como verificado
        await userDoc.ref.update({
            verificado: true,
            otp: null,
            otpExpiry: null
        });
        
        return { success: true, message: '¡Cuenta verificada exitosamente! Ahora puedes iniciar sesión.' };
        
    } catch (error) {
        console.error('Error en verificación:', error);
        return { success: false, message: 'Error al verificar el código' };
    }
}

// ============================================
// REENVIAR OTP
// ============================================
async function reenviarOTP(email) {
    try {
        const usuariosRef = firebaseDB.collection('usuarios');
        const query = await usuariosRef.where('email', '==', email).get();
        
        if (query.empty) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        
        const userDoc = query.docs[0];
        const userData = userDoc.data();
        
        const nuevoOtp = generarOTP();
        const nuevoExpiry = getOTPExpiry();
        
        await userDoc.ref.update({
            otp: nuevoOtp,
            otpExpiry: nuevoExpiry
        });
        
        const emailEnviado = await enviarEmailOTP(email, userData.nombre, nuevoOtp);
        
        if (emailEnviado) {
            return { success: true, message: 'Se ha reenviado un nuevo código a tu correo.' };
        } else {
            return { success: false, message: 'Error al reenviar el código. Intenta nuevamente.' };
        }
        
    } catch (error) {
        console.error('Error al reenviar OTP:', error);
        return { success: false, message: 'Error al reenviar el código' };
    }
}

// ============================================
// INICIAR SESIÓN
// ============================================
async function iniciarSesion(email, password) {
    try {
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Verificar si está verificado en Firestore
        const userDoc = await firebaseDB.collection('usuarios').doc(user.uid).get();
        
        if (!userDoc.exists) {
            await firebaseAuth.signOut();
            return { success: false, message: 'Usuario no encontrado en la base de datos' };
        }
        
        if (!userDoc.data().verificado) {
            await firebaseAuth.signOut();
            return {
                success: false,
                message: 'Debes verificar tu cuenta. Revisa tu correo electrónico.'
            };
        }
        
        // Actualizar última conexión
        await userDoc.ref.update({
            ultimaConexion: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return {
            success: true,
            message: `Bienvenido, ${userDoc.data().nombre}`,
            user: {
                uid: user.uid,
                email: user.email,
                nombre: userDoc.data().nombre,
                rol: userDoc.data().rol
            }
        };
        
    } catch (error) {
        console.error('Error en login:', error);
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
            case 'auth/too-many-requests':
                mensaje = 'Demasiados intentos. Intenta más tarde.';
                break;
            case 'auth/network-request-failed':
                mensaje = 'Error de red. Verifica tu conexión.';
                break;
        }
        
        return { success: false, message: mensaje };
    }
}

// ============================================
// RESTABLECER CONTRASEÑA
// ============================================
async function restablecerPassword(email) {
    try {
        // Verificar si el usuario existe
        const methods = await firebaseAuth.fetchSignInMethodsForEmail(email);
        if (methods.length === 0) {
            return { success: false, message: 'No existe una cuenta con este correo electrónico' };
        }
        
        await firebaseAuth.sendPasswordResetEmail(email);
        
        return {
            success: true,
            message: 'Se ha enviado un enlace a tu correo para restablecer tu contraseña'
        };
        
    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        let mensaje = 'Error al enviar el enlace';
        
        switch (error.code) {
            case 'auth/user-not-found':
                mensaje = 'No existe una cuenta con este correo electrónico';
                break;
            case 'auth/invalid-email':
                mensaje = 'Correo electrónico inválido';
                break;
            case 'auth/too-many-requests':
                mensaje = 'Demasiados intentos. Intenta más tarde.';
                break;
        }
        
        return { success: false, message: mensaje };
    }
}

// ============================================
// CERRAR SESIÓN
// ============================================
async function cerrarSesion() {
    try {
        await firebaseAuth.signOut();
        
        if (typeof window.actualizarUIUsuario === 'function') {
            await window.actualizarUIUsuario(null);
        }
        
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion('✅ Sesión cerrada exitosamente', 'success');
        }
        
        return { success: true, message: 'Sesión cerrada' };
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        return { success: false, message: 'Error al cerrar sesión' };
    }
}

// ============================================
// OBTENER USUARIO ACTUAL
// ============================================
function obtenerUsuarioActual() {
    return firebaseAuth.currentUser;
}

function haySesionActiva() {
    return firebaseAuth.currentUser !== null;
}

// ============================================
// ACTUALIZAR DATOS DEL USUARIO
// ============================================
async function actualizarDatosUsuario(data) {
    const user = firebaseAuth.currentUser;
    if (!user) {
        return { success: false, message: 'Debes iniciar sesión' };
    }
    
    try {
        await firebaseDB.collection('usuarios').doc(user.uid).update(data);
        return { success: true, message: 'Datos actualizados' };
    } catch (error) {
        console.error('Error al actualizar datos:', error);
        return { success: false, message: error.message };
    }
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.registrarUsuario = registrarUsuario;
window.verificarOTP = verificarOTP;
window.reenviarOTP = reenviarOTP;
window.iniciarSesion = iniciarSesion;
window.restablecerPassword = restablecerPassword;
window.cerrarSesion = cerrarSesion;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.haySesionActiva = haySesionActiva;
window.actualizarDatosUsuario = actualizarDatosUsuario;

console.log('✅ Auth.js cargado correctamente');
