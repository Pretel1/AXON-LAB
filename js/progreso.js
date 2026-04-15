/**
 * AXON - PROGRESO.JS
 * Gestión de progreso de usuarios con Firestore y notificaciones
 * 
 * Proyecto: axon-labs-b720e
 */

const COLLECTION_PROGRESO = 'progreso';

// ============================================
// OBTENER PROGRESO DE UN LABORATORIO
// ============================================
async function obtenerProgreso(labId, userId = null) {
    const uid = userId || firebaseAuth.currentUser?.uid;
    
    if (!uid) {
        return { modulos: [], porcentaje: 0, completado: false };
    }
    
    try {
        const docRef = firebaseDB.collection(COLLECTION_PROGRESO).doc(`${uid}_${labId}`);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            return {
                modulos: data.modulos || [],
                porcentaje: data.porcentaje || 0,
                completado: data.porcentaje === 100,
                ultimaActualizacion: data.ultimaActualizacion,
                fechaInicio: data.fechaInicio,
                fechaCompletado: data.fechaCompletado
            };
        }
        
        return { modulos: [], porcentaje: 0, completado: false };
        
    } catch (error) {
        console.error('❌ Error al obtener progreso:', error);
        return { modulos: [], porcentaje: 0, completado: false };
    }
}

// ============================================
// GUARDAR PROGRESO (CON NOTIFICACIONES)
// ============================================
async function guardarProgreso(labId, modulosCompletados) {
    const user = firebaseAuth.currentUser;
    
    if (!user) {
        if (typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal('Debes iniciar sesión para guardar tu progreso', 'warning');
        }
        return {
            success: false,
            message: 'Debes iniciar sesión para guardar progreso'
        };
    }
    
    try {
        // Obtener laboratorio para conocer total de módulos
        const laboratorio = await window.obtenerLaboratorioPorId(labId);
        if (!laboratorio) {
            return {
                success: false,
                message: 'Laboratorio no encontrado'
            };
        }
        
        const totalModulos = laboratorio.modulos?.length || 1;
        const porcentajeAnterior = (await obtenerProgreso(labId, user.uid)).porcentaje;
        const nuevoPorcentaje = Math.round((modulosCompletados.length / totalModulos) * 100);
        
        // Verificar si se acaba de completar
        const seCompleto = nuevoPorcentaje === 100 && porcentajeAnterior < 100;
        
        const progresoData = {
            usuarioId: user.uid,
            usuarioEmail: user.email,
            laboratorioId: labId,
            laboratorioNombre: laboratorio.nombre,
            modulos: modulosCompletados,
            porcentaje: nuevoPorcentaje,
            ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Si es la primera vez que se guarda progreso, agregar fecha de inicio
        const progresoExistente = await firebaseDB.collection(COLLECTION_PROGRESO).doc(`${user.uid}_${labId}`).get();
        if (!progresoExistente.exists) {
            progresoData.fechaInicio = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // Si se completó, agregar fecha de completado
        if (seCompleto) {
            progresoData.fechaCompletado = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        await firebaseDB.collection(COLLECTION_PROGRESO)
            .doc(`${user.uid}_${labId}`)
            .set(progresoData, { merge: true });
        
        // NOTIFICAR PROGRESO ACTUALIZADO
        if (typeof window.notificarEventoSistema === 'function') {
            window.notificarEventoSistema('progreso_actualizado', {
                nombre: laboratorio.nombre,
                id: labId,
                porcentaje: nuevoPorcentaje,
                completado: seCompleto
            });
        }
        
        // Mostrar notificación local si se completó
        if (seCompleto && typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal(`🎉 ¡Felicidades! Completaste "${laboratorio.nombre}"`, 'success', 5000);
        }
        
        // Disparar evento de progreso actualizado
        const event = new CustomEvent('progresoActualizado', {
            detail: {
                labId: labId,
                porcentaje: nuevoPorcentaje,
                completado: seCompleto
            }
        });
        document.dispatchEvent(event);
        
        return {
            success: true,
            message: `Progreso guardado: ${nuevoPorcentaje}% completado`,
            porcentaje: nuevoPorcentaje,
            completado: seCompleto
        };
        
    } catch (error) {
        console.error('❌ Error al guardar progreso:', error);
        
        if (typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal('❌ Error al guardar progreso', 'error');
        }
        
        return {
            success: false,
            message: 'Error al guardar progreso'
        };
    }
}

// ============================================
// MARCAR MÓDULO COMO COMPLETADO
// ============================================
async function marcarModuloCompletado(labId, modulo) {
    const user = firebaseAuth.currentUser;
    if (!user) {
        return { success: false, message: 'Debes iniciar sesión' };
    }
    
    const progreso = await obtenerProgreso(labId, user.uid);
    const modulosCompletados = [...progreso.modulos];
    
    if (!modulosCompletados.includes(modulo)) {
        modulosCompletados.push(modulo);
        return await guardarProgreso(labId, modulosCompletados);
    }
    
    return { success: true, message: 'Módulo ya estaba completado' };
}

// ============================================
// DESMARCAR MÓDULO
// ============================================
async function desmarcarModulo(labId, modulo) {
    const user = firebaseAuth.currentUser;
    if (!user) {
        return { success: false, message: 'Debes iniciar sesión' };
    }
    
    const progreso = await obtenerProgreso(labId, user.uid);
    const modulosCompletados = progreso.modulos.filter(m => m !== modulo);
    
    return await guardarProgreso(labId, modulosCompletados);
}

// ============================================
// OBTENER PROGRESO GENERAL DEL USUARIO
// ============================================
async function obtenerProgresoGeneral() {
    const user = firebaseAuth.currentUser;
    
    if (!user) {
        return { 
            totalModulos: 0, 
            modulosCompletados: 0, 
            porcentaje: 0,
            laboratoriosIniciados: 0,
            laboratoriosCompletados: 0,
            nivel: 1,
            experiencia: 0
        };
    }
    
    try {
        const snapshot = await firebaseDB.collection(COLLECTION_PROGRESO)
            .where('usuarioId', '==', user.uid)
            .get();
        
        let totalModulosPosibles = 0;
        let modulosCompletadosTotal = 0;
        let laboratoriosCompletados = 0;
        
        // Obtener todos los laboratorios para calcular total de módulos
        const laboratorios = await window.obtenerLaboratorios();
        const mapaModulos = {};
        laboratorios.forEach(lab => {
            mapaModulos[lab.id] = lab.modulos?.length || 1;
        });
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const totalModulosLab = mapaModulos[data.laboratorioId] || 1;
            totalModulosPosibles += totalModulosLab;
            modulosCompletadosTotal += data.modulos?.length || 0;
            
            if (data.porcentaje === 100) {
                laboratoriosCompletados++;
            }
        });
        
        const porcentaje = totalModulosPosibles > 0 ? Math.round((modulosCompletadosTotal / totalModulosPosibles) * 100) : 0;
        
        // Calcular nivel y experiencia (cada 10% de progreso general = 1 nivel)
        const nivel = Math.max(1, Math.floor(porcentaje / 10) + 1);
        const experiencia = porcentaje * 10;
        
        return {
            totalModulos: totalModulosPosibles,
            modulosCompletados: modulosCompletadosTotal,
            porcentaje: porcentaje,
            laboratoriosIniciados: snapshot.size,
            laboratoriosCompletados: laboratoriosCompletados,
            nivel: nivel,
            experiencia: experiencia,
            experienciaSiguienteNivel: nivel * 100
        };
        
    } catch (error) {
        console.error('❌ Error al obtener progreso general:', error);
        return { 
            totalModulos: 0, 
            modulosCompletados: 0, 
            porcentaje: 0,
            laboratoriosIniciados: 0,
            laboratoriosCompletados: 0,
            nivel: 1,
            experiencia: 0
        };
    }
}

// ============================================
// OBTENER TODOS LOS PROGRESOS DEL USUARIO
// ============================================
async function obtenerTodosProgresos() {
    const user = firebaseAuth.currentUser;
    
    if (!user) {
        return {};
    }
    
    try {
        const snapshot = await firebaseDB.collection(COLLECTION_PROGRESO)
            .where('usuarioId', '==', user.uid)
            .get();
        
        const progresos = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            progresos[data.laboratorioId] = {
                modulos: data.modulos || [],
                porcentaje: data.porcentaje || 0,
                ultimaActualizacion: data.ultimaActualizacion,
                fechaInicio: data.fechaInicio,
                fechaCompletado: data.fechaCompletado
            };
        });
        
        return progresos;
        
    } catch (error) {
        console.error('❌ Error al obtener progresos:', error);
        return {};
    }
}

