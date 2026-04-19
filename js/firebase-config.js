/**
 * AXON - FIREBASE CONFIGURACIÓN
 */

const firebaseConfig = {
    apiKey: "AIzaSyDOGFw9IN4fmE8_JmYvykSGqUK5U1Ts0c8",
    authDomain: "axon-labs-b720e.firebaseapp.com",
    projectId: "axon-labs-b720e",
    storageBucket: "axon-labs-b720e.appspot.com",
    messagingSenderId: "257085406188",
    appId: "1:257085406188:web:e50d7fa62f388512dddec9"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Servicios
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Persistencia login
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Persistencia Firestore (segura)
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    console.warn("Persistencia offline:", err.code);
  });

// Global
window.auth = auth;
window.db = db;
window.storage = storage;

console.log("🔥 Firebase listo AXON");
