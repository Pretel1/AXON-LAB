// AXON - AUTH.JS
// Autenticación completa: registro con OTP, login y recuperar contraseña

// Configuración de EmailJS (REEMPLAZAR CON TUS DATOS)
const EMAILJS_CONFIG = {
    serviceId: "service_2m0odrp",
    templateId: "template_AQUI_TU_ID",
    publicKey: "TU_PUBLIC_KEY_AQUI"
};

if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_CONFIG.publicKey);
}

function generarOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function obtenerFechaExpiracion() {
    const fecha = new Date();
    fecha.setMinutes(fecha.getMinutes() + 15);
    return fecha.toLocaleString();
}

async function enviarEmailOTP(email, nombre, otp) {
    try {
        const templateParams = {
            passcode: otp,
            time: obtenerFechaExpiracion(),
            to_email: email,
            to_name: nombre
        };
        const response = await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, templateParams);
        console.log('✅ Email enviado a:', email);
        return true;
    } catch (error) {
        console.error('❌ Error EmailJS:', error);
        return false;
    }
}

async function registrarUsuario(email, password, nombre) {
    try {
        const existingUser = await firebaseAuth.fetchSignInMethodsForEmail(email);
        if (existingUser.length > 0) {
            return { success: false, message: 'Este correo ya está registrado' };
        }
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        const otp = generarOTP();
        const otpExpiry = Date.now() + 15 * 60 * 1000;
        await firebaseDB.collection('usuarios').doc(user.uid).set({
            uid: user.uid, email: email, nombre: nombre, rol: 'usuario',
            verificado: false, otp: otp, otpExpiry: otpExpiry, fechaRegistro: new Date().toISOString()
        });
        const emailEnviado = await enviarEmailOTP(email, nombre, otp);
        if (emailEnviado) {
            return { success: true, message: 'Revisa tu correo para verificar tu cuenta', email: email };
        } else {
            return { success: false, message: 'Error al enviar el código. Verifica tu correo electrónico.' };
        }
    } catch (error) {
        console.error('Error:', error);
        let mensaje = 'Error al registrar usuario';
        if (error.code === 'auth/email-already-in-use') mensaje = 'Este correo ya está registrado';
        if (error.code === 'auth/invalid-email') mensaje = 'Correo electrónico inválido';
        if (error.code === 'auth/weak-password') mensaje = 'La contraseña debe tener al menos 6 caracteres';
        return { success: false, message: mensaje };
    }
}

async function verificarOTP(email, otpIngresado) {
    try {
        const usuariosRef = firebaseDB.collection('usuarios');
        const query = await usuariosRef.where('email', '==', email).get();
        if (query.empty) return { success: false, message: 'Usuario no encontrado' };
        const userDoc = query.docs[0];
        const userData = userDoc.data();
        if (!userData.otp) return { success: false, message: 'No hay código pendiente. Solicita uno nuevo.' };
        if (userData.otp !== otpIngresado) return { success: false, message: 'Código incorrecto' };
        if (Date.now() > userData.otpExpiry) return { success: false, message: 'El código ha expirado. Solicita uno nuevo.' };
        await userDoc.ref.update({ verificado: true, otp: null, otpExpiry: null });
        return { success: true, message: 'Cuenta verificada exitosamente' };
    } catch (error) {
        console.error('Error:', error);
        return { success: false, message: 'Error al verificar' };
    }
}

async function iniciarSesion(email, password) {
    try {
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        const userDoc = await firebaseDB.collection('usuarios').doc(user.uid).get();
        if (!userDoc.exists) {
            await firebaseAuth.signOut();
            return { success: false, message: 'Usuario no encontrado' };
        }
        if (!userDoc.data().verificado) {
            await firebaseAuth.signOut();
            return { success: false, message: 'Debes verificar tu cuenta. Revisa tu correo.' };
        }
        return {
            success: true,
            message: `Bienvenido, ${userDoc.data().nombre}`,
            user: { uid: user.uid, email: user.email, nombre: userDoc.data().nombre }
        };
    } catch (error) {
        console.error('Error:', error);
        let mensaje = 'Error al iniciar sesión';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') mensaje = 'Correo o contraseña incorrectos';
        if (error.code === 'auth/invalid-email') mensaje = 'Correo electrónico inválido';
        return { success: false, message: mensaje };
    }
}

async function reenviarOTP(email) {
    try {
        const usuariosRef = firebaseDB.collection('usuarios');
        const query = await usuariosRef.where('email', '==', email).get();
        if (query.empty) return { success: false, message: 'Usuario no encontrado' };
        const userDoc = query.docs[0];
        const userData = userDoc.data();
        const nuevoOtp = generarOTP();
        const nuevoExpiry = Date.now() + 15 * 60 * 1000;
        await userDoc.ref.update({ otp: nuevoOtp, otpExpiry: nuevoExpiry });
        const emailEnviado = await enviarEmailOTP(email, userData.nombre, nuevoOtp);
        if (emailEnviado) {
            return { success: true, message: 'Código reenviado a tu correo' };
        } else {
            return { success: false, message: 'Error al reenviar el código' };
        }
    } catch (error) {
        console.error('Error:', error);
        return { success: false, message: 'Error al reenviar' };
    }
}

async function restablecerPassword(email) {
    try {
        await firebaseAuth.sendPasswordResetEmail(email);
        return { success: true, message: 'Se ha enviado un enlace a tu correo para restablecer tu contraseña' };
    } catch (error) {
        console.error('Error:', error);
        let mensaje = 'Error al enviar el enlace';
        if (error.code === 'auth/user-not-found') mensaje = 'No existe una cuenta con este correo electrónico';
        if (error.code === 'auth/invalid-email') mensaje = 'Correo electrónico inválido';
        return { success: false, message: mensaje };
    }
}

function obtenerUsuarioActual() {
    return firebaseAuth.currentUser;
}

function haySesionActiva() {
    return firebaseAuth.currentUser !== null;
}

async function cerrarSesion() {
    try {
        await firebaseAuth.signOut();
        if (typeof window.actualizarUIUsuario === 'function') window.actualizarUIUsuario();
        return { success: true, message: 'Sesión cerrada exitosamente' };
    } catch (error) {
        console.error('Error:', error);
        return { success: false, message: 'Error al cerrar sesión' };
    }
}

window.registrarUsuario = registrarUsuario;
window.verificarOTP = verificarOTP;
window.iniciarSesion = iniciarSesion;
window.reenviarOTP = reenviarOTP;
window.restablecerPassword = restablecerPassword;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.haySesionActiva = haySesionActiva;
window.cerrarSesion = cerrarSesion;

console.log('✅ Auth.js cargado con recuperación de contraseña');