// ============================================
// RESETEAR PROGRESO DE UN LABORATORIO
// ============================================
async function resetearProgreso(labId) {
    const user = firebaseAuth.currentUser;
    
    if (!user) {
        return {
            success: false,
            message: 'Debes iniciar sesión'
        };
    }
    
    try {
        await firebaseDB.collection(COLLECTION_PROGRESO)
            .doc(`${user.uid}_${labId}`)
            .delete();
        
        if (typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal('🔄 Progreso reseteado correctamente', 'info');
        }
        
        return {
            success: true,
            message: 'Progreso reseteado correctamente'
        };
        
    } catch (error) {
        console.error('❌ Error al resetear progreso:', error);
        
        if (typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal('❌ Error al resetear progreso', 'error');
        }
        
        return {
            success: false,
            message: 'Error al resetear progreso'
        };
    }
}

// ============================================
// OBTENER LOGROS DEL USUARIO
// ============================================
async function obtenerLogros() {
    const progresoGeneral = await obtenerProgresoGeneral();
    const logros = [];
    
    // Logro: Primer laboratorio completado
    if (progresoGeneral.laboratoriosCompletados >= 1) {
        logros.push({
            id: 'primer_lab',
            nombre: '🎯 Primer Laboratorio',
            descripcion: 'Completaste tu primer laboratorio',
            desbloqueado: true,
            fecha: null
        });
    } else {
        logros.push({
            id: 'primer_lab',
            nombre: '🎯 Primer Laboratorio',
            descripcion: 'Completa tu primer laboratorio',
            desbloqueado: false,
            progreso: `${progresoGeneral.laboratoriosCompletados}/1`
        });
    }
    
    // Logro: 5 laboratorios completados
    if (progresoGeneral.laboratoriosCompletados >= 5) {
        logros.push({
            id: 'cinco_labs',
            nombre: '🏆 Explorador',
            descripcion: 'Completaste 5 laboratorios',
            desbloqueado: true
        });
    } else {
        logros.push({
            id: 'cinco_labs',
            nombre: '🏆 Explorador',
            descripcion: 'Completa 5 laboratorios',
            desbloqueado: false,
            progreso: `${progresoGeneral.laboratoriosCompletados}/5`
        });
    }
    
    // Logro: 100% de progreso en un laboratorio
    // Este se verifica por separado
    
    // Logro: 50 módulos completados
    if (progresoGeneral.modulosCompletados >= 50) {
        logros.push({
            id: 'cincuenta_modulos',
            nombre: '📚 Dedicado',
            descripcion: 'Completaste 50 módulos',
            desbloqueado: true
        });
    } else {
        logros.push({
            id: 'cincuenta_modulos',
            nombre: '📚 Dedicado',
            descripcion: 'Completa 50 módulos',
            desbloqueado: false,
            progreso: `${progresoGeneral.modulosCompletados}/50`
        });
    }
    
    return logros;
}

