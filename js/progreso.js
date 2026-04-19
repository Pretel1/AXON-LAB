/**
 * AXON - PROGRESO.JS
 * Gestión de progreso de usuarios con Firestore
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
        const query = await firebaseDB.collection(COLLECTION_PROGRESO)
            .where('usuarioId', '==', uid)
            .where('labId', '==', labId)
            .get();
        
        if (!query.empty) {
            const data = query.docs[0].data();
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
// GUARDAR PROGRESO
// ============================================
async function guardarProgreso(labId, modulosCompletados) {
    const user = firebaseAuth.currentUser;
    
    if (!user) {
        return { success: false, message: 'Debes iniciar sesión' };
    }
    
    try {
        // Obtener laboratorio para conocer total de módulos
        const laboratorio = await window.obtenerLaboratorioPorId(labId);
        if (!laboratorio) {
            return { success: false, message: 'Laboratorio no encontrado' };
        }
        
        const totalModulos = laboratorio.modulos?.length || 1;
        const porcentaje = Math.round((modulosCompletados.length / totalModulos) * 100);
        
        // Buscar si ya existe progreso
        const query = await firebaseDB.collection(COLLECTION_PROGRESO)
            .where('usuarioId', '==', user.uid)
            .where('labId', '==', labId)
            .get();
        
        const progresoData = {
            usuarioId: user.uid,
            usuarioEmail: user.email,
            labId: labId,
            labNombre: laboratorio.nombre,
            modulos: modulosCompletados,
            porcentaje: porcentaje,
            ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (query.empty) {
            // Crear nuevo
            progresoData.fechaInicio = firebase.firestore.FieldValue.serverTimestamp();
            if (porcentaje === 100) {
                progresoData.fechaCompletado = firebase.firestore.FieldValue.serverTimestamp();
            }
            await firebaseDB.collection(COLLECTION_PROGRESO).add(progresoData);
        } else {
            // Actualizar existente
            const docRef = query.docs[0].ref;
            const updateData = {
                modulos: modulosCompletados,
                porcentaje: porcentaje,
                ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (porcentaje === 100) {
                updateData.fechaCompletado = firebase.firestore.FieldValue.serverTimestamp();
            }
            await docRef.update(updateData);
        }
        
        return {
            success: true,
            message: `Progreso guardado: ${porcentaje}% completado`,
            porcentaje: porcentaje,
            completado: porcentaje === 100
        };
        
    } catch (error) {
        console.error('❌ Error al guardar progreso:', error);
        return { success: false, message: error.message };
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
            laboratoriosCompletados: 0
        };
    }
    
    try {
        const snapshot = await firebaseDB.collection(COLLECTION_PROGRESO)
            .where('usuarioId', '==', user.uid)
            .get();
        
        let laboratoriosIniciados = snapshot.size;
        let laboratoriosCompletados = 0;
        let totalModulos = 0;
        let modulosCompletadosTotal = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.porcentaje === 100) {
                laboratoriosCompletados++;
            }
            totalModulos += data.modulos?.length || 0;
            modulosCompletadosTotal += data.modulos?.length || 0;
        });
        
        const porcentaje = laboratoriosIniciados > 0 
            ? Math.round((laboratoriosCompletados / laboratoriosIniciados) * 100) 
            : 0;
        
        return {
            totalModulos,
            modulosCompletados: modulosCompletadosTotal,
            porcentaje,
            laboratoriosIniciados,
            laboratoriosCompletados
        };
        
    } catch (error) {
        console.error('❌ Error:', error);
        return {
            totalModulos: 0,
            modulosCompletados: 0,
            porcentaje: 0,
            laboratoriosIniciados: 0,
            laboratoriosCompletados: 0
        };
    }
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================
window.obtenerProgreso = obtenerProgreso;
window.guardarProgreso = guardarProgreso;
window.marcarModuloCompletado = marcarModuloCompletado;
window.desmarcarModulo = desmarcarModulo;
window.obtenerProgresoGeneral = obtenerProgresoGeneral;
