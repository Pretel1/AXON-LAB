/**
 * AXON - FIREBASE MESSAGING SERVICE WORKER
 * Para notificaciones push en segundo plano
 * 
 * Project ID: axon-labs-b720e
 * Sender ID: 257085406188
 */

// Importar Firebase
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

// Configuración de Firebase (CON TUS DATOS REALES)
const firebaseConfig = {
    apiKey: "AIzaSyDOGFw9IN4fmE8_JmYvykSGqUK5U1Ts0c8",
    authDomain: "axon-labs-b720e.firebaseapp.com",
    projectId: "axon-labs-b720e",
    storageBucket: "axon-labs-b720e.firebasestorage.app",
    messagingSenderId: "257085406188",
    appId: "1:257085406188:web:e50d7fa62f388512dddec9"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar FCM
const messaging = firebase.messaging();

// ============================================
// MANEJADOR DE INSTALACIÓN
// ============================================
self.addEventListener('install', (event) => {
    console.log('✅ Service Worker instalado');
    self.skipWaiting();
});

// ============================================
// MANEJADOR DE ACTIVACIÓN
// ============================================
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activado');
    event.waitUntil(clients.claim());
});

// ============================================
// MANEJADOR DE MENSAJES EN SEGUNDO PLANO
// ============================================
messaging.onBackgroundMessage((payload) => {
    console.log('📨 Mensaje recibido en background:', payload);
    
    const notificationTitle = payload.notification?.title || 'AXON - Laboratorios Académicos';
    const notificationOptions = {
        body: payload.notification?.body || 'Tienes una nueva actualización',
        icon: '/assets/img/logo.png',
        badge: '/assets/img/badge.png',
        vibrate: [200, 100, 200],
        data: {
            url: payload.data?.url || '/',
            click_action: payload.notification?.click_action
        }
    };
    
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ============================================
// MANEJADOR DE CLIC EN NOTIFICACIÓN
// ============================================
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notificación clickeada:', event);
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                for (let client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

console.log('🔥 Firebase Messaging Service Worker cargado correctamente');
