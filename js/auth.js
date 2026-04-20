// js/auth.js
let currentUser = null;

function initAuth() {
    if (!localStorage.getItem('usuarios')) {
        localStorage.setItem('usuarios', JSON.stringify([]));
    }
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
        currentUser = JSON.parse(sessionUser);
        if (window.updateUI) window.updateUI(currentUser.nombre);
    } else {
        if (window.updateUI) window.updateUI(null);
    }
}

window.registrarUsuario = (nombre, email, password) => {
    const usuarios = JSON.parse(localStorage.getItem('usuarios'));
    if (usuarios.find(u => u.email === email)) {
        return { success: false, message: 'El correo ya está registrado.' };
    }
    const nuevoUsuario = {
        id: Date.now(),
        nombre: nombre.trim(),
        email: email.trim(),
        password: password
    };
    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    return { success: true, message: 'Registro exitoso. Ahora inicia sesión.' };
};

window.iniciarSesion = (email, password) => {
    const usuarios = JSON.parse(localStorage.getItem('usuarios'));
    const user = usuarios.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = { id: user.id, nombre: user.nombre, email: user.email };
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        if (window.updateUI) window.updateUI(currentUser.nombre);
        return { success: true, message: `Bienvenido, ${user.nombre}` };
    }
    return { success: false, message: 'Correo o contraseña incorrectos.' };
};

window.cerrarSesion = () => {
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    if (window.updateUI) window.updateUI(null);
    if (window.cambiarPagina) window.cambiarPagina('inicio');
};

window.obtenerUsuarioActual = () => currentUser;
window.haySesionActiva = () => currentUser !== null;

initAuth();
console.log('✅ Auth.js cargado (LocalStorage)');
