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

// Configuración de Firebase (COMPLETAR CON TUS DATOS)
// Ve a: https://console.firebase.google.com/project/axon-labs-b720e/settings/general
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",           // ← COMPLETAR
    authDomain: "axon-labs-b720e.firebaseapp.com",
    projectId: "axon-labs-b720e",
    storageBucket: "axon-labs-b720e.firebasestorage.app",
    messagingSenderId: "257085406188",
    appId: "TU_APP_ID_AQUI",              // ← COMPLETAR
    measurementId: "TU_MEASUREMENT_ID"    // ← OPCIONAL
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
    
    // Determinar icono según tipo
    let icon = ICON_CACHE.default;
    if (data.tipo === 'nuevo_laboratorio') icon = ICON_CACHE.upload;
    if (data.tipo === 'progreso_actualizado') icon = ICON_CACHE.complete;
    if (data.tipo === 'logro_desbloqueado') icon = ICON_CACHE.trophy;
    
    // Construir opciones de notificación
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
    
    // Mostrar notificación
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
    
    // Cerrar la notificación
    notification.close();
    
    // Manejar acciones
    if (action === 'cerrar') {
        return;
    }
    
    // Obtener URL de destino
    let urlToOpen = notification.data?.url || '/';
    
    // Si hay acción "ver", usar la URL de la notificación
    if (action === 'ver' && notification.data?.url) {
        urlToOpen = notification.data.url;
    }
    
    // Si es un tipo específico, construir URL
    if (notification.data?.tipo === 'nuevo_laboratorio' && notification.data?.id) {
        urlToOpen = `/#detalle?id=${notification.data.id}`;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Verificar si ya hay una ventana abierta
                for (let client of windowClients) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Si no, abrir nueva ventana
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// ============================================
// MANEJADOR DE INSTALACIÓN DEL SERVICE WORKER
// ============================================
self.addEventListener('install', (event) => {
    console.log('Service Worker instalado');
    
    // Cachear recursos estáticos
    event.waitUntil(
        caches.open('axon-v1').then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/css/estilo.css',
                '/css/layout.css',
                '/js/app.js',
                '/assets/img/logo.png',
                '/assets/img/badge.png'
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
    
    // Limpiar caches antiguos
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

// ============================================
// MANEJADOR DE FETCH (para caché)
// ============================================
self.addEventListener('fetch', (event) => {
    // Solo cachear recursos estáticos
    if (event.request.method !== 'GET') return;
    
    const url = new URL(event.request.url);
    
    // No cachear llamadas a API
    if (url.pathname.includes('/api/')) return;
    
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).then((response) => {
                // Cachear solo respuestas exitosas
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open('axon-v1').then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            });
        })
    );
});

console.log('🔥 Firebase Messaging Service Worker cargado');