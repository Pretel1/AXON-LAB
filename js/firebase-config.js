/**
 * AXON - FIREBASE CONFIGURATION
 * Configuración del proyecto: axon-labs
 * Proyecto ID: axon-labs-b720e
 */

// Configuración de Firebase (COMPLETAR CON TUS DATOS)
// Ve a: https://console.firebase.google.com/project/axon-labs-b720e/settings/general
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",           // ← COMPLETAR
    authDomain: "axon-labs-b720e.firebaseapp.com",
    projectId: "axon-labs-b720e",
    storageBucket: "axon-labs-b720e.firebasestorage.app",
    messagingSenderId: "TU_SENDER_ID",   // ← COMPLETAR
    appId: "TU_APP_ID",                  // ← COMPLETAR
    measurementId: "TU_MEASUREMENT_ID"   // ← OPCIONAL
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar servicios
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configurar persistencia de autenticación
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Exportar servicios globalmente
window.firebaseApp = firebase;
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseStorage = storage;

console.log('🔥 Firebase inicializado correctamente');
console.log('📁 Proyecto:', firebaseConfig.projectId);