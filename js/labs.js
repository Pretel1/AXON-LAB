import { supabase, LABS_BUCKET } from './supabase-config.js';
import { obtenerUsuarioActual } from './auth.js';

let currentUser = null;
export function setCurrentUser(user) { currentUser = user; }

export async function uploadLab(tipo, fileOrLink, title, description, category) {
    const user = currentUser || obtenerUsuarioActual();
    if (!user) return { success: false, error: 'Debes iniciar sesión' };
    if (user.rol === 'estudiante') return { success: false, error: 'Permisos insuficientes. Solo profesores.' };

    try {
        let archivoUrl = '';

        if (tipo === 'archivo') {
            if (!fileOrLink) return { success: false, error: 'Selecciona un archivo' };
            const fileName = `${user.id}_${Date.now()}_${fileOrLink.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const { error: uploadError } = await supabase.storage.from(LABS_BUCKET).upload(fileName, fileOrLink);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from(LABS_BUCKET).getPublicUrl(fileName);
            archivoUrl = urlData.publicUrl;
        } else {
            if (!fileOrLink || (!fileOrLink.includes('1drv.ms') && !fileOrLink.includes('sharepoint.com') && !fileOrLink.includes('http'))) {
                return { success: false, error: 'Enlace no válido' };
            }
            archivoUrl = fileOrLink;
        }

        const { data, error } = await supabase.from('laboratorios').insert({
            titulo: title,
            descripcion: description,
            categoria: category,
            tipo_recurso: tipo,
            archivo_url: archivoUrl,
            user_id: user.id,
            downloads: 0
        }).select().single();

        if (error) throw error;
        return { success: true, metadata: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function listLabs(category = null, limit = 50) {
    try {
        let query = supabase.from('laboratorios').select('*, perfiles(nombre)').order('creado_en', { ascending: false }).limit(limit);
        if (category && category !== 'todos') query = query.eq('categoria', category);
        
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
            userName: lab.perfiles?.nombre || 'Desconocido',
            createdAt: lab.creado_en,
            downloads: lab.downloads || 0
        }));
        return { success: true, labs };
    } catch (error) {
        return { success: false, error: error.message, labs: [] };
    }
}

export async function getLabById(labId) {
    try {
        const { data, error } = await supabase.from('laboratorios').select('*, perfiles(nombre)').eq('id', labId).single();
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
                userName: data.perfiles?.nombre || 'Desconocido',
                createdAt: data.creado_en,
                downloads: data.downloads || 0
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function incrementDownloads(labId, currentDownloads = 0) {
    const { error } = await supabase.from('laboratorios').update({ downloads: currentDownloads + 1 }).eq('id', labId);
    return !error;
}

export async function deleteLab(labId, fileUrl, userId, tipo) {
    const user = currentUser || obtenerUsuarioActual();
    if (!user || (user.id !== userId && user.rol !== 'admin')) return { success: false, error: 'Sin permisos' };

    try {
        if (tipo === 'archivo') {
            const fileName = fileUrl.split('/').pop();
            await supabase.storage.from(LABS_BUCKET).remove([fileName]);
        }
        const { error } = await supabase.from('laboratorios').delete().eq('id', labId);
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
