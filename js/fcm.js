/**
 * AXON - FIREBASE CLOUD MESSAGING (FCM)
 * Sistema de notificaciones push para el repositorio
 * 
 * Datos del proyecto:
 * - ID del remitente: 257085406188
 * - Project ID: axon-labs-b720e
 */

// ============================================
// CONFIGURACIÓN INICIAL
// ============================================

// Inicializar FCM (se llama después de que Firebase está listo)
let messaging = null;

function initFCM() {
    if (!firebase.messaging) {
        console.log('❌ Firebase Messaging no disponible');
        return null;
    }
    
    try {
        messaging = firebase.messaging();
        console.log('✅ FCM inicializado');
        return messaging;
    } catch (error) {
        console.error('❌ Error al inicializar FCM:', error);
        return null;
    }
}

// VAPID Key - OBTENER DE FIREBASE CONSOLE
// Ve a: Project Settings → Cloud Messaging → Web configuration
const VAPID_KEY = "TU_VAPID_KEY_AQUI"; // ⚠️ REEMPLAZAR CON TU VAPID KEY

// ============================================
// 1. VERIFICAR SOPORTE DEL NAVEGADOR
// ============================================
function isNotificationSupported() {
    const supported = 'Notification' in window && 
                      'serviceWorker' in navigator && 
                      'PushManager' in window;
    
    if (!supported) {
        console.log('❌ Notificaciones no soportadas en este navegador');
    }
    
    return supported;
}

// ============================================
// 2. SOLICITAR PERMISO DE NOTIFICACIONES
// ============================================
async function solicitarPermisoNotificaciones() {
    if (!isNotificationSupported()) {
        return { success: false, message: 'Notificaciones no soportadas' };
    }
    
    // Si ya tiene permiso
    if (Notification.permission === 'granted') {
        console.log('✅ Permiso ya concedido');
        const token = await registrarTokenFCM();
        return { success: true, message: 'Permiso ya concedido', token };
    }
    
    // Si está denegado, no pedir de nuevo
    if (Notification.permission === 'denied') {
        console.log('❌ Permiso denegado por el usuario');
        return { success: false, message: 'Permiso denegado. Habilita las notificaciones en la configuración de tu navegador.' };
    }
    
    try {
        // Solicitar permiso
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('✅ Permiso de notificaciones concedido');
            const token = await registrarTokenFCM();
            
            // Mostrar notificación de bienvenida
            mostrarNotificacionLocal('🔔 Notificaciones activadas', 'Recibirás alertas sobre nuevos laboratorios y tu progreso', 'success');
            
            return { success: true, message: 'Notificaciones activadas', token };
        } else {
            console.log('❌ Permiso denegado');
            return { success: false, message: 'Permiso denegado' };
        }
        
    } catch (error) {
        console.error('❌ Error al solicitar permiso:', error);
        return { success: false, message: error.message };
    }
}

