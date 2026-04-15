// Configuración de EmailJS
const EMAILJS_CONFIG = {
    serviceId: "service_2m0odrp",           // ✅ Service ID
    templateId: "template_AQUI_TU_ID",      // ← REEMPLAZA con el Template ID de One-Time Password
    publicKey: "TU_PUBLIC_KEY_AQUI"         // ← REEMPLAZA con tu Public Key
};

// Inicializar EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

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
        // Usar las variables correctas de la plantilla
        const templateParams = {
            passcode: otp,                    // ← Variable correcta para el código
            time: obtenerFechaExpiracion(),   // ← Fecha de expiración
            to_email: email,
            to_name: nombre
        };
        
        const response = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            templateParams
        );
        
        console.log('✅ Email enviado a:', email);
        console.log('📧 Código OTP:', otp);
        return true;
        
    } catch (error) {
        console.error('❌ Error EmailJS:', error);
        return false;
    }
}

async function registrarUsuario(email, password, nombre) {
    try {
        // Verificar si el usuario ya existe
        const existingUser = await firebaseAuth.fetchSignInMethodsForEmail(email);
        if (existingUser.length > 0) {
            return { success: false, message: 'Este correo ya está registrado' };
        }
        
        // Crear usuario
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        const otp = generarOTP();
        const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 minutos
        
        // Guardar en Firestore
        await firebaseDB.collection('usuarios').doc(user.uid).set({
            uid: user.uid,
            email: email,
            nombre: nombre,
            rol: 'usuario',
            verificado: false,
            otp: otp,
            otpExpiry: otpExpiry,
            fechaRegistro: new Date().toISOString()
        });
        
        // Enviar email con OTP
        const emailEnviado = await enviarEmailOTP(email, nombre, otp);
        
        if (emailEnviado) {
            return { 
                success: true, 
                message: 'Revisa tu correo para verificar tu cuenta',
                email: email 
            };
        } else {
            return { 
                success: false, 
                message: 'Error al enviar el código. Verifica tu correo electrónico.' 
            };
        }
        
    } catch (error) {
        console.error('Error:', error);
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
        
        return { success: false, message: mensaje };
    }
}

async function verificarOTP(email, otpIngresado) {
    try {
        const usuariosRef = firebaseDB.collection('usuarios');
        const query = await usuariosRef.where('email', '==', email).get();
        
        if (query.empty) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        
        const userDoc = query.docs[0];
        const userData = userDoc.data();
        
        if (!userData.otp) {
            return { success: false, message: 'No hay código pendiente. Solicita uno nuevo.' };
        }
        
        if (userData.otp !== otpIngresado) {
            return { success: false, message: 'Código incorrecto' };
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
            return { 
                success: false, 
                message: 'Debes verificar tu cuenta. Revisa tu correo.' 
            };
        }
        
        return { 
            success: true, 
            message: `Bienvenido, ${userDoc.data().nombre}`,
            user: {
                uid: user.uid,
                email: user.email,
                nombre: userDoc.data().nombre
            }
        };
        
    } catch (error) {
        console.error('Error:', error);
        let mensaje = 'Error al iniciar sesión';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            mensaje = 'Correo o contraseña incorrectos';
        }
        return { success: false, message: mensaje };
    }
}

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
        const nuevoExpiry = Date.now() + 15 * 60 * 1000;
        
        await userDoc.ref.update({
            otp: nuevoOtp,
            otpExpiry: nuevoExpiry
        });
        
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

function obtenerUsuarioActual() {
    return firebaseAuth.currentUser;
}

function haySesionActiva() {
    return firebaseAuth.currentUser !== null;
}

// Exportar funciones globales
window.registrarUsuario = registrarUsuario;
window.verificarOTP = verificarOTP;
window.iniciarSesion = iniciarSesion;
window.reenviarOTP = reenviarOTP;
window.obtenerUsuarioActual = obtenerUsuarioActual;
window.haySesionActiva = haySesionActiva;

console.log('✅ Auth.js cargado con EmailJS configurado');
