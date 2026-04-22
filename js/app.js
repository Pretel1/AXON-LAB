// js/labs.js
import { storage, databases, ID, DATABASE_ID, LABS_COLLECTION_ID, DOCUMENTS_BUCKET_ID, currentUser } from './appwrite-config.js';

// Subir un laboratorio
export async function uploadLab(file, title, description, category) {
    if (!currentUser) {
        return { success: false, error: 'Debes iniciar sesión para subir laboratorios' };
    }
    
    try {
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
        
        return { success: true, file: fileResponse, metadata: dbResponse };
    } catch (error) {
        console.error('Error al subir:', error);
        return { success: false, error: error.message };
    }
}

// Listar todos los laboratorios
export async function listLabs(category = null) {
    try {
        let queries = [];
        
        if (category && category !== 'todos') {
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
        console.error('Error al listar:', error);
        return { success: false, error: error.message, labs: [] };
    }
}

// Obtener URL de descarga
export async function getDownloadUrl(fileId) {
    try {
        const url = storage.getFileView(DOCUMENTS_BUCKET_ID, fileId);
        return url;
    } catch (error) {
        console.error('Error al obtener URL:', error);
        return null;
    }
}

// Incrementar contador de descargas
export async function incrementDownloads(labId, currentDownloads) {
    try {
        const response = await databases.updateDocument(
            DATABASE_ID,
            LABS_COLLECTION_ID,
            labId,
            { downloads: currentDownloads + 1 }
        );
        return response;
    } catch (error) {
        console.error('Error al actualizar descargas:', error);
        return null;
    }
}

// Eliminar laboratorio (solo para administradores o dueños)
export async function deleteLab(labId, fileId, userId) {
    if (!currentUser || (currentUser.$id !== userId && !currentUser.labels?.includes('admin'))) {
        return { success: false, error: 'No tienes permisos para eliminar este laboratorio' };
    }
    
    try {
        // Eliminar de la base de datos
        await databases.deleteDocument(DATABASE_ID, LABS_COLLECTION_ID, labId);
        
        // Eliminar archivo del storage
        await storage.deleteFile(DOCUMENTS_BUCKET_ID, fileId);
        
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar:', error);
        return { success: false, error: error.message };
    }
}
