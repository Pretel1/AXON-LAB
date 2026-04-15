/**
 * AXON - BUSCADOR.JS
 * Búsqueda y filtros en tiempo real
 */

/**
 * Configura el buscador en tiempo real
 * @param {string} inputId - ID del input de búsqueda
 * @param {string} filterId - ID del select de filtro
 * @param {string} resultsContainerId - ID del contenedor de resultados
 * @param {function} renderFunction - Función para renderizar resultados
 */
function configurarBuscador(inputId, filterId, resultsContainerId, renderFunction) {
    const searchInput = document.getElementById(inputId);
    const categoryFilter = document.getElementById(filterId);
    
    if (!searchInput || !categoryFilter) return;
    
    function actualizarResultados() {
        const searchTerm = searchInput.value;
        const category = categoryFilter.value;
        
        const laboratorios = window.obtenerLaboratorios ? window.obtenerLaboratorios() : [];
        const filtrados = window.filtrarLaboratorios ? 
            window.filtrarLaboratorios(laboratorios, searchTerm, category) : 
            laboratorios;
        
        if (renderFunction) {
            renderFunction(filtrados);
        }
        
        // Actualizar contador
        const resultsSpan = document.getElementById('resultsCount');
        if (resultsSpan) {
            resultsSpan.textContent = filtrados.length;
        }
    }
    
    searchInput.addEventListener('input', actualizarResultados);
    categoryFilter.addEventListener('change', actualizarResultados);
    
    // Ejecutar inicial
    actualizarResultados();
}

/**
 * Configura un botón de reset de filtros
 * @param {string} resetBtnId - ID del botón de reset
 * @param {string} inputId - ID del input de búsqueda
 * @param {string} filterId - ID del select de filtro
 */
function configurarResetFiltros(resetBtnId, inputId, filterId) {
    const resetBtn = document.getElementById(resetBtnId);
    const searchInput = document.getElementById(inputId);
    const categoryFilter = document.getElementById(filterId);
    
    if (!resetBtn) return;
    
    resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'todas';
        
        // Disparar evento de cambio
        if (searchInput) searchInput.dispatchEvent(new Event('input'));
        if (categoryFilter) categoryFilter.dispatchEvent(new Event('change'));
    });
}

/**
 * Filtra laboratorios por múltiples criterios
 * @param {array} laboratorios
 * @param {object} criterios
 * @returns {array}
 */
function filtrarAvanzado(laboratorios, criterios) {
    let resultados = [...laboratorios];
    
    if (criterios.searchTerm) {
        const term = criterios.searchTerm.toLowerCase();
        resultados = resultados.filter(lab =>
            lab.nombre.toLowerCase().includes(term) ||
            lab.autor.toLowerCase().includes(term)
        );
    }
    
    if (criterios.categoria && criterios.categoria !== 'todas') {
        resultados = resultados.filter(lab => lab.categoria === criterios.categoria);
    }
    
    if (criterios.fechaDesde) {
        resultados = resultados.filter(lab => lab.fecha >= criterios.fechaDesde);
    }
    
    if (criterios.fechaHasta) {
        resultados = resultados.filter(lab => lab.fecha <= criterios.fechaHasta);
    }
    
    if (criterios.minDescargas) {
        resultados = resultados.filter(lab => (lab.descargas || 0) >= criterios.minDescargas);
    }
    
    return resultados;
}

/**
 * Ordena laboratorios por diferentes criterios
 * @param {array} laboratorios
 * @param {string} criterio - fecha, descargas, vistas, nombre
 * @param {string} orden - asc, desc
 * @returns {array}
 */
function ordenarLaboratorios(laboratorios, criterio = 'fecha', orden = 'desc') {
    const resultados = [...laboratorios];
    
    resultados.sort((a, b) => {
        let valorA, valorB;
        
        switch (criterio) {
            case 'fecha':
                valorA = new Date(a.fecha);
                valorB = new Date(b.fecha);
                break;
            case 'descargas':
                valorA = a.descargas || 0;
                valorB = b.descargas || 0;
                break;
            case 'vistas':
                valorA = a.vistas || 0;
                valorB = b.vistas || 0;
                break;
            case 'nombre':
                valorA = a.nombre.toLowerCase();
                valorB = b.nombre.toLowerCase();
                break;
            default:
                valorA = a.id;
                valorB = b.id;
        }
        
        if (orden === 'asc') {
            return valorA > valorB ? 1 : -1;
        } else {
            return valorA < valorB ? 1 : -1;
        }
    });
    
    return resultados;
}

// Exportar funciones globales
window.configurarBuscador = configurarBuscador;
window.configurarResetFiltros = configurarResetFiltros;
window.filtrarAvanzado = filtrarAvanzado;
window.ordenarLaboratorios = ordenarLaboratorios;