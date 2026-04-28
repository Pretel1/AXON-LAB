// js/labs.js - Migrado a Supabase
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
        return { success: false, error: 'Debes iniciar sesión para subir laboratorios' };
    }
    
    try {
        if (!file) return { success: false, error: 'No se seleccionó ningún archivo' };
        if (file.size > 10 * 1024 * 1024) {
            return { success: false, error: 'El archivo no debe superar los 10MB' };
        }
        
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { error: uploadError } = await supabase.storage
            .from(LABS_BUCKET)
            .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: doc, error: dbError } = await supabase
            .from('laboratorios')
            .insert({
                title: title,
                description: description,
                category: category,
                file_id: fileName,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                user_id: user.id,
                user_email: user.email,
                user_name: user.nombre
            })
            .select()
            .single();
        
        if (dbError) throw dbError;
        
        console.log('✅ Laboratorio subido:', doc);
        return { success: true, metadata: doc };
        
    } catch (error) {
        console.error('Error al subir:', error);
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
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (category && category !== 'todos' && category !== '') {
            query = query.eq('category', category);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        const labs = data.map(lab => ({
            $id: lab.id,
            title: lab.title,
            description: lab.description,
            category: lab.category,
            fileId: lab.file_id,
            fileName: lab.file_name,
            fileSize: lab.file_size,
            fileType: lab.file_type,
            userId: lab.user_id,
            userEmail: lab.user_email,
            userName: lab.user_name,
            createdAt: lab.created_at,
            downloads: lab.downloads
        }));
        
        return { success: true, labs: labs };
        
    } catch (error) {
        console.error('Error al listar:', error);
        return { success: false, error: error.message, labs: [] };
    }
}

// ============================================
// OBTENER LABORATORIO POR ID
// ============================================
export async function getLabById(labId) {
    try {
        const { data, error } = await supabase
            .from('laboratorios')
            .select('*')
            .eq('id', labId)
            .single();
        
        if (error) throw error;
        
        const lab = {
            $id: data.id,
            title: data.title,
            description: data.description,
            category: data.category,
            fileId: data.file_id,
            fileName: data.file_name,
            fileSize: data.file_size,
            fileType: data.file_type,
            userId: data.user_id,
            userEmail: data.user_email,
            userName: data.user_name,
            createdAt: data.created_at,
            downloads: data.downloads
        };
        
        return { success: true, lab: lab };
        
    } catch (error) {
        console.error('Error al obtener:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// OBTENER URL DE DESCARGA
// ============================================
export async function getDownloadUrl(fileId) {
    try {
        const { data: { publicUrl } } = supabase.storage
            .from(LABS_BUCKET)
            .getPublicUrl(fileId);
        
        return publicUrl;
    } catch (error) {
        console.error('Error al obtener URL:', error);
        return null;
    }
}

// ============================================
// INCREMENTAR CONTADOR
// ============================================
export async function incrementDownloads(labId, currentDownloads) {
    try {
        const { error } = await supabase
            .from('laboratorios')
            .update({ downloads: (currentDownloads || 0) + 1 })
            .eq('id', labId);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error al actualizar:', error);
        return false;
    }
}

// ============================================
// ELIMINAR LABORATORIO
// ============================================
export async function deleteLab(labId, fileId, userId) {
    const user = currentUser || obtenerUsuarioActual();
    
    if (!user) return { success: false, error: 'Debes iniciar sesión' };
    if (user.id !== userId) return { success: false, error: 'No tienes permisos' };
    
    try {
        await supabase.storage.from(LABS_BUCKET).remove([fileId]);
        
        const { error } = await supabase
            .from('laboratorios')
            .delete()
            .eq('id', labId);
        
        if (error) throw error;
        
        return { success: true };
        
    } catch (error) {
        console.error('Error al eliminar:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// OBTENER CATEGORÍAS ÚNICAS
// ============================================
export async function getUniqueCategories() {
    try {
        const { data, error } = await supabase
            .from('laboratorios')
            .select('category')
            .not('category', 'is', null);
        
        if (error) throw error;
        
        const categories = new Set();
        categories.add('todos');
        data.forEach(item => {
            if (item.category) categories.add(item.category);
        });
        
        return Array.from(categories);
        
    } catch (error) {
        return ['todos'];
    }
}

// ============================================
// FUNCIONES PARA ROUTER
// ============================================
export async function initHomePage() { 
    console.log('🏠 Inicio');
    const container = document.getElementById('labs-grid');
    if (container) {
        const result = await listLabs();
        if (result.success && result.labs.length > 0) {
            // Mostrar últimos 3 laboratorios
            const ultimos = result.labs.slice(0, 3);
            container.innerHTML = ultimos.map(lab => `
                <div class="lab-card" data-id="${lab.$id}">
                    <h3>${lab.title}</h3>
                    <p>${lab.description?.substring(0, 100)}...</p>
                    <small>📁 ${lab.category}</small>
                </div>
            `).join('');
        }
    }
}

export async function initLabsPage() { 
    console.log('📚 Laboratorios');
    await cargarLaboratorios();
}

export async function initCategoriesPage() { 
    console.log('🏷️ Categorías');
    const categories = await getUniqueCategories();
    const container = document.getElementById('listaCategorias');
    if (container) {
        container.innerHTML = categories.filter(c => c !== 'todos').map(cat => `
            <div class="category-card" data-category="${cat}">
                <h3>📁 ${cat}</h3>
                <button onclick="window.location.hash='laboratorios'">Ver</button>
            </div>
        `).join('');
    }
}

export async function initUploadPage() { 
    console.log('📤 Subir laboratorio');
    const form = document.getElementById('formSubir');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('labNombre').value;
            const description = document.getElementById('labDescripcion').value;
            const category = document.getElementById('labCategoria').value;
            const file = document.getElementById('labArchivo').files[0];
            
            const result = await uploadLab(file, title, description, category);
            const msgDiv = document.getElementById('msgSubir');
            if (result.success) {
                msgDiv.innerHTML = '<div class="alert alert-success">✅ Laboratorio subido</div>';
                setTimeout(() => window.location.hash = 'laboratorios', 1500);
            } else {
                msgDiv.innerHTML = `<div class="alert alert-error">❌ ${result.error}</div>`;
            }
        });
    }
}

export async function initDetailPage() { 
    console.log('🔍 Detalle');
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const id = params.get('id');
    if (id) {
        const result = await getLabById(id);
        if (result.success) {
            const lab = result.lab;
            const container = document.getElementById('detalleContent');
            if (container) {
                container.innerHTML = `
                    <h2>${lab.title}</h2>
                    <p>${lab.description}</p>
                    <p>Categoría: ${lab.category}</p>
                    <p>Autor: ${lab.userName}</p>
                    <button id="downloadBtn" class="btn btn-primary">📥 Descargar</button>
                `;
                document.getElementById('downloadBtn')?.addEventListener('click', async () => {
                    const url = await getDownloadUrl(lab.fileId);
                    if (url) window.open(url, '_blank');
                });
            }
        }
    }
}

async function cargarLaboratorios() {
    const container = document.getElementById('listaLaboratorios');
    if (!container) return;
    
    container.innerHTML = '<div class="loader">Cargando...</div>';
    const result = await listLabs();
    
    if (result.success && result.labs.length > 0) {
        container.innerHTML = result.labs.map(lab => `
            <div class="lab-card">
                <h3>${lab.title}</h3>
                <p>${lab.description?.substring(0, 100)}...</p>
                <p>📁 ${lab.category} | 👤 ${lab.userName} | ⬇️ ${lab.downloads}</p>
                <button onclick="window.location.hash='detalle?id=${lab.$id}'">Ver más</button>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p>No hay laboratorios disponibles.</p>';
    }
}

console.log('✅ Labs.js migrado a Supabase');
