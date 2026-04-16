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

// Cache de URLs de iconos
const ICON_CACHE = {
    default: '/assets/img/logo.png',
    upload: '/assets/img/upload.png',
    complete: '/assets/img/complete.png',
    trophy: '/assets/img/trophy.png'
};

// ============================================
// MANEJADOR DE MENSAJES EN SEGUNDO PLANO
// ============================================
messaging.onBackgroundMessage((payload) => {
    console.log('📨 Mensaje recibido en background:', payload);
    
    const notification = payload.notification;
    const data = payload.data || {};
    
    let icon = ICON_CACHE.default;
    if (data.tipo === 'nuevo_laboratorio') icon = ICON_CACHE.upload;
    if (data.tipo === 'progreso_actualizado') icon = ICON_CACHE.complete;
    if (data.tipo === 'logro_desbloqueado') icon = ICON_CACHE.trophy;
    
    const notificationOptions = {
        body: notification?.body || 'Tienes una nueva actualización en AXON',
        icon: notification?.icon || icon,
        badge: '/assets/img/badge.png',
        vibrate: [200, 100, 200],
        silent: false,
        requireInteraction: data.requiereInteraccion === 'true',
        data: {
            url: data.url || '/',
            tipo: data.tipo,
            id: data.id,
            timestamp: Date.now(),
            click_action: notification?.click_action || data.url
        },
        actions: [
            { action: 'ver', title: '🔍 Ver ahora' },
            { action: 'cerrar', title: '❌ Cerrar' }
        ]
    };
    
    return self.registration.showNotification(
        notification?.title || 'AXON - Laboratorios Académicos',
        notificationOptions
    );
});

// ============================================
// MANEJADOR DE CLIC EN NOTIFICACIÓN
// ============================================
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notificación clickeada:', event);
    
    const notification = event.notification;
    const action = event.action;
    
    notification.close();
    
    if (action === 'cerrar') return;
    
    let urlToOpen = notification.data?.url || '/';
    
    if (action === 'ver' && notification.data?.url) {
        urlToOpen = notification.data.url;
    }
    
    if (notification.data?.tipo === 'nuevo_laboratorio' && notification.data?.id) {
        urlToOpen = `/#detalle?id=${notification.data.id}`;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                for (let client of windowClients) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// ============================================
// MANEJADOR DE INSTALACIÓN
// ============================================
self.addEventListener('install', (event) => {
    console.log('Service Worker instalado');
    event.waitUntil(
        caches.open('axon-v1').then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/css/estilo.css',
                '/css/layout.css',
                '/js/app.js'
            ]);
        })
    );
    self.skipWaiting();
});

// ============================================
// MANEJADOR DE ACTIVACIÓN
// ============================================
self.addEventListener('activate', (event) => {
    console.log('Service Worker activado');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== 'axon-v1') {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    event.waitUntil(clients.claim());
});

console.log('🔥 Firebase Messaging Service Worker cargado');