// ============================================
// 3. REGISTRAR TOKEN FCM
// ============================================
async function registrarTokenFCM() {
    if (!messaging) {
        messaging = initFCM();
        if (!messaging) return null;
    }
    
    if (!VAPID_KEY || VAPID_KEY === 'TU_VAPID_KEY_AQUI') {
        console.warn('⚠️ VAPID Key no configurada. Las notificaciones no funcionarán.');
        return null;
    }
    
    try {
        // Obtener token
        const token = await messaging.getToken({
            vapidKey: VAPID_KEY
        });
        
        if (token) {
            console.log('✅ Token FCM obtenido:', token.substring(0, 20) + '...');
            
            // Guardar token en Firestore
            const user = firebaseAuth.currentUser;
            if (user) {
                await guardarTokenEnFirestore(user.uid, token);
            }
            
            // Guardar en localStorage
            localStorage.setItem('fcm_token', token);
            localStorage.setItem('fcm_token_date', new Date().toISOString());
            
            return token;
        } else {
            console.log('⚠️ No se pudo obtener el token FCM');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error al obtener token FCM:', error);
        
        // Errores comunes
        if (error.code === 'messaging/permission-blocked') {
            mostrarNotificacionLocal('⚠️ Permiso bloqueado', 'Habilita las notificaciones en la configuración de tu navegador', 'warning');
        } else if (error.code === 'messaging/unsupported-browser') {
            console.log('Navegador no soportado para FCM');
        }
        
        return null;
    }
}

// ============================================
// 4. GUARDAR TOKEN EN FIRESTORE
// ============================================
async function guardarTokenEnFirestore(usuarioId, token) {
    try {
        // Guardar en colección de tokens
        await firebaseDB.collection('fcm_tokens').doc(token).set({
            usuarioId: usuarioId,
            token: token,
            fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
            ultimoUso: firebase.firestore.FieldValue.serverTimestamp(),
            activo: true,
            userAgent: navigator.userAgent,
            plataforma: getPlatform()
        }, { merge: true });
        
        // También actualizar en el documento del usuario
        await firebaseDB.collection('usuarios').doc(usuarioId).update({
            fcmToken: token,
            fcmTokenActualizado: firebase.firestore.FieldValue.serverTimestamp(),
            notificacionesActivas: true
        });
        
        console.log('✅ Token guardado en Firestore');
        
    } catch (error) {
        console.error('❌ Error al guardar token:', error);
    }
}

// ============================================
// 5. OBTENER PLATAFORMA DEL USUARIO
// ============================================
function getPlatform() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet/i.test(ua)) return 'tablet';
    return 'desktop';
}

// ============================================
// 6. ESCUCHAR MENSAJES EN FOREGROUND
// ============================================
function escucharMensajesForeground() {
    if (!messaging) {
        messaging = initFCM();
        if (!messaging) return;
    }
    
    messaging.onMessage((payload) => {
        console.log('📨 Mensaje recibido en foreground:', payload);
        
        const notification = payload.notification;
        const data = payload.data || {};
        
        if (notification) {
            mostrarNotificacionPush(
                notification.title || 'AXON',
                notification.body || '',
                notification.icon || '/assets/img/logo.png',
                data.url || null
            );
        }
        
        // Manejar diferentes tipos de notificaciones
        switch (data.tipo) {
            case 'nuevo_laboratorio':
                actualizarListaLaboratorios();
                mostrarAlertaNuevoLaboratorio(data);
                break;
            case 'progreso_actualizado':
                actualizarEstadisticasProgreso();
                break;
            case 'comentario':
                mostrarAlertaComentario(data);
                break;
        }
    });
}

// ============================================
// 7. MOSTRAR NOTIFICACIÓN LOCAL
// ============================================
function mostrarNotificacionPush(titulo, cuerpo, icono = null, url = null) {
    if (Notification.permission !== 'granted') return;
    
    const options = {
        body: cuerpo,
        icon: icono || '/assets/img/logo.png',
        badge: '/assets/img/badge.png',
        vibrate: [200, 100, 200],
        silent: false,
        timestamp: Date.now(),
        data: {
            url: url,
            time: Date.now(),
            fecha: new Date().toISOString()
        },
        actions: [
            { action: 'ver', title: '🔍 Ver ahora' },
            { action: 'cerrar', title: '❌ Cerrar' }
        ]
    };
    
    const notification = new Notification(titulo, options);
    
    notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        if (url) {
            if (url.startsWith('#')) {
                if (typeof window.cambiarPagina === 'function') {
                    window.cambiarPagina(url.substring(1));
                } else {
                    window.location.href = url;
                }
            } else {
                window.open(url, '_blank');
            }
        }
        
        notification.close();
    };
    
    notification.onclose = () => {
        console.log('Notificación cerrada');
    };
    
    // Auto-cerrar después de 8 segundos
    setTimeout(() => {
        if (notification.close) notification.close();
    }, 8000);
}

