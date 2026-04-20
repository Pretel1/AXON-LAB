// js/auth.js - Versión funcional sin OTP
window.registrarUsuario = async (email, password, nombre) => {
    try {
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        await firebaseDB.collection('usuarios').doc(userCredential.user.uid).set({
            nombre, email, rol: 'usuario', verificado: true,
            fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
        });
        await firebaseAuth.signOut();
        return { success: true, message: 'Registro exitoso. Ahora inicia sesión.', verificacionRequerida: false };
    } catch (error) {
        let mensaje = error.code === 'auth/email-already-in-use' ? 'Correo ya registrado' :
                      error.code === 'auth/weak-password' ? 'Contraseña débil (mínimo 6 caracteres)' : error.message;
        return { success: false, message: mensaje };
    }
};

window.iniciarSesion = async (email, password) => {
    try {
        const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
        const doc = await firebaseDB.collection('usuarios').doc(cred.user.uid).get();
        if (!doc.exists || !doc.data().verificado) throw new Error('Cuenta no verificada');
        return { success: true, user: { email, nombre: doc.data().nombre } };
    } catch (error) {
        return { success: false, message: 'Correo o contraseña incorrectos' };
    }
};

window.cerrarSesion = async () => {
    await firebaseAuth.signOut();
    window.location.hash = '#inicio';
    if (window.actualizarUIUsuario) window.actualizarUIUsuario(null);
};

console.log('Auth.js cargado');
