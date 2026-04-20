// js/labs.js - Gestión de laboratorios con LocalStorage y portada en Base64

function initLabs() {
    if (!localStorage.getItem('laboratorios')) {
        const labsEjemplo = [
            { id: 1, nombre: "Introducción a Redes", autor: "Dr. Gómez", categoria: "Redes", url: "https://onedrive.live.com/ejemplo1", portada: "", fecha: new Date().toISOString() },
            { id: 2, nombre: "Programación en Java", autor: "Ing. López", categoria: "Programación", url: "https://onedrive.live.com/ejemplo2", portada: "", fecha: new Date().toISOString() }
        ];
        localStorage.setItem('laboratorios', JSON.stringify(labsEjemplo));
    }
}

window.obtenerLaboratorios = () => JSON.parse(localStorage.getItem('laboratorios')) || [];

window.agregarLaboratorio = (nombre, autor, categoria, url, portadaBase64 = "") => {
    const labs = window.obtenerLaboratorios();
    const nuevoId = labs.length > 0 ? Math.max(...labs.map(l => l.id)) + 1 : 1;
    labs.push({
        id: nuevoId,
        nombre: nombre.trim(),
        autor: autor.trim(),
        categoria: categoria,
        url: url.trim(),
        portada: portadaBase64,
        fecha: new Date().toISOString()
    });
    localStorage.setItem('laboratorios', JSON.stringify(labs));
    return true;
};

window.eliminarLaboratorio = (id) => {
    let labs = window.obtenerLaboratorios();
    labs = labs.filter(lab => lab.id !== id);
    localStorage.setItem('laboratorios', JSON.stringify(labs));
};

window.visualizarODescargar = (url) => {
    if (url && url !== '#') window.open(url, '_blank');
    else window.mostrarNotificacion('Enlace no disponible', 'error');
};

initLabs();
console.log('✅ Labs.js con soporte de portada');