// ============================================
// ACTUALIZAR ESTADÍSTICAS EN UI
// ============================================
async function actualizarEstadisticasProgreso() {
    const progreso = await obtenerProgresoGeneral();
    
    // Actualizar elementos en la UI si existen
    const nivelElement = document.getElementById('userNivel');
    const experienciaElement = document.getElementById('userExperiencia');
    const progresoElement = document.getElementById('userProgreso');
    
    if (nivelElement) nivelElement.textContent = progreso.nivel;
    if (experienciaElement) experienciaElement.textContent = `${progreso.experiencia} XP`;
    if (progresoElement) {
        progresoElement.style.width = `${progreso.porcentaje}%`;
        progresoElement.setAttribute('aria-valuenow', progreso.porcentaje);
    }
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.obtenerProgreso = obtenerProgreso;
window.guardarProgreso = guardarProgreso;
window.marcarModuloCompletado = marcarModuloCompletado;
window.desmarcarModulo = desmarcarModulo;
window.obtenerProgresoGeneral = obtenerProgresoGeneral;
window.obtenerTodosProgresos = obtenerTodosProgresos;
window.resetearProgreso = resetearProgreso;
window.obtenerLogros = obtenerLogros;
window.actualizarEstadisticasProgreso = actualizarEstadisticasProgreso;