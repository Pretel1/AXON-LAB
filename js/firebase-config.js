/**
 * AXON - FIREBASE CONFIGURACIÓN (sin redeclaración)
 */

// Usar una variable global si no existe
if (typeof firebaseConfig === 'undefined') {
    var firebaseConfig = {
        apiKey: "AIzaSyDOGFw9IN4fmE8_JmYvykSGqUK5U1Ts0c8",
        authDomain: "axon-labs-b720e.firebaseapp.com",
        projectId: "axon-labs-b720e",
        storageBucket: "axon-labs-b720e.appspot.com",
        messagingSenderId: "257085406188",
        appId: "1:257085406188:web:e50d7fa62f388512dddec9"
    };
}

// Inicializar solo si no hay instancia
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Exponer servicios y alias
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

window.auth = auth;
window.db = db;
window.storage = storage;
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseStorage = storage;

console.log("✅ firebase-config.js cargado (sin conflictos)");
