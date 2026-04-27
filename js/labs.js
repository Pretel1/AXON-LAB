// js/labs.js - Versión completa con Appwrite + funciones para router
import { storage, databases, ID, DATABASE_ID, LABS_COLLECTION_ID, DOCUMENTS_BUCKET_ID } from './appwrite-config.js';
import { haySesionActiva, obtenerUsuarioActual } from './auth.js';

// Variable para el usuario actual (se actualiza desde auth)
let currentUser = null;

// ============================================
// FUNCIÓN PARA ACTUALIZAR USUARIO
// ============================================
export function setCurrentUser(user) {
    currentUser = user;
}

// ============================================
// OBTENER USUARIO ACTUAL (con respaldo de auth)
// ============================================
function getCurrentUser() {
    if (currentUser) return currentUser;
    return obtenerUsuarioActual();
}

// ============================================
// SUBIR LABORATORIO
// ============================================
export async function uploadLab(file, title, description, category) {
    const user = getCurrentUser();
    
    if (!user) {
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
            userId: user.$id,
            userEmail: user.email,
            userName: user.nombre || user.email,
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
export async function listLabs(category = null, limit = 50) {
    try {
        let queries = [];
        
        if (category && category !== 'todos' && category !== '') {
            queries.push(`category="${category}"`);
        }
        
        // Ordenar por fecha más reciente
        queries.push('orderDesc("createdAt")');
        queries.push(`limit(${limit})`);
        
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
    const user = getCurrentUser();
    
    if (!user) {
        return { success: false, error: 'Debes iniciar sesión para eliminar laboratorios' };
    }
    
    // Verificar permisos (solo el dueño puede eliminar)
    if (user.$id !== userId && user.email !== userId) {
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
// OBTENER CATEGORÍAS ÚNICAS
// ============================================
export async function getUniqueCategories() {
    try {
        const result = await listLabs();
        if (!result.success) return [];
        
        const categories = new Set();
        categories.add('todos');
        
        result.labs.forEach(lab => {
            if (lab.category) categories.add(lab.category);
        });
        
        return Array.from(categories);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        return ['todos'];
    }
}

// ============================================
// ============================================
// FUNCIONES PARA EL ROUTER (init Pages)
// ============================================
// ============================================

// ============================================
// INICIALIZAR PÁGINA DE INICIO
// ============================================
export async function initHomePage() {
    console.log('🏠 Inicializando página de inicio');
    
    const container = document.querySelector('.home-container, #labs-container, .labs-grid');
    if (!container) {
        // Crear contenedor si no existe
        const contentDiv = document.getElementById('page-content');
        if (contentDiv && !contentDiv.querySelector('.labs-grid')) {
            contentDiv.innerHTML += `
                <div class="home-container">
                    <div class="hero-section">
                        <h1>Bienvenido a AXON-LAB</h1>
                        <p>Laboratorios académicos para tu aprendizaje</p>
                    </div>
                    <div class="labs-grid" id="labs-grid"></div>
                </div>
            `;
        }
    }
    
    await cargarLaboratoriosEnGrid('todos', 'labs-grid');
}

// ============================================
// INICIALIZAR PÁGINA DE LABORATORIOS
// ============================================
export async function initLabsPage() {
    console.log('📚 Inicializando página de laboratorios');
    
    // Buscar contenedor o crearlo
    let gridContainer = document.getElementById('labs-grid');
    if (!gridContainer) {
        const contentDiv = document.getElementById('page-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="labs-page">
                    <div class="filters-section">
                        <h2>📚 Laboratorios</h2>
                        <div class="category-filters" id="category-filters">
                            <button class="filter-btn active" data-category="todos">Todos</button>
                        </div>
                    </div>
                    <div class="labs-grid" id="labs-grid">
                        <div class="loader">Cargando laboratorios...</div>
                    </div>
                </div>
            `;
            gridContainer = document.getElementById('labs-grid');
        }
    }
    
    // Cargar categorías
    await cargarCategorias();
    
    // Cargar laboratorios
    await cargarLaboratoriosEnGrid('todos', 'labs-grid');
    
    // Configurar eventos de filtros
    configurarFiltros();
}

// ============================================
// INICIALIZAR PÁGINA DE CATEGORÍAS
// ============================================
export async function initCategoriesPage() {
    console.log('🏷️ Inicializando página de categorías');
    
    const categories = await getUniqueCategories();
    const contentDiv = document.getElementById('page-content');
    
    if (contentDiv) {
        let html = `
            <div class="categories-page">
                <h2>📂 Categorías de Laboratorios</h2>
                <div class="categories-grid" id="categories-grid">
        `;
        
        for (const cat of categories) {
            if (cat === 'todos') continue;
            const labs = await listLabs(cat);
            const count = labs.success ? labs.labs.length : 0;
            html += `
                <div class="category-card" data-category="${cat}">
                    <div class="category-icon">📁</div>
                    <h3>${cat}</h3>
                    <p>${count} laboratorio${count !== 1 ? 's' : ''}</p>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
        
        contentDiv.innerHTML = html;
        
        // Configurar clic en categorías
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                if (category && typeof window.navigateTo === 'function') {
                    window.navigateTo('laboratorios');
                    // Guardar categoría seleccionada
                    sessionStorage.setItem('selectedCategory', category);
                }
            });
        });
    }
}

// ============================================
// INICIALIZAR PÁGINA DE SUBIR
// ============================================
export async function initUploadPage() {
    console.log('📤 Inicializando página de subir laboratorio');
    
    const user = getCurrentUser();
    if (!user) {
        // Redirigir a login si no hay sesión
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('login');
        }
        return;
    }
    
    // Verificar si ya existe el formulario
    const existingForm = document.getElementById('upload-form');
    if (existingForm) return;
    
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = `
        <div class="upload-page">
            <h2>📤 Subir Laboratorio</h2>
            <p>Completa el formulario para compartir tu laboratorio</p>
            
            <form id="upload-form" class="upload-form">
                <div class="form-group">
                    <label for="lab-title">Título del laboratorio *</label>
                    <input type="text" id="lab-title" required placeholder="Ej: Introducción a la Programación">
                </div>
                
                <div class="form-group">
                    <label for="lab-category">Categoría *</label>
                    <select id="lab-category" required>
                        <option value="">Selecciona una categoría</option>
                        <option value="Programación">💻 Programación</option>
                        <option value="Matemáticas">📐 Matemáticas</option>
                        <option value="Física">⚡ Física</option>
                        <option value="Química">🧪 Química</option>
                        <option value="Biología">🧬 Biología</option>
                        <option value="Idiomas">🌐 Idiomas</option>
                        <option value="Otros">📚 Otros</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="lab-description">Descripción *</label>
                    <textarea id="lab-description" rows="5" required placeholder="Describe el contenido del laboratorio..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="lab-file">Archivo (PDF/DOCX/ZIP) *</label>
                    <input type="file" id="lab-file" accept=".pdf,.docx,.zip,.rar" required>
                    <small>Máximo 10MB. Formatos permitidos: PDF, DOCX, ZIP</small>
                </div>
                
                <div id="upload-message"></div>
                
                <button type="submit" class="btn btn-primary">📤 Publicar Laboratorio</button>
            </form>
        </div>
    `;
    
    // Configurar evento del formulario
    const form = document.getElementById('upload-form');
    const messageDiv = document.getElementById('upload-message');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('lab-title').value.trim();
        const category = document.getElementById('lab-category').value;
        const description = document.getElementById('lab-description').value.trim();
        const file = document.getElementById('lab-file').files[0];
        
        if (!title || !category || !description || !file) {
            messageDiv.innerHTML = '<div class="alert alert-error">⚠️ Completa todos los campos</div>';
            return;
        }
        
        const btn = form.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = '⏳ Subiendo...';
        btn.disabled = true;
        
        const result = await uploadLab(file, title, description, category);
        
        if (result.success) {
            messageDiv.innerHTML = '<div class="alert alert-success">✅ ¡Laboratorio subido exitosamente!</div>';
            form.reset();
            
            setTimeout(() => {
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('laboratorios');
                }
            }, 2000);
        } else {
            messageDiv.innerHTML = `<div class="alert alert-error">❌ ${result.error}</div>`;
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

// ============================================
// INICIALIZAR PÁGINA DE DETALLE
// ============================================
export async function initDetailPage() {
    console.log('🔍 Inicializando página de detalle');
    
    // Obtener ID del laboratorio de los parámetros
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    let labId = params.get('id');
    
    // Si no está en hash, buscar en sessionStorage
    if (!labId) {
        const navParams = sessionStorage.getItem('navigationParams');
        if (navParams) {
            try {
                const parsed = JSON.parse(navParams);
                labId = parsed.id;
            } catch (e) {}
        }
    }
    
    if (!labId) {
        const contentDiv = document.getElementById('page-content');
        if (contentDiv) {
            contentDiv.innerHTML = '<div class="alert alert-error">❌ No se especificó ningún laboratorio</div>';
        }
        return;
    }
    
    const result = await getLabById(labId);
    
    if (!result.success || !result.lab) {
        const contentDiv = document.getElementById('page-content');
        if (contentDiv) {
            contentDiv.innerHTML = '<div class="alert alert-error">❌ Laboratorio no encontrado</div>';
        }
        return;
    }
    
    const lab = result.lab;
    const user = getCurrentUser();
    const isOwner = user && (user.$id === lab.userId || user.email === lab.userEmail);
    
    const contentDiv = document.getElementById('page-content');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = `
        <div class="detail-page">
            <button class="btn-back" onclick="window.navigateTo('laboratorios')">← Volver</button>
            
            <div class="detail-card">
                <h1>${escapeHtml(lab.title)}</h1>
                
                <div class="detail-meta">
                    <span class="meta-category">📁 ${escapeHtml(lab.category)}</span>
                    <span class="meta-author">👤 ${escapeHtml(lab.userName)}</span>
                    <span class="meta-date">📅 ${new Date(lab.createdAt).toLocaleDateString()}</span>
                    <span class="meta-downloads">⬇️ ${lab.downloads || 0} descargas</span>
                </div>
                
                <div class="detail-description">
                    <h3>Descripción</h3>
                    <p>${escapeHtml(lab.description)}</p>
                </div>
                
                <div class="detail-actions">
                    <button id="download-btn" class="btn btn-primary">📥 Descargar Laboratorio</button>
                    ${isOwner ? `<button id="delete-btn" class="btn btn-danger">🗑️ Eliminar Laboratorio</button>` : ''}
                </div>
                
                <div id="detail-message"></div>
            </div>
        </div>
    `;
    
    // Configurar descarga
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const url = await getDownloadUrl(lab.fileId);
            if (url) {
                window.open(url, '_blank');
                await incrementDownloads(lab.$id, lab.downloads);
                lab.downloads = (lab.downloads || 0) + 1;
                const downloadsSpan = document.querySelector('.meta-downloads');
                if (downloadsSpan) {
                    downloadsSpan.textContent = `⬇️ ${lab.downloads} descargas`;
                }
            } else {
                const msgDiv = document.getElementById('detail-message');
                msgDiv.innerHTML = '<div class="alert alert-error">❌ Error al obtener el archivo</div>';
            }
        });
    }
    
    // Configurar eliminación
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('¿Estás seguro de que deseas eliminar este laboratorio? Esta acción no se puede deshacer.')) {
                const result = await deleteLab(lab.$id, lab.fileId, lab.userId);
                const msgDiv = document.getElementById('detail-message');
                
                if (result.success) {
                    msgDiv.innerHTML = '<div class="alert alert-success">✅ Laboratorio eliminado exitosamente</div>';
                    setTimeout(() => {
                        if (typeof window.navigateTo === 'function') {
                            window.navigateTo('laboratorios');
                        }
                    }, 1500);
                } else {
                    msgDiv.innerHTML = `<div class="alert alert-error">❌ ${result.error}</div>`;
                }
            }
        });
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function cargarLaboratoriosEnGrid(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<div class="loader">Cargando laboratorios...</div>';
    
    const result = await listLabs(category === 'todos' ? null : category);
    
    if (!result.success || result.labs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>📭 No hay laboratorios disponibles en esta categoría</p>
                ${haySesionActiva() ? '<a href="#subir" class="btn btn-primary">➕ Subir el primero</a>' : ''}
            </div>
        `;
        return;
    }
    
    let html = '<div class="labs-grid">';
    for (const lab of result.labs) {
        html += `
            <div class="lab-card" data-id="${lab.$id}">
                <div class="lab-icon">📄</div>
                <h3>${escapeHtml(lab.title)}</h3>
                <p class="lab-description">${escapeHtml(lab.description.substring(0, 100))}${lab.description.length > 100 ? '...' : ''}</p>
                <div class="lab-meta">
                    <span class="lab-category">📁 ${escapeHtml(lab.category)}</span>
                    <span class="lab-downloads">⬇️ ${lab.downloads || 0}</span>
                </div>
                <div class="lab-author">👤 ${escapeHtml(lab.userName)}</div>
                <button class="btn-view" data-id="${lab.$id}">Ver Detalle</button>
            </div>
        `;
    }
    html += '</div>';
    
    container.innerHTML = html;
    
    // Configurar eventos de los botones "Ver Detalle"
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('detalle', { id: id });
            } else {
                window.location.hash = `detalle?id=${id}`;
            }
        });
    });
}

async function cargarCategorias() {
    const categories = await getUniqueCategories();
    const filtersContainer = document.getElementById('category-filters');
    if (!filtersContainer) return;
    
    let html = '';
    for (const cat of categories) {
        html += `<button class="filter-btn" data-category="${cat}">${cat === 'todos' ? '📋 Todos' : `📁 ${cat}`}</button>`;
    }
    filtersContainer.innerHTML = html;
}

function configurarFiltros() {
    const filters = document.querySelectorAll('.filter-btn');
    if (!filters.length) return;
    
    filters.forEach(filter => {
        filter.addEventListener('click', async () => {
            // Actualizar clase activa
            filters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            
            const category = filter.dataset.category;
            await cargarLaboratoriosEnGrid(category, 'labs-grid');
        });
    });
    
    // Verificar si hay una categoría seleccionada previamente
    const selectedCategory = sessionStorage.getItem('selectedCategory');
    if (selectedCategory) {
        const filterToActivate = Array.from(filters).find(f => f.dataset.category === selectedCategory);
        if (filterToActivate) {
            filterToActivate.click();
            sessionStorage.removeItem('selectedCategory');
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// EXPORTAR FUNCIONES AL WINDOW
// ============================================
window.uploadLab = uploadLab;
window.listLabs = listLabs;
window.getLabById = getLabById;
window.getDownloadUrl = getDownloadUrl;
window.deleteLab = deleteLab;
window.initHomePage = initHomePage;
window.initLabsPage = initLabsPage;
window.initCategoriesPage = initCategoriesPage;
window.initUploadPage = initUploadPage;
window.initDetailPage = initDetailPage;

console.log('✅ Labs.js cargado con Appwrite + funciones para router');
