<div class="container">
    <h2>📚 Laboratorios Disponibles</h2>
    <div class="search-bar">
        <input type="text" id="searchInput" placeholder="Buscar por nombre..." oninput="filtrarLaboratorios()">
        <select id="categoriaFilter" onchange="filtrarLaboratorios()">
            <option value="">Todas las categorías</option>
            <option>Programación</option>
            <option>Redes</option>
            <option>Bases de Datos</option>
            <option>Inteligencia Artificial</option>
            <option>Seguridad</option>
            <option>Otros</option>
        </select>
    </div>
    <div id="listaLaboratorios" class="grid"></div>
</div>

<script>
    let laboratorios = [];

    async function cargarLaboratorios() {
        const snapshot = await firebaseDB.collection('laboratorios').get();
        laboratorios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarLaboratorios();
    }

    function renderizarLaboratorios() {
        const term = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const cat = document.getElementById('categoriaFilter')?.value || '';
        const filtrados = laboratorios.filter(lab => 
            lab.nombre.toLowerCase().includes(term) &&
            (cat === '' || lab.categoria === cat)
        );
        const contenedor = document.getElementById('listaLaboratorios');
        if (!contenedor) return;
        if (filtrados.length === 0) {
            contenedor.innerHTML = '<p>No hay laboratorios que coincidan.</p>';
            return;
        }
        contenedor.innerHTML = filtrados.map(lab => `
            <div class="card">
                <h3>${lab.nombre}</h3>
                <p><strong>Autor:</strong> ${lab.autor}</p>
                <p><strong>Categoría:</strong> ${lab.categoria}</p>
                <div class="url">🔗 ${lab.url.length > 50 ? lab.url.substring(0,50)+'...' : lab.url}</div>
                <div class="btn-group">
                    <button class="btn" onclick="visualizarArchivo('${lab.url}')">👁️ Ver archivo</button>
                    <button class="btn btn-outline" onclick="descargarArchivo('${lab.url}')">⬇️ Descargar</button>
                </div>
            </div>
        `).join('');
    }

    window.visualizarArchivo = (url) => {
        if (!url || url === '#') alert('Enlace no disponible');
        else window.open(url, '_blank');
    };
    window.descargarArchivo = (url) => {
        if (!url || url === '#') alert('Enlace no disponible');
        else {
            window.open(url, '_blank');
            alert('El archivo se abrirá en una nueva pestaña. Desde OneDrive puedes usar el botón "Descargar".');
        }
    };
    window.filtrarLaboratorios = () => renderizarLaboratorios();

    document.addEventListener('pageLoaded', (e) => {
        if (e.detail.page === 'laboratorios') cargarLaboratorios();
    });
</script>