// ============================================
// 8. MOSTRAR NOTIFICACIÓN LOCAL (SIN PUSH)
// ============================================
function mostrarNotificacionLocal(titulo, cuerpo, tipo = 'info') {
    // Usar alerta visual si no hay permiso
    if (Notification.permission !== 'granted') {
        mostrarAlertaVisual(titulo, cuerpo, tipo);
        return;
    }
    
    const options = {
        body: cuerpo,
        icon: `/assets/img/${tipo}.png`,
        badge: '/assets/img/badge.png',
        silent: tipo === 'success' ? false : true
    };
    
    const notification = new Notification(titulo, options);
    
    setTimeout(() => notification.close(), 5000);
}

// ============================================
// 9. MOSTRAR ALERTA VISUAL
// ============================================
function mostrarAlertaVisual(titulo, cuerpo, tipo = 'info') {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo}`;
    alerta.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 350px;
        cursor: pointer;
        animation: slideInRight 0.3s ease;
        box-shadow: var(--shadow-lg);
    `;
    
    const iconos = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    alerta.innerHTML = `
        <strong>${iconos[tipo] || '📢'} ${titulo}</strong>
        <p style="margin-top: 5px; font-size: 0.875rem;">${cuerpo}</p>
    `;
    
    alerta.onclick = () => alerta.remove();
    
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        if (alerta.parentNode) alerta.remove();
    }, 6000);
}

// ============================================
// 10. MOSTRAR ALERTA DE NUEVO LABORATORIO
// ============================================
function mostrarAlertaNuevoLaboratorio(data) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-info';
    alerta.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 350px;
        cursor: pointer;
        animation: slideInRight 0.3s ease;
        border-left: 4px solid var(--color-primary);
    `;
    alerta.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 2rem;">📚</span>
            <div>
                <strong>Nuevo laboratorio disponible</strong>
                <div style="font-size: 0.875rem; margin-top: 3px;">${data.nombre || 'Laboratorio'}</div>
                <small style="color: var(--text-muted);">por ${data.autor || 'Usuario'}</small>
            </div>
        </div>
    `;
    
    alerta.onclick = () => {
        if (typeof window.cambiarPagina === 'function') {
            window.cambiarPagina('laboratorios');
        } else {
            window.location.href = '#laboratorios';
        }
        alerta.remove();
    };
    
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        if (alerta.parentNode) alerta.remove();
    }, 10000);
}

// ============================================
// 11. MOSTRAR ALERTA DE COMENTARIO
// ============================================
function mostrarAlertaComentario(data) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-info';
    alerta.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 350px;
        cursor: pointer;
        animation: slideInRight 0.3s ease;
    `;
    alerta.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 2rem;">💬</span>
            <div>
                <strong>Nuevo comentario</strong>
                <div style="font-size: 0.875rem; margin-top: 3px;">En: ${data.laboratorio}</div>
                <small>${data.autor}: "${data.texto?.substring(0, 50)}${data.texto?.length > 50 ? '...' : ''}"</small>
            </div>
        </div>
    `;
    
    alerta.onclick = () => {
        if (typeof window.cambiarPagina === 'function') {
            window.cambiarPagina('detalle', { id: data.labId });
        }
        alerta.remove();
    };
    
    document.body.appendChild(alerta);
    setTimeout(() => alerta.remove(), 8000);
}

// ============================================
// 12. ACTUALIZAR LISTA DE LABORATORIOS
// ============================================
function actualizarListaLaboratorios() {
    // Recargar la página actual si es laboratorios
    const currentPage = window.location.hash.substring(1).split('?')[0];
    if (currentPage === 'laboratorios' || currentPage === 'inicio') {
        if (typeof window.cargarPagina === 'function') {
            window.cargarPagina(currentPage);
        }
    }
}

// ============================================
// 13. ACTUALIZAR ESTADÍSTICAS DE PROGRESO
// ============================================
function actualizarEstadisticasProgreso() {
    const event = new CustomEvent('progresoActualizado');
    document.dispatchEvent(event);
}

