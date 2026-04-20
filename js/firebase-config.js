/**
 * AXON - FIREBASE CONFIGURACIÓN COMPLETA
 * Este archivo inicializa Firebase y expone las variables globales
 * necesarias para auth.js, app.js, labs.js, etc.
 */

// Configuración del proyecto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDOGFw9IN4fmE8_JmYvykSGqUK5U1Ts0c8",
    authDomain: "axon-labs-b720e.firebaseapp.com",
    projectId: "axon-labs-b720e",
    storageBucket: "axon-labs-b720e.appspot.com",
    messagingSenderId: "257085406188",
    appId: "1:257085406188:web:e50d7fa62f388512dddec9"
};

// Inicializar Firebase solo si no está ya inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("🔥 Firebase inicializado desde firebase-config.js");
} else {
    console.log("🔥 Firebase ya estaba inicializado");
}

// Obtener referencias a los servicios
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configurar persistencia de sesión (localStorage)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch(error => console.warn("Error al configurar persistencia:", error));

// Habilitar persistencia offline de Firestore (opcional, pero mejora la experiencia)
db.enablePersistence({ synchronizeTabs: true })
    .catch(err => {
        if (err.code === 'failed-precondition') {
            console.warn("Persistencia offline no disponible (múltiples pestañas abiertas)");
        } else if (err.code === 'unimplemented') {
            console.warn("Persistencia offline no soportada por el navegador");
        } else {
            console.warn("Error al habilitar persistencia offline:", err);
        }
    });

// ============================================
// EXPOSICIÓN DE VARIABLES GLOBALES
// ============================================
// Variables principales
window.auth = auth;
window.db = db;
window.storage = storage;

// ALIAS necesarios para compatibilidad con app.js, auth.js y otros scripts
window.firebaseAuth = auth;      // ← usado por app.js, auth.js
window.firebaseDB = db;          // ← usado por app.js, labs.js, progreso.js
window.firebaseStorage = storage; // ← usado para subir archivos

// (Opcional) Alias adicionales si algún script usa 'firebase' directamente
window.firebase = firebase;

console.log("✅ Servicios de Firebase listos y expuestos globalmente");
console.log("   - firebaseAuth disponible:", !!window.firebaseAuth);
console.log("   - firebaseDB disponible:", !!window.firebaseDB);
console.log("   - firebaseStorage disponible:", !!window.firebaseStorage);
