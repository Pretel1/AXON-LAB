// js/labs.js - Versión completa con Appwrite
import { storage, databases, ID, DATABASE_ID, LABS_COLLECTION_ID, DOCUMENTS_BUCKET_ID } from './appwrite-config.js';

// Variable para el usuario actual (se actualiza desde auth)
let currentUser = null;

// Función para actualizar el usuario actual
export function setCurrentUser(user) {
    currentUser = user;
}

// ============================================
// SUBIR LABORATORIO
// ============================================
export async function uploadLab(file, title, description, category) {
    if (!currentUser) {
        return { success: false, error: 'Debes iniciar sesión para subir laboratorios' };
    }
    
    try {
        // Validar archivo
        if (!file) {
            return { success: false, error: 'No se seleccionó ningún archivo' };
        }
        
        // Validar tamaño (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return { success: false, error: 'El archivo no debe superar los 10MB' };
        }
        
        // 1. Subir archivo a Storage
        const fileResponse = await storage.createFile(
            DOCUMENTS_BUCKET_ID,
            ID.unique(),
            file
        );
        
        // 2. Guardar metadatos en la base de datos
        const metadata = {
            title: title,
            description: description,
            category: category,
            fileId: fileResponse.$id,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            userId: currentUser.$id,
            userEmail: currentUser.email,
            userName: currentUser.name || currentUser.email,
            createdAt: new Date().toISOString(),
            downloads: 0
        };
        
        const dbResponse = await databases.createDocument(
            DATABASE_ID,
            LABS_COLLECTION_ID,
            ID.unique(),
            metadata
        );
        
        console.log('✅ Laboratorio subido:', dbResponse);
        return { success: true, file: fileResponse, metadata: dbResponse };
        
    } catch (error) {
        console.error('Error al subir:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// LISTAR LABORATORIOS
// ============================================
export async function listLabs(category = null) {
    try {
        let queries = [];
        
        if (category && category !== 'todos' && category !== '') {
            queries.push(`category="${category}"`);
        }
        
        // Ordenar por fecha más reciente
        queries.push('orderDesc("createdAt")');
        
        const response = await databases.listDocuments(
            DATABASE_ID,
            LABS_COLLECTION_ID,
            queries
        );
        
        return { success: true, labs: response.documents };
        
    } catch (error) {
        console.error('Error al listar laboratorios:', error);
        return { success: false, error: error.message, labs: [] };
    }
}

// ============================================
// OBTENER LABORATORIO POR ID
// ============================================
export async function getLabById(labId) {
    try {
        const response = await databases.getDocument(
            DATABASE_ID,
            LABS_COLLECTION_ID,
            labId
        );
        return { success: true, lab: response };
    } catch (error) {
        console.error('Error al obtener laboratorio:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// OBTENER URL DE DESCARGA
// ============================================
export async function getDownloadUrl(fileId) {
    try {
        const url = storage.getFileView(DOCUMENTS_BUCKET_ID, fileId);
        return url;
    } catch (error) {
        console.error('Error al obtener URL:', error);
        return null;
    }
}

// ============================================
// INCREMENTAR CONTADOR DE DESCARGAS
// ============================================
export async function incrementDownloads(labId, currentDownloads) {
    try {
        const response = await databases.updateDocument(
            DATABASE_ID,
            LABS_COLLECTION_ID,
            labId,
            { downloads: (currentDownloads || 0) + 1 }
        );
        return response;
    } catch (error) {
        console.error('Error al actualizar descargas:', error);
        return null;
    }
}

// ============================================
// ELIMINAR LABORATORIO
// ============================================
export async function deleteLab(labId, fileId, userId) {
    if (!currentUser) {
        return { success: false, error: 'Debes iniciar sesión para eliminar laboratorios' };
    }
    
    // Verificar permisos (solo el dueño puede eliminar)
    if (currentUser.$id !== userId && currentUser.email !== userId) {
        return { success: false, error: 'No tienes permisos para eliminar este laboratorio' };
    }
    
    try {
        // Eliminar de la base de datos
        await databases.deleteDocument(DATABASE_ID, LABS_COLLECTION_ID, labId);
        
        // Eliminar archivo del storage
        await storage.deleteFile(DOCUMENTS_BUCKET_ID, fileId);
        
        console.log('✅ Laboratorio eliminado:', labId);
        return { success: true };
        
    } catch (error) {
        console.error('Error al eliminar:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// FUNCIONES PARA COMPATIBILIDAD (si es necesario)
// ============================================
export function obtenerLaboratorios() {
    console.warn('obtenerLaboratorios está obsoleto. Usa listLabs() en su lugar.');
    return [];
}

export function agregarLaboratorio() {
    console.warn('agregarLaboratorio está obsoleto. Usa uploadLab() en su lugar.');
    return { success: false, message: 'Función obsoleta. Usa uploadLab()' };
}

export function eliminarLaboratorio() {
    console.warn('eliminarLaboratorio está obsoleto. Usa deleteLab() en su lugar.');
    return { success: false, message: 'Función obsoleta. Usa deleteLab()' };
}

export function visualizarArchivo() {
    console.warn('visualizarArchivo está obsoleto. Usa getDownloadUrl() en su lugar.');
}

console.log('✅ Labs.js cargado con Appwrite');