// ============================================
// 14. SUSCRIBIRSE A TEMAS
// ============================================
async function suscribirseATema(tema) {
    const user = firebaseAuth.currentUser;
    if (!user) {
        mostrarNotificacionLocal('⚠️ Inicia sesión', 'Debes iniciar sesión para activar notificaciones', 'warning');
        return false;
    }
    
    const token = localStorage.getItem('fcm_token');
    if (!token) {
        await solicitarPermisoNotificaciones();
        return false;
    }
    
    try {
        // Guardar suscripción en Firestore
        await firebaseDB.collection('suscripciones_temas').doc(`${user.uid}_${tema}`).set({
            usuarioId: user.uid,
            usuarioEmail: user.email,
            tema: tema,
            token: token,
            fechaSuscripcion: firebase.firestore.FieldValue.serverTimestamp(),
            activo: true
        }, { merge: true });
        
        console.log(`✅ Suscrito al tema: ${tema}`);
        mostrarNotificacionLocal('✅ Suscripción activada', `Recibirás notificaciones de ${tema}`, 'success');
        return true;
        
    } catch (error) {
        console.error(`❌ Error al suscribirse a ${tema}:`, error);
        return false;
    }
}

// ============================================
// 15. CANCELAR SUSCRIPCIÓN A TEMAS
// ============================================
async function cancelarSuscripcionTema(tema) {
    const user = firebaseAuth.currentUser;
    if (!user) return false;
    
    try {
        await firebaseDB.collection('suscripciones_temas').doc(`${user.uid}_${tema}`).delete();
        console.log(`✅ Suscripción cancelada: ${tema}`);
        mostrarNotificacionLocal('🔕 Notificaciones desactivadas', `Ya no recibirás notificaciones de ${tema}`, 'info');
        return true;
        
    } catch (error) {
        console.error(`❌ Error al cancelar suscripción:`, error);
        return false;
    }
}

// ============================================
// 16. OBTENER ESTADO DE SUSCRIPCIONES
// ============================================
async function obtenerSuscripcionesUsuario() {
    const user = firebaseAuth.currentUser;
    if (!user) return [];
    
    try {
        const snapshot = await firebaseDB.collection('suscripciones_temas')
            .where('usuarioId', '==', user.uid)
            .where('activo', '==', true)
            .get();
        
        const suscripciones = [];
        snapshot.forEach(doc => {
            suscripciones.push(doc.data().tema);
        });
        
        return suscripciones;
        
    } catch (error) {
        console.error('❌ Error al obtener suscripciones:', error);
        return [];
    }
}

// ============================================
// 17. NOTIFICACIÓN DE EVENTOS DEL SISTEMA
// ============================================
function notificarEventoSistema(tipo, datos = {}) {
    switch (tipo) {
        case 'laboratorio_subido':
            if (Notification.permission === 'granted') {
                mostrarNotificacionPush(
                    '📤 Nuevo laboratorio',
                    `"${datos.nombre}" ha sido publicado por ${datos.autor}`,
                    '/assets/img/upload.png',
                    '#laboratorios'
                );
            }
            // También suscribir a otros usuarios si es necesario
            break;
            
        case 'progreso_actualizado':
            if (datos.porcentaje === 100) {
                mostrarNotificacionPush(
                    '🎉 ¡Laboratorio completado!',
                    `Has completado "${datos.nombre}" al 100%`,
                    '/assets/img/complete.png',
                    `#detalle?id=${datos.id}`
                );
            } else if (datos.porcentaje === 50) {
                mostrarNotificacionLocal('📊 Medio camino', `Llevas un 50% completado en "${datos.nombre}"`, 'info');
            }
            break;
            
        case 'bienvenida':
            mostrarNotificacionPush(
                '👋 Bienvenido a AXON',
                'Explora, aprende y comparte conocimiento con la comunidad',
                '/assets/img/logo.png',
                '#inicio'
            );
            break;
            
        case 'logro_desbloqueado':
            mostrarNotificacionPush(
                '🏆 ¡Logro desbloqueado!',
                `Has obtenido: ${datos.logro}`,
                '/assets/img/trophy.png',
                '#perfil'
            );
            break;
    }
}

