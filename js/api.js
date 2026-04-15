/**
 * AXON - API.JS
 * Conexión con backend (simulado para desarrollo)
 * En producción, reemplazar con llamadas reales a un servidor
 */

// Configuración de la API
const API_CONFIG = {
    baseURL: 'http://localhost:5000/api',
    useMock: true,  // Cambiar a false cuando haya backend real
    timeout: 10000
};

/**
 * Realiza una petición a la API
 * @param {string} endpoint
 * @param {object} options
 * @returns {Promise}
 */
async function apiRequest(endpoint, options = {}) {
    if (API_CONFIG.useMock) {
        return mockRequest(endpoint, options);
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        
        const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Simula respuestas de la API (desarrollo)
 */
async function mockRequest(endpoint, options) {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simular latencia
    
    // Laboratorios
    if (endpoint === '/labs' && (!options.method || options.method === 'GET')) {
        const labs = localStorage.getItem('axon_laboratorios');
        return { success: true, data: labs ? JSON.parse(labs) : [] };
    }
    
    if (endpoint.match(/\/labs\/\d+/) && (!options.method || options.method === 'GET')) {
        const id = parseInt(endpoint.split('/').pop());
        const labs = JSON.parse(localStorage.getItem('axon_laboratorios') || '[]');
        const lab = labs.find(l => l.id === id);
        return { success: true, data: lab || null };
    }
    
    if (endpoint === '/labs' && options.method === 'POST') {
        const newLab = JSON.parse(options.body);
        const labs = JSON.parse(localStorage.getItem('axon_laboratorios') || '[]');
        newLab.id = Date.now();
        labs.unshift(newLab);
        localStorage.setItem('axon_laboratorios', JSON.stringify(labs));
        return { success: true, data: newLab };
    }
    
    if (endpoint.match(/\/labs\/\d+/) && options.method === 'DELETE') {
        const id = parseInt(endpoint.split('/').pop());
        const labs = JSON.parse(localStorage.getItem('axon_laboratorios') || '[]');
        const nuevos = labs.filter(l => l.id !== id);
        localStorage.setItem('axon_laboratorios', JSON.stringify(nuevos));
        return { success: true };
    }
    
    // Autenticación
    if (endpoint === '/auth/register' && options.method === 'POST') {
        const data = JSON.parse(options.body);
        const usuarios = JSON.parse(localStorage.getItem('axon_usuarios') || '[]');
        
        if (usuarios.find(u => u.email === data.email)) {
            return { success: false, message: 'Usuario ya existe' };
        }
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const nuevoUsuario = {
            id: Date.now(),
            ...data,
            verificado: false,
            otp: otp,
            fechaRegistro: new Date().toISOString()
        };
        
        usuarios.push(nuevoUsuario);
        localStorage.setItem('axon_usuarios', JSON.stringify(usuarios));
        
        return { success: true, message: 'Usuario registrado', otp: otp };
    }
    
    if (endpoint === '/auth/login' && options.method === 'POST') {
        const { email, password } = JSON.parse(options.body);
        const usuarios = JSON.parse(localStorage.getItem('axon_usuarios') || '[]');
        const usuario = usuarios.find(u => u.email === email && u.password === password);
        
        if (!usuario) {
            return { success: false, message: 'Credenciales incorrectas' };
        }
        
        if (!usuario.verificado) {
            return { success: false, message: 'Cuenta no verificada' };
        }
        
        return { success: true, data: { email: usuario.email, nombre: usuario.nombre } };
    }
    
    if (endpoint === '/auth/verify' && options.method === 'POST') {
        const { email, otp } = JSON.parse(options.body);
        const usuarios = JSON.parse(localStorage.getItem('axon_usuarios') || '[]');
        const usuario = usuarios.find(u => u.email === email);
        
        if (usuario && usuario.otp === otp) {
            usuario.verificado = true;
            delete usuario.otp;
            localStorage.setItem('axon_usuarios', JSON.stringify(usuarios));
            return { success: true };
        }
        
        return { success: false, message: 'OTP incorrecto' };
    }
    
    // Progreso
    if (endpoint === '/progreso' && options.method === 'POST') {
        const { labId, modulos, email } = JSON.parse(options.body);
        const key = `axon_progreso_${email}_${labId}`;
        localStorage.setItem(key, JSON.stringify({
            modulos: modulos,
            porcentaje: (modulos.length / 5) * 100,
            ultimaActualizacion: new Date().toISOString()
        }));
        return { success: true };
    }
    
    if (endpoint.match(/\/progreso\/[^/]+\/\d+/) && options.method === 'GET') {
        const parts = endpoint.split('/');
        const email = parts[2];
        const labId = parseInt(parts[3]);
        const key = `axon_progreso_${email}_${labId}`;
        const progreso = localStorage.getItem(key);
        return { success: true, data: progreso ? JSON.parse(progreso) : null };
    }
    
    return { success: false, message: 'Endpoint no implementado' };
}

// API endpoints específicos
const api = {
    // Laboratorios
    getLabs: () => apiRequest('/labs'),
    getLab: (id) => apiRequest(`/labs/${id}`),
    createLab: (data) => apiRequest('/labs', { method: 'POST', body: JSON.stringify(data) }),
    deleteLab: (id) => apiRequest(`/labs/${id}`, { method: 'DELETE' }),
    
    // Autenticación
    register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    verify: (data) => apiRequest('/auth/verify', { method: 'POST', body: JSON.stringify(data) }),
    
    // Progreso
    saveProgress: (data) => apiRequest('/progreso', { method: 'POST', body: JSON.stringify(data) }),
    getProgress: (email, labId) => apiRequest(`/progreso/${email}/${labId}`)
};

// Exportar
window.api = api;
window.apiRequest = apiRequest;