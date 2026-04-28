// js/labs.js - GESTIÓN INTEGRAL DE LABORATORIOS (VERSIÓN SENIOR)
import { supabase, LABS_BUCKET } from './supabase-config.js';

let currentUser = null;

/**
 * Sincroniza el usuario actual desde el módulo de autenticación
 */
export function setCurrentUser(user) {
    currentUser = user;
}

/**
 * Sube un nuevo laboratorio (Archivo o Enlace Externo)
 * @param {string} tipo - 'archivo' o 'enlace_externo'
 * @param {File|string} payload - El archivo físico o la URL de OneDrive
 * @param {string} title - Título del lab
 * @param {string} description - Descripción detallada
 * @param {string} category - Categoría seleccionada
 */
export async function uploadLab(tipo, payload, title, description, category) {
    if (!currentUser) {
        return { success: false, error: 'Debe iniciar sesión para realizar esta acción.' };
    }

    // Validación de Roles (LMS Logic)
    if (currentUser.rol === 'estudiante') {
        return { success: false, error: 'Acceso denegado: Solo profesores o administradores pueden subir materiales.' };
    }

    try {
        let finalUrl = '';

        if (tipo === 'archivo') {
            // 1. GESTIÓN DE ARCHIVO FÍSICO (Documentos, Videos, Imágenes)
            if (!payload) return { success: false, error: 'No se ha seleccionado ningún archivo.' };
            
            // Limpiar nombre de archivo para evitar errores de URL
            const fileExt = payload.name.split('.').pop();
            const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
            const filePath = `${category}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(LABS_BUCKET)
                .upload(filePath, payload, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Obtener URL pública del archivo subido
            const { data: publicUrlData } = supabase.storage
                .from(LABS_BUCKET)
                .getPublicUrl(filePath);
            
            finalUrl = publicUrlData.publicUrl;

        } else {
            // 2. GESTIÓN DE ENLACES EXTERNOS (OneDrive, Google Drive, etc.)
            if (!payload || !payload.startsWith('http')) {
                return { success: false, error: 'Por favor, ingrese una URL válida (ej. https://1drv.ms/...). ' };
            }
            finalUrl = payload;
        }

        // 3. REGISTRO EN BASE DE DATOS (Supabase SQL)
        const { data, error } = await supabase
            .from('laboratorios')
            .insert([{
                titulo: title,
                descripcion: description,
                categoria: category,
                tipo_recurso: tipo,
                archivo_url: finalUrl,
                user_id: currentUser.id,
                downloads: 0
            }])
            .select()
            .single();

        if (error) throw error;

        // 4. SINCRONIZACIÓN CON BACKEND SQLITE LOCAL (Opcional)
        // Se intenta conectar al servidor local si está activo
        try {
            await fetch('http://localhost:5000/api/laboratorios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    titulo: title,
                    descripcion: description,
                    categoria: category,
                    tipo: tipo,
                    url: finalUrl,
                    user_id: currentUser.id
                })
            });
        } catch (e) {
            console.warn('Sincronización SQLite local saltada: El servidor no responde.');
        }

        return { success: true, metadata: data };

    } catch (error) {
        console.error('Error en uploadLab:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene la lista de laboratorios disponibles
 */
export async function listLabs(category = null, limit = 50) {
    try {
        let query = supabase
            .from('laboratorios')
            .select('*, perfiles(nombre)')
            .order('creado_en', { ascending: false })
            .limit(limit);

        if (category && category !== 'todos') {
            query = query.eq('categoria', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        const labs = data.map(lab => ({
            id: lab.id,
            title: lab.titulo,
            description: lab.descripcion,
            category: lab.categoria,
            tipo: lab.tipo_recurso,
            fileUrl: lab.archivo_url,
            userId: lab.user_id,
            userName: lab.perfiles?.nombre || 'Docente AXON',
            createdAt: lab.creado_en,
            downloads: lab.downloads || 0
        }));

        return { success: true, labs };

    } catch (error) {
        return { success: false, error: error.message, labs: [] };
    }
}

/**
 * Obtiene los detalles de un laboratorio específico por UUID
 */
export async function getLabById(labId) {
    try {
        const { data, error } = await supabase
            .from('laboratorios')
            .select('*, perfiles(nombre)')
            .eq('id', labId)
            .single();

        if (error) throw error;

        return {
            success: true,
            lab: {
                id: data.id,
                title: data.titulo,
                description: data.descripcion,
                category: data.categoria,
                tipo: data.tipo_recurso,
                fileUrl: data.archivo_url,
                userId: data.user_id,
                userName: data.perfiles?.nombre || 'Docente AXON',
                createdAt: data.creado_en,
                downloads: data.downloads || 0
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Registra una descarga o visualización e incrementa el contador
 */
export async function incrementDownloads(labId, currentDownloads = 0) {
    const { error } = await supabase
        .from('laboratorios')
        .update({ downloads: currentDownloads + 1 })
        .eq('id', labId);
    
    return !error;
}

/**
 * Elimina un laboratorio (Lógica de borrado físico y lógico)
 */
export async function deleteLab(labId, fileUrl, userId, tipo) {
    if (!currentUser || (currentUser.id !== userId && currentUser.rol !== 'admin')) {
        return { success: false, error: 'No tiene permisos para eliminar este recurso.' };
    }

    try {
        // 1. Si es un archivo físico, borrarlo del Storage primero
        if (tipo === 'archivo') {
            const pathParts = fileUrl.split(`${LABS_BUCKET}/`)[1];
            if (pathParts) {
                await supabase.storage.from(LABS_BUCKET).remove([pathParts]);
            }
        }

        // 2. Borrar registro de la Base de Datos
        const { error: dbError } = await supabase
            .from('laboratorios')
            .delete()
            .eq('id', labId);

        if (dbError) throw dbError;

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene categorías únicas presentes en la base de datos
 */
export async function getUniqueCategories() {
    try {
        const { data } = await supabase.from('laboratorios').select('categoria');
        const categories = new Set(['todos']);
        data.forEach(item => {
            if (item.categoria) categories.add(item.categoria);
        });
        return Array.from(categories);
    } catch {
        return ['todos', 'Programación', 'Seguridad', 'Redes', 'IA'];
    }
}

// ============================================
// FUNCIONES DE INICIALIZACIÓN DE PÁGINAS (UI)
// ============================================

export async function initHomePage() {
    const container = document.getElementById('labsPreview');
    if (!container) return;
    const result = await listLabs(null, 6);
    if (result.success) {
        // Lógica de renderizado para index/inicio
    }
}

export async function initLabsPage() {
    // Lógica para renderizar la lista completa con filtros
}

export async function initUploadPage() {
    // Esta función es llamada por el router al cargar subir.html
}

export async function initDetailPage() {
    // Esta función es llamada por el router al cargar detalle.html
}
