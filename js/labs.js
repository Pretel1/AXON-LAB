// js/labs.js
function initLabs() {
    if (!localStorage.getItem('laboratorios')) {
        // Datos de ejemplo con imagen URL y enlace de OneDrive
        const labsEjemplo = [
            {
                id: 1,
                nombre: "Introducción a Redes",
                autor: "Dr. Gómez",
                categoria: "Redes",
                imagenUrl: "https://picsum.photos/id/1/300/200",
                archivoUrl: "https://onedrive.live.com/ejemplo1",
                ownerId: null,
                ownerNombre: "Admin"
            },
            {
                id: 2,
                nombre: "Programación en Java",
                autor: "Ing. López",
                categoria: "Programación",
                imagenUrl: "https://picsum.photos/id/2/300/200",
                archivoUrl: "https://onedrive.live.com/ejemplo2",
                ownerId: null,
                ownerNombre: "Admin"
            }
        ];
        localStorage.setItem('laboratorios', JSON.stringify(labsEjemplo));
    }
}

window.obtenerLaboratorios = () => JSON.parse(localStorage.getItem('laboratorios')) || [];

window.agregarLaboratorio = (nombre, autor, categoria, imagenUrl, archivoUrl) => {
    const user = window.obtenerUsuarioActual();
    if (!user) return { success: false, message: 'Debes iniciar sesión' };
    const labs = window.obtenerLaboratorios();
    const nuevoId = labs.length > 0 ? Math.max(...labs.map(l => l.id)) + 1 : 1;
    const nuevoLab = {
        id: nuevoId,
        nombre: nombre.trim(),
        autor: autor.trim(),
        categoria: categoria,
        imagenUrl: imagenUrl.trim() || "https://picsum.photos/id/20/300/200", // imagen por defecto
        archivoUrl: archivoUrl.trim(),
        ownerId: user.id,
        ownerNombre: user.nombre,
        fecha: new Date().toISOString()
    };
    labs.push(nuevoLab);
    localStorage.setItem('laboratorios', JSON.stringify(labs));
    return { success: true, message: 'Laboratorio agregado' };
};

window.eliminarLaboratorio = (id) => {
    const user = window.obtenerUsuarioActual();
    if (!user) return { success: false, message: 'No autorizado' };
    let labs = window.obtenerLaboratorios();
    const lab = labs.find(l => l.id === id);
    if (!lab) return { success: false, message: 'Laboratorio no encontrado' };
    if (lab.ownerId !== user.id) return { success: false, message: 'Solo el dueño puede eliminar' };
    labs = labs.filter(l => l.id !== id);
    localStorage.setItem('laboratorios', JSON.stringify(labs));
    return { success: true, message: 'Laboratorio eliminado' };
};

window.visualizarArchivo = (url) => {
    if (url && url !== '#') window.open(url, '_blank');
    else window.mostrarNotificacion('Enlace no disponible', 'error');
};

initLabs();
console.log('✅ Labs.js cargado (con imágenes y eliminación)');
