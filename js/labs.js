/**
 * AXON - LABS.JS
 * CRUD de laboratorios con Firebase Storage y Firestore
 */

const COLLECTION_LABS = 'laboratorios';

// ============================================
// OBTENER TODOS LOS LABORATORIOS
// ============================================
async function obtenerLaboratorios(filtros = {}) {
    try {
        let query = firebaseDB.collection(COLLECTION_LABS);
        
        // Aplicar filtro de categoría
        if (filtros.categoria && filtros.categoria !== 'todas') {
            query = query.where('categoria', '==', filtros.categoria);
        }
        
        // Ordenar por fecha (más reciente primero)
        query = query.orderBy('fecha', 'desc');
        
        const snapshot = await query.get();
        
        const laboratorios = [];
        snapshot.forEach(doc => {
            laboratorios.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Aplicar filtro de búsqueda (en memoria - Firestore no soporta búsqueda nativa)
        if (filtros.search && filtros.search.trim()) {
            const searchTerm = filtros.search.toLowerCase().trim();
            return laboratorios.filter(lab =>
                lab.nombre.toLowerCase().includes(searchTerm) ||
                lab.autor.toLowerCase().includes(searchTerm)
            );
        }
        
        return laboratorios;
        
    } catch (error) {
        console.error('❌ Error al obtener laboratorios:', error);
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion('Error al cargar los laboratorios', 'error');
        }
        return [];
    }
}

// ============================================
// OBTENER LABORATORIO POR ID (STRING)
// ============================================
async function obtenerLaboratorioPorId(id) {
    if (!id) return null;
    
    try {
        const doc = await firebaseDB.collection(COLLECTION_LABS).doc(id).get();
        
        if (!doc.exists) return null;
        
        const laboratorio = {
            id: doc.id,
            ...doc.data()
        };
        
        // Incrementar vistas en segundo plano (no esperar)
        incrementarVistas(id).catch(console.error);
        
        return laboratorio;
        
    } catch (error) {
        console.error('❌ Error al obtener laboratorio:', error);
        return null;
    }
}

// ============================================
// AGREGAR LABORATORIO CON SUBIDA REAL DE ARCHIVOS
// ============================================
async function agregarLaboratorio(labData, archivoFile, imagenFile = null) {
    const user = firebaseAuth.currentUser;
    
    if (!user) {
        return { success: false, message: 'Debes iniciar sesión para subir laboratorios' };
    }
    
    try {
        let archivoURL = '';
        let archivoNombre = '';
        let imagenURL = '';
        let imagenNombre = '';
        
        // Subir archivo principal (PDF, ZIP, etc.)
        if (archivoFile && archivoFile instanceof File) {
            const fileExt = archivoFile.name.split('.').pop();
            const fileName = `laboratorios/${Date.now()}_${user.uid}_archivo.${fileExt}`;
            const storageRef = firebaseStorage.ref(fileName);
            
            // Mostrar progreso si hay callback
            if (labData.onProgress) {
                const uploadTask = storageRef.put(archivoFile);
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (labData.onProgress) labData.onProgress(progress);
                    },
                    (error) => { throw error; }
                );
                await uploadTask;
                archivoURL = await uploadTask.ref.getDownloadURL();
            } else {
                await storageRef.put(archivoFile);
                archivoURL = await storageRef.getDownloadURL();
            }
            archivoNombre = archivoFile.name;
        }
        
        // Subir imagen de portada (opcional)
        if (imagenFile && imagenFile instanceof File) {
            const imgExt = imagenFile.name.split('.').pop();
            const imgName = `laboratorios/${Date.now()}_${user.uid}_portada.${imgExt}`;
            const imgRef = firebaseStorage.ref(imgName);
            await imgRef.put(imagenFile);
            imagenURL = await imgRef.getDownloadURL();
            imagenNombre = imagenFile.name;
        }
        
        // Procesar módulos
        let modulos = labData.modulos || [];
        if (typeof modulos === 'string') {
            modulos = modulos.split(',').map(m => m.trim()).filter(m => m);
        }
        
        // Guardar en Firestore
        const nuevoLab = {
            nombre: labData.nombre,
            autor: labData.autor,
            categoria: labData.categoria,
            descripcion: labData.descripcion || '',
            archivoURL: archivoURL,
            archivoNombre: archivoNombre,
            imagenURL: imagenURL,
            imagenNombre: imagenNombre,
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
        
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion('✅ Laboratorio subido exitosamente', 'success');
        }
        
        return {
            success: true,
            id: docRef.id,
            message: 'Laboratorio subido exitosamente'
        };
        
    } catch (error) {
        console.error('❌ Error al agregar laboratorio:', error);
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion('❌ Error al subir: ' + error.message, 'error');
        }
        return {
            success: false,
            message: error.message
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
        
        return { success: true, message: 'Laboratorio actualizado' };
        
    } catch (error) {
        console.error('❌ Error al actualizar:', error);
        return { success: false, message: error.message };
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
        const lab = await obtenerLaboratorioPorId(id);
        if (!lab) {
            return { success: false, message: 'Laboratorio no encontrado' };
        }
        
        // Verificar permiso (solo el creador o admin puede eliminar)
        const userDoc = await firebaseDB.collection('usuarios').doc(user.uid).get();
        const esAdmin = userDoc.exists && userDoc.data().rol === 'admin';
        
        if (lab.usuarioId !== user.uid && !esAdmin) {
            return { success: false, message: 'No tienes permiso para eliminar este laboratorio' };
        }
        
        // Eliminar archivo de Storage
        if (lab.archivoURL) {
            try {
                const fileRef = firebaseStorage.refFromURL(lab.archivoURL);
                await fileRef.delete();
            } catch (e) {
                console.warn('No se pudo eliminar archivo:', e);
            }
        }
        
        // Eliminar imagen de portada de Storage
        if (lab.imagenURL) {
            try {
                const imgRef = firebaseStorage.refFromURL(lab.imagenURL);
                await imgRef.delete();
            } catch (e) {
                console.warn('No se pudo eliminar imagen:', e);
            }
        }
        
        // Eliminar documento de Firestore
        await firebaseDB.collection(COLLECTION_LABS).doc(id).delete();
        
        // Eliminar progresos asociados
        const progresosSnapshot = await firebaseDB.collection('progreso')
            .where('labId', '==', id)
            .get();
        
        const batch = firebaseDB.batch();
        progresosSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion('✅ Laboratorio eliminado', 'success');
        }
        
        return { success: true, message: 'Laboratorio eliminado' };
        
    } catch (error) {
        console.error('❌ Error al eliminar:', error);
        return { success: false, message: error.message };
    }
}

// ============================================
// INCREMENTAR CONTADOR DE DESCARGAS
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
// INCREMENTAR CONTADOR DE VISTAS
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
                categorias.push({ id: doc.id, ...doc.data() });
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
// FILTRAR LABORATORIOS (CLIENTE)
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
            laboratorios.push({ id: doc.id, ...doc.data() });
        });
        
        return laboratorios;
        
    } catch (error) {
        console.error('❌ Error:', error);
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
window.obtenerLaboratoriosRecientes = obtenerLaboratoriosRecientes;
