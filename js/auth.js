// AXON - AUTH.JS (VERSIÓN SIN OTP PARA PRUEBAS)

async function registrarUsuario(email, password, nombre) {
    try {
        const existingUser = await firebaseAuth.fetchSignInMethodsForEmail(email);
        if (existingUser.length > 0) {
            return { success: false, message: 'Este correo ya está registrado' };
        }
        
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await firebaseDB.collection('usuarios').doc(user.uid).set({
            uid: user.uid,
            email: email,
            nombre: nombre,
            rol: 'usuario',
            verificado: true,
            fechaRegistro: new Date().toISOString()
        });
        
        return { 
            success: true, 
            message: 'Registro exitoso. Ya puedes iniciar sesión.',
            email: email 
        };
        
    } catch (error) {
        console.error('Error:', error);
        let mensaje = 'Error al registrar usuario';
        if (error.code === 'auth/email-already-in-use') mensaje = 'Este correo ya está registrado';
        if (error.code === 'auth/invalid-email') mensaje = 'Correo electrónico inválido';
        if (error.code === 'auth/weak-password') mensaje = 'La contraseña debe tener al menos 6 caracteres';
        return { success: false, message: mensaje };
    }
}

async function verificarOTP(email, otp) {
    return { success: true, message: 'Verificación automática' };
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
    return { success: true, message: 'Código reenviado (modo prueba)' };
}

async function restablecerPassword(email) {
    try {
        await firebaseAuth.sendPasswordResetEmail(email);
        return { success: true, message: 'Se ha enviado un enlace a tu correo para restablecer tu contraseña' };
    } catch (error) {
        let mensaje = 'Error al enviar el enlace';
        if (error.code === 'auth/user-not-found') mensaje = 'No existe una cuenta con este correo';
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
        return { success: true, message: 'Sesión cerrada' };
    } catch (error) {
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

console.log('✅ Auth.js cargado (MODO PRUEBA - SIN OTP)');
