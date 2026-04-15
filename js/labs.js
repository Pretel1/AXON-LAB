/**
 * AXON - LABS.JS
 * CRUD de laboratorios con Firestore y notificaciones
 * 
 * Proyecto: axon-labs-b720e
 */

const COLLECTION_LABS = 'laboratorios';

// ============================================
// OBTENER TODOS LOS LABORATORIOS
// ============================================
async function obtenerLaboratorios(filtros = {}) {
    try {
        let query = firebaseDB.collection(COLLECTION_LABS);
        
        // Aplicar filtros
        if (filtros.categoria && filtros.categoria !== 'todas') {
            query = query.where('categoria', '==', filtros.categoria);
        }
        
        // Ordenar por fecha (más recientes primero)
        query = query.orderBy('fecha', 'desc');
        
        const snapshot = await query.get();
        
        const laboratorios = [];
        snapshot.forEach(doc => {
            laboratorios.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Filtrar por búsqueda en memoria (Firestore no soporta búsqueda nativa)
        if (filtros.search) {
            const searchTerm = filtros.search.toLowerCase();
            return laboratorios.filter(lab => 
                lab.nombre.toLowerCase().includes(searchTerm) ||
                lab.autor.toLowerCase().includes(searchTerm)
            );
        }
        
        return laboratorios;
        
    } catch (error) {
        console.error('❌ Error al obtener laboratorios:', error);
        
        // Mostrar notificación de error
        if (typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal('Error al cargar los laboratorios', 'error');
        }
        
        return [];
    }
}

// ============================================
// OBTENER LABORATORIO POR ID
// ============================================
async function obtenerLaboratorioPorId(id) {
    try {
        const doc = await firebaseDB.collection(COLLECTION_LABS).doc(id).get();
        
        if (doc.exists) {
            const laboratorio = {
                id: doc.id,
                ...doc.data()
            };
            
            // Incrementar vistas en segundo plano (no esperar)
            incrementarVistas(id).catch(console.error);
            
            return laboratorio;
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Error al obtener laboratorio:', error);
        return null;
    }
}

// ============================================
// AGREGAR LABORATORIO (CON NOTIFICACIONES)
// ============================================
async function agregarLaboratorio(labData, archivo = null) {
    const user = firebaseAuth.currentUser;
    
    if (!user) {
        if (typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal('Debes iniciar sesión para subir laboratorios', 'warning');
        }
        return {
            success: false,
            message: 'Debes iniciar sesión'
        };
    }
    
    try {
        let archivoURL = '';
        let archivoNombre = '';
        
        // Subir archivo si existe
        if (archivo) {
            const fileExt = archivo.name.split('.').pop();
            const fileName = `${Date.now()}_${user.uid}.${fileExt}`;
            const storageRef = firebaseStorage.ref(`laboratorios/${fileName}`);
            
            const uploadTask = await storageRef.put(archivo);
            archivoURL = await uploadTask.ref.getDownloadURL();
            archivoNombre = archivo.name;
        }
        
        // Procesar módulos
        let modulos = labData.modulos || [];
        if (typeof modulos === 'string') {
            modulos = modulos.split(',').map(m => m.trim()).filter(m => m);
        }
        
        const nuevoLab = {
            nombre: labData.nombre,
            autor: labData.autor,
            categoria: labData.categoria,
            descripcion: labData.descripcion || '',
            archivoURL: archivoURL,
            archivoNombre: archivoNombre,
            fecha: new Date().toISOString(),
            descargas: 0,
            vistas: 0,
            icono: obtenerIconoCategoria(labData.categoria),
            modulos: modulos,
            usuarioId: user.uid,
            usuarioEmail: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await firebaseDB.collection(COLLECTION_LABS).add(nuevoLab);
        
        // NOTIFICAR NUEVO LABORATORIO
        if (typeof window.notificarEventoSistema === 'function') {
            window.notificarEventoSistema('laboratorio_subido', {
                nombre: labData.nombre,
                autor: labData.autor,
                id: docRef.id
            });
        }
        
        // Mostrar notificación local
        if (typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal('✅ Laboratorio subido exitosamente', 'success');
        }
        
        console.log('✅ Laboratorio agregado:', docRef.id);
        
        return {
            success: true,
            id: docRef.id,
            message: 'Laboratorio subido exitosamente'
        };
        
    } catch (error) {
        console.error('❌ Error al agregar laboratorio:', error);
        
        if (typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal('❌ Error al subir el laboratorio', 'error');
        }
        
        return {
            success: false,
            message: 'Error al subir el laboratorio: ' + error.message
        };
    }
}

// ============================================
// ACTUALIZAR LABORATORIO
// ============================================
async function actualizarLaboratorio(id, data) {
    try {
        await firebaseDB.collection(COLLECTION_LABS).doc(id).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal('✅ Laboratorio actualizado', 'success');
        }
        
        return { success: true, message: 'Laboratorio actualizado' };
        
    } catch (error) {
        console.error('❌ Error al actualizar:', error);
        
        if (typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal('❌ Error al actualizar', 'error');
        }
        
        return { success: false, message: 'Error al actualizar' };
    }
}

// ============================================
// ELIMINAR LABORATORIO
// ============================================
async function eliminarLaboratorio(id) {
    const user = firebaseAuth.currentUser;
    if (!user) {
        return { success: false, message: 'Debes iniciar sesión' };
    }
    
    try {
        // Obtener laboratorio para verificar permisos
        const lab = await obtenerLaboratorioPorId(id);
        
        if (!lab) {
            return { success: false, message: 'Laboratorio no encontrado' };
        }
        
        // Verificar que el usuario sea el dueño o admin
        if (lab.usuarioId !== user.uid) {
            const userDoc = await firebaseDB.collection('usuarios').doc(user.uid).get();
            if (userDoc.data()?.rol !== 'admin') {
                return { success: false, message: 'No tienes permiso para eliminar este laboratorio' };
            }
        }
        
        // Eliminar archivo de Storage si existe
        if (lab.archivoURL) {
            try {
                const storageRef = firebaseStorage.refFromURL(lab.archivoURL);
                await storageRef.delete();
            } catch (e) {
                console.warn('No se pudo eliminar el archivo:', e);
            }
        }
        
        // Eliminar documento de Firestore
        await firebaseDB.collection(COLLECTION_LABS).doc(id).delete();
        
        // Eliminar progresos asociados
        const progresosSnapshot = await firebaseDB.collection('progreso')
            .where('laboratorioId', '==', id)
            .get();
        
        const batch = firebaseDB.batch();
        progresosSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        
        if (typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal('✅ Laboratorio eliminado', 'success');
        }
        
        return { success: true, message: 'Laboratorio eliminado' };
        
    } catch (error) {
        console.error('❌ Error al eliminar:', error);
        
        if (typeof window.mostrarNotificacionLocal === 'function') {
            window.mostrarNotificacionLocal('❌ Error al eliminar', 'error');
        }
        
        return { success: false, message: 'Error al eliminar' };
    }
}

// ============================================
// INCREMENTAR DESCARGAS
// ============================================
async function incrementarDescargas(id) {
    try {
        const labRef = firebaseDB.collection(COLLECTION_LABS).doc(id);
        await labRef.update({
            descargas: firebase.firestore.FieldValue.increment(1)
        });
        
    } catch (error) {
        console.error('❌ Error al incrementar descargas:', error);
    }
}

// ============================================
// INCREMENTAR VISTAS
// ============================================
async function incrementarVistas(id) {
    try {
        const labRef = firebaseDB.collection(COLLECTION_LABS).doc(id);
        await labRef.update({
            vistas: firebase.firestore.FieldValue.increment(1)
        });
        
    } catch (error) {
        console.error('❌ Error al incrementar vistas:', error);
    }
}

// ============================================
// OBTENER CATEGORÍAS
// ============================================
async function obtenerCategorias() {
    try {
        // Intentar obtener de Firestore primero
        const snapshot = await firebaseDB.collection('categorias').get();
        
        if (!snapshot.empty) {
            const categorias = [];
            snapshot.forEach(doc => {
                categorias.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return categorias;
        }
    } catch (error) {
        console.log('Usando categorías por defecto');
    }
    
    // Categorías por defecto
    return [
        { id: "redes", nombre: "Redes", icono: "🌐", color: "#00d4ff" },
        { id: "programacion", nombre: "Programación", icono: "💻", color: "#00ff88" },
        { id: "bases-datos", nombre: "Bases de Datos", icono: "🗄️", color: "#ffaa00" },
        { id: "inteligencia", nombre: "Inteligencia Artificial", icono: "🧠", color: "#b300ff" },
        { id: "seguridad", nombre: "Seguridad", icono: "🔒", color: "#ff3366" }
    ];
}

// ============================================
// OBTENER ICONO POR CATEGORÍA
// ============================================
function obtenerIconoCategoria(categoria) {
    const iconos = {
        'redes': '🌐',
        'programacion': '💻',
        'bases-datos': '🗄️',
        'inteligencia': '🧠',
        'seguridad': '🔒'
    };
    return iconos[categoria] || '📚';
}

// ============================================
// OBTENER NOMBRE DE CATEGORÍA
// ============================================
function obtenerNombreCategoria(categoria) {
    const nombres = {
        'redes': 'Redes',
        'programacion': 'Programación',
        'bases-datos': 'Bases de Datos',
        'inteligencia': 'Inteligencia Artificial',
        'seguridad': 'Seguridad'
    };
    return nombres[categoria] || categoria;
}

// ============================================
// FILTRAR LABORATORIOS (cliente)
// ============================================
function filtrarLaboratorios(laboratorios, searchTerm, categoria) {
    let resultados = [...laboratorios];
    
    if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        resultados = resultados.filter(lab =>
            lab.nombre.toLowerCase().includes(term) ||
            lab.autor.toLowerCase().includes(term) ||
            (lab.descripcion && lab.descripcion.toLowerCase().includes(term))
        );
    }
    
    if (categoria && categoria !== 'todas') {
        resultados = resultados.filter(lab => lab.categoria === categoria);
    }
    
    return resultados;
}

// ============================================
// OBTENER LABORATORIOS POR CATEGORÍA
// ============================================
async function obtenerLaboratoriosPorCategoria(categoria) {
    try {
        const snapshot = await firebaseDB.collection(COLLECTION_LABS)
            .where('categoria', '==', categoria)
            .orderBy('fecha', 'desc')
            .get();
        
        const laboratorios = [];
        snapshot.forEach(doc => {
            laboratorios.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return laboratorios;
        
    } catch (error) {
        console.error('❌ Error al obtener laboratorios por categoría:', error);
        return [];
    }
}

// ============================================
// OBTENER LABORATORIOS RECIENTES
// ============================================
async function obtenerLaboratoriosRecientes(limit = 6) {
    try {
        const snapshot = await firebaseDB.collection(COLLECTION_LABS)
            .orderBy('fecha', 'desc')
            .limit(limit)
            .get();
        
        const laboratorios = [];
        snapshot.forEach(doc => {
            laboratorios.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return laboratorios;
        
    } catch (error) {
        console.error('❌ Error al obtener laboratorios recientes:', error);
        return [];
    }
}

// ============================================
// OBTENER LABORATORIOS DESTACADOS (más descargados)
// ============================================
async function obtenerLaboratoriosDestacados(limit = 5) {
    try {
        const snapshot = await firebaseDB.collection(COLLECTION_LABS)
            .orderBy('descargas', 'desc')
            .limit(limit)
            .get();
        
        const laboratorios = [];
        snapshot.forEach(doc => {
            laboratorios.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return laboratorios;
        
    } catch (error) {
        console.error('❌ Error al obtener laboratorios destacados:', error);
        return [];
    }
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.obtenerLaboratorios = obtenerLaboratorios;
window.obtenerLaboratorioPorId = obtenerLaboratorioPorId;
window.agregarLaboratorio = agregarLaboratorio;
window.actualizarLaboratorio = actualizarLaboratorio;
window.eliminarLaboratorio = eliminarLaboratorio;
window.incrementarDescargas = incrementarDescargas;
window.incrementarVistas = incrementarVistas;
window.obtenerCategorias = obtenerCategorias;
window.obtenerIconoCategoria = obtenerIconoCategoria;
window.obtenerNombreCategoria = obtenerNombreCategoria;
window.filtrarLaboratorios = filtrarLaboratorios;
window.obtenerLaboratoriosPorCategoria = obtenerLaboratoriosPorCategoria;
window.obtenerLaboratoriosRecientes = obtenerLaboratoriosRecientes;
window.obtenerLaboratoriosDestacados = obtenerLaboratoriosDestacados;