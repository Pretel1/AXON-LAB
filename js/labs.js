/**
 * AXON - LABS.JS
 * CRUD de laboratorios con Firestore REAL
 */

const COLLECTION_LABS = 'laboratorios';

// ============================================
// OBTENER TODOS LOS LABORATORIOS
// ============================================
async function obtenerLaboratorios(filtros = {}) {
    try {
        let query = firebaseDB.collection(COLLECTION_LABS);
        
        if (filtros.categoria && filtros.categoria !== 'todas') {
            query = query.where('categoria', '==', filtros.categoria);
        }
        
        const snapshot = await query.orderBy('fecha', 'desc').get();
        
        const laboratorios = [];
        snapshot.forEach(doc => {
            laboratorios.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Búsqueda en memoria
        if (filtros.search) {
            const searchTerm = filtros.search.toLowerCase();
            return laboratorios.filter(lab => 
                lab.nombre.toLowerCase().includes(searchTerm) ||
                lab.autor.toLowerCase().includes(searchTerm)
            );
        }
        
        return laboratorios;
        
    } catch (error) {
        console.error('❌ Error:', error);
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
            incrementarVistas(id);
            return { id: doc.id, ...doc.data() };
        }
        return null;
        
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

// ============================================
// SUBIR LABORATORIO CON ARCHIVO REAL
// ============================================
async function agregarLaboratorio(labData, archivoFile) {
    const user = firebaseAuth.currentUser;
    
    if (!user) {
        mostrarNotificacion('Debes iniciar sesión', 'error');
        return { success: false, message: 'Debes iniciar sesión' };
    }
    
    try {
        let archivoURL = '';
        let archivoNombre = '';
        
        // SUBIR ARCHIVO A STORAGE REAL
        if (archivoFile && archivoFile instanceof File) {
            const fileName = `laboratorios/${Date.now()}_${user.uid}_${archivoFile.name}`;
            const storageRef = firebaseStorage.ref(fileName);
            
            // Mostrar progreso de subida
            console.log('📤 Subiendo archivo:', archivoFile.name);
            
            const uploadTask = await storageRef.put(archivoFile);
            archivoURL = await uploadTask.ref.getDownloadURL();
            archivoNombre = archivoFile.name;
            
            console.log('✅ Archivo subido:', archivoURL);
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
        
        mostrarNotificacion('✅ Laboratorio subido exitosamente', 'success');
        console.log('✅ Laboratorio guardado en Firestore:', docRef.id);
        
        return {
            success: true,
            id: docRef.id,
            message: 'Laboratorio subido exitosamente'
        };
        
    } catch (error) {
        console.error('❌ Error detallado:', error);
        mostrarNotificacion('❌ Error: ' + error.message, 'error');
        return {
            success: false,
            message: error.message
        };
    }
}

// ============================================
// INCREMENTAR DESCARGAS
// ============================================
async function incrementarDescargas(id) {
    try {
        await firebaseDB.collection(COLLECTION_LABS).doc(id).update({
            descargas: firebase.firestore.FieldValue.increment(1)
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// ============================================
// INCREMENTAR VISTAS
// ============================================
async function incrementarVistas(id) {
    try {
        await firebaseDB.collection(COLLECTION_LABS).doc(id).update({
            vistas: firebase.firestore.FieldValue.increment(1)
        });
    } catch (error) {
        console.error('Error:', error);
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
        
        // Eliminar archivo de Storage
        if (lab.archivoURL) {
            try {
                const storageRef = firebaseStorage.refFromURL(lab.archivoURL);
                await storageRef.delete();
            } catch (e) {
                console.warn('No se pudo eliminar archivo:', e);
            }
        }
        
        // Eliminar de Firestore
        await firebaseDB.collection(COLLECTION_LABS).doc(id).delete();
        
        mostrarNotificacion('✅ Laboratorio eliminado', 'success');
        return { success: true, message: 'Laboratorio eliminado' };
        
    } catch (error) {
        console.error('Error:', error);
        return { success: false, message: error.message };
    }
}

// ============================================
// OBTENER CATEGORÍAS
// ============================================
async function obtenerCategorias() {
    return [
        { id: "redes", nombre: "Redes", icono: "🌐", color: "#00d4ff" },
        { id: "programacion", nombre: "Programación", icono: "💻", color: "#00ff88" },
        { id: "bases-datos", nombre: "Bases de Datos", icono: "🗄️", color: "#ffaa00" },
        { id: "inteligencia", nombre: "Inteligencia Artificial", icono: "🧠", color: "#b300ff" },
        { id: "seguridad", nombre: "Seguridad", icono: "🔒", color: "#ff3366" }
    ];
}

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

function filtrarLaboratorios(laboratorios, searchTerm, categoria) {
    let resultados = [...laboratorios];
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        resultados = resultados.filter(lab =>
            lab.nombre.toLowerCase().includes(term) ||
            lab.autor.toLowerCase().includes(term)
        );
    }
    
    if (categoria && categoria !== 'todas') {
        resultados = resultados.filter(lab => lab.categoria === categoria);
    }
    
    return resultados;
}

// Funciones helper
function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo}`;
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(notificacion);
    setTimeout(() => notificacion.remove(), 3000);
}

// Exportar
window.obtenerLaboratorios = obtenerLaboratorios;
window.obtenerLaboratorioPorId = obtenerLaboratorioPorId;
window.agregarLaboratorio = agregarLaboratorio;
window.eliminarLaboratorio = eliminarLaboratorio;
window.incrementarDescargas = incrementarDescargas;
window.obtenerCategorias = obtenerCategorias;
window.obtenerIconoCategoria = obtenerIconoCategoria;
window.obtenerNombreCategoria = obtenerNombreCategoria;
window.filtrarLaboratorios = filtrarLaboratorios;
