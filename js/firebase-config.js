/**
 * AXON - FIREBASE CONFIGURACIÓN
 * Archivo principal de conexión a Firebase
 */

// Configuración de Firebase (REEMPLAZAR CON TUS DATOS REALES)
const firebaseConfig = {
    apiKey: "AIzaSyDOGFw9IN4fmE8_JmYvykSGqUK5U1Ts0c8",
    authDomain: "axon-labs-b720e.firebaseapp.com",
    projectId: "axon-labs-b720e",
    storageBucket: "axon-labs-b720e.firebasestorage.app",
    messagingSenderId: "257085406188",
    appId: "1:257085406188:web:e50d7fa62f388512dddec9",
    measurementId: "G-6BCSZ33P8M"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Servicios globales
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configurar persistencia de sesión
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Habilitar modo offline para Firestore (opcional)
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Persistencia offline no disponible: múltiples pestañas abiertas');
        } else if (err.code == 'unimplemented') {
            console.warn('Persistencia offline no soportada por el navegador');
        }
    });

// Exportar servicios globalmente
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseStorage = storage;

console.log('🔥 Firebase inicializado correctamente');
