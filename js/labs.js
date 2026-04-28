// js/labs.js - VERSION PRO FINAL
import { supabase, LABS_BUCKET } from './supabase-config.js';
import { obtenerUsuarioActual } from './auth.js';

let currentUser = null;
export function setCurrentUser(user) { currentUser = user; }

// ============================================
// SUBIR LABORATORIO
// ============================================
export async function uploadLab(file, title, description, category) {
    const user = currentUser || obtenerUsuarioActual();

    if (!user) {
        return { success: false, error: 'Debes iniciar sesión' };
    }

    try {
        if (!file) return { success: false, error: 'Selecciona un archivo' };
        if (file.size > 10 * 1024 * 1024) {
            return { success: false, error: 'Máximo 10MB' };
        }

        const fileName = `${user.id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // 1. subir archivo
        const { error: uploadError } = await supabase.storage
            .from(LABS_BUCKET)
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 2. obtener URL pública
        const { data: urlData } = supabase.storage
            .from(LABS_BUCKET)
            .getPublicUrl(fileName);

        // 3. guardar en DB
        const { data, error } = await supabase
            .from('laboratorios')
            .insert({
                titulo: title,
                descripcion: description,
                categoria: category,
                archivo_url: urlData.publicUrl,
                user_id: user.id,
                downloads: 0
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, metadata: data };

    } catch (error) {
        console.error('❌ Error al subir:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// LISTAR LABORATORIOS
// ============================================
export async function listLabs(category = null, limit = 50) {
    try {
        let query = supabase
            .from('laboratorios')
            .select('*')
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
            fileUrl: lab.archivo_url,
            userId: lab.user_id,
            createdAt: lab.creado_en,
            downloads: lab.downloads || 0
        }));

        return { success: true, labs };

    } catch (error) {
        console.error('❌ Error al listar:', error);
        return { success: false, error: error.message, labs: [] };
    }
}

// ============================================
// OBTENER LAB POR ID
// ============================================
export async function getLabById(labId) {
    try {
        const { data, error } = await supabase
            .from('laboratorios')
            .select('*')
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
                fileUrl: data.archivo_url,
                userId: data.user_id,
                createdAt: data.creado_en,
                downloads: data.downloads || 0
            }
        };

    } catch (error) {
        console.error('❌ Error al obtener:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// DESCARGA
// ============================================
export function getDownloadUrl(fileUrl) {
    return fileUrl;
}

// ============================================
// CONTADOR DESCARGAS
// ============================================
export async function incrementDownloads(labId, currentDownloads = 0) {
    try {
        const { error } = await supabase
            .from('laboratorios')
            .update({ downloads: currentDownloads + 1 })
            .eq('id', labId);

        return !error;
    } catch {
        return false;
    }
}

// ============================================
// ELIMINAR LAB
// ============================================
export async function deleteLab(labId, fileUrl, userId) {
    const user = currentUser || obtenerUsuarioActual();

    if (!user || user.id !== userId) {
        return { success: false, error: 'Sin permisos' };
    }

    try {
        const fileName = fileUrl.split('/').pop();

        // borrar archivo
        const { error: storageError } = await supabase.storage
            .from(LABS_BUCKET)
            .remove([fileName]);

        if (storageError) throw storageError;

        // borrar DB
        const { error: dbError } = await supabase
            .from('laboratorios')
            .delete()
            .eq('id', labId);

        if (dbError) throw dbError;

        return { success: true };

    } catch (error) {
        console.error('❌ Error al eliminar:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// CATEGORÍAS
// ============================================
export async function getUniqueCategories() {
    try {
        const { data } = await supabase
            .from('laboratorios')
            .select('categoria');

        const categories = new Set(['todos']);
        data.forEach(item => {
            if (item.categoria) categories.add(item.categoria);
        });

        return Array.from(categories);

    } catch {
        return ['todos'];
    }
}

// ============================================
// UI PÁGINAS
// ============================================
export async function initHomePage() {
    const container = document.getElementById('labs-grid');
    if (!container) return;

    const result = await listLabs();
    if (result.success) {
        const ultimos = result.labs.slice(0, 3);

        container.innerHTML = ultimos.map(lab => `
            <div class="lab-card" data-id="${lab.id}">
                <h3>${lab.title}</h3>
                <p>${lab.description?.substring(0, 100)}...</p>
                <small>📁 ${lab.category}</small>
            </div>
        `).join('');
    }
}

export async function initLabsPage() {
    const container = document.getElementById('listaLaboratorios');
    if (!container) return;

    container.innerHTML = 'Cargando...';

    const result = await listLabs();

    if (result.success && result.labs.length > 0) {
        container.innerHTML = result.labs.map(lab => `
            <div class="lab-card">
                <h3>${lab.title}</h3>
                <p>${lab.description?.substring(0, 100)}...</p>
                <p>📁 ${lab.category} | ⬇️ ${lab.downloads}</p>
                <button onclick="window.location.hash='detalle?id=${lab.id}'">Ver</button>
            </div>
        `).join('');
    } else {
        container.innerHTML = 'No hay laboratorios';
    }
}

export async function initUploadPage() {
    const form = document.getElementById('formSubir');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('labNombre').value;
        const description = document.getElementById('labDescripcion').value;
        const category = document.getElementById('labCategoria').value;
        const file = document.getElementById('labArchivo').files[0];

        const result = await uploadLab(file, title, description, category);

        const msg = document.getElementById('msgSubir');

        if (result.success) {
            msg.innerHTML = '✅ Subido';
            setTimeout(() => window.location.hash = 'laboratorios', 1500);
        } else {
            msg.innerHTML = '❌ ' + result.error;
        }
    });
}

export async function initDetailPage() {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const id = params.get('id');

    if (!id) return;

    const result = await getLabById(id);

    if (!result.success) return;

    const lab = result.lab;
    const container = document.getElementById('detalleContent');

    if (!container) return;

    container.innerHTML = `
        <h2>${lab.title}</h2>
        <p>${lab.description}</p>
        <p>📁 ${lab.category}</p>
        <button id="downloadBtn">📥 Descargar</button>
    `;

    document.getElementById('downloadBtn').addEventListener('click', async () => {
        await incrementDownloads(lab.id, lab.downloads);
        window.open(lab.fileUrl, '_blank');
    });
}

console.log('✅ labs.js PRO listo');
