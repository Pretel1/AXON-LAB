// js/firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyDOGFw9IN4fmE8_JmYvykSGqUK5U1Ts0c8",
    authDomain: "axon-labs-b720e.firebaseapp.com",
    projectId: "axon-labs-b720e",
    storageBucket: "axon-labs-b720e.appspot.com",
    messagingSenderId: "257085406188",
    appId: "1:257085406188:web:e50d7fa62f388512dddec9"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
db.enablePersistence({ synchronizeTabs: true }).catch(e => console.warn(e.code));

// Variables globales necesarias
window.auth = auth;
window.db = db;
window.storage = storage;
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseStorage = storage;

console.log("✅ Firebase listo (firebase-config.js)");