// ============================================
// 18. ELIMINAR TOKEN (al cerrar sesión)
// ============================================
async function eliminarTokenFCM() {
    const token = localStorage.getItem('fcm_token');
    if (!token) return;
    
    try {
        // Eliminar de Firestore
        await firebaseDB.collection('fcm_tokens').doc(token).delete();
        
        // Limpiar localStorage
        localStorage.removeItem('fcm_token');
        localStorage.removeItem('fcm_token_date');
        
        console.log('✅ Token FCM eliminado');
        
    } catch (error) {
        console.error('❌ Error al eliminar token:', error);
    }
}

// ============================================
// 19. INICIALIZAR TODO FCM
// ============================================
async function initFCMCompleto() {
    if (!isNotificationSupported()) {
        console.log('⚠️ Notificaciones no soportadas en este navegador');
        return false;
    }
    
    try {
        // Registrar Service Worker
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('✅ Service Worker registrado:', registration.scope);
        }
        
        // Inicializar FCM
        messaging = initFCM();
        
        if (messaging) {
            // Configurar service worker
            const registration = await navigator.serviceWorker.ready;
            await messaging.useServiceWorker(registration);
            
            // Escuchar mensajes
            escucharMensajesForeground();
            
            // Si ya hay permiso, registrar token
            if (Notification.permission === 'granted') {
                await registrarTokenFCM();
            }
            
            console.log('🔥 FCM completamente inicializado');
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Error al inicializar FCM:', error);
        return false;
    }
}

// ============================================
// 20. BOTÓN FLOTANTE PARA ACTIVAR NOTIFICACIONES
// ============================================
function crearBotonNotificaciones() {
    // Verificar si ya existe
    if (document.getElementById('fcm-fab')) return;
    
    const fab = document.createElement('button');
    fab.id = 'fcm-fab';
    fab.innerHTML = '🔔';
    fab.setAttribute('aria-label', 'Activar notificaciones');
    fab.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: var(--shadow-glow);
        font-size: 24px;
        z-index: 100;
        transition: all 0.3s ease;
        display: none;
    `;
    
    fab.onmouseenter = () => {
        fab.style.transform = 'scale(1.1)';
    };
    fab.onmouseleave = () => {
        fab.style.transform = 'scale(1)';
    };
    
    fab.onclick = async () => {
        const result = await solicitarPermisoNotificaciones();
        if (result.success) {
            fab.style.display = 'none';
        } else {
            mostrarNotificacionLocal('⚠️ No se pudieron activar', result.message, 'warning');
        }
    };
    
    document.body.appendChild(fab);
    
    // Mostrar solo si no hay permiso
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        fab.style.display = 'flex';
        fab.style.alignItems = 'center';
        fab.style.justifyContent = 'center';
        
        // Ocultar después de 10 segundos si no interactúa
        setTimeout(() => {
            if (fab.style.display !== 'none' && Notification.permission === 'default') {
                fab.style.opacity = '0.7';
            }
        }, 10000);
    }
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.initFCM = initFCMCompleto;
window.solicitarPermisoNotificaciones = solicitarPermisoNotificaciones;
window.registrarTokenFCM = registrarTokenFCM;
window.mostrarNotificacionPush = mostrarNotificacionPush;
window.mostrarNotificacionLocal = mostrarNotificacionLocal;
window.notificarEventoSistema = notificarEventoSistema;
window.suscribirseATema = suscribirseATema;
window.cancelarSuscripcionTema = cancelarSuscripcionTema;
window.obtenerSuscripcionesUsuario = obtenerSuscripcionesUsuario;
window.eliminarTokenFCM = eliminarTokenFCM;
window.crearBotonNotificaciones = crearBotonNotificaciones;

console.log('📨 Módulo FCM cargado correctamente');