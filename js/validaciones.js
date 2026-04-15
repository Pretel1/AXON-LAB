/**
 * AXON - VALIDACIONES.JS
 * Validación de formularios y campos
 */

// Reglas de validación predefinidas
const REGLAS_VALIDACION = {
    required: (valor) => valor !== null && valor !== undefined && valor.toString().trim() !== '',
    email: (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor),
    password: (valor) => valor && valor.length >= 6,
    minLength: (valor, min) => valor && valor.length >= min,
    maxLength: (valor, max) => !valor || valor.length <= max,
    numeric: (valor) => /^\d+$/.test(valor),
    alphanumeric: (valor) => /^[a-zA-Z0-9\s]+$/.test(valor),
    url: (valor) => /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(valor),
    select: (valor) => valor !== null && valor !== '' && valor !== '0'
};

/**
 * Valida un formulario completo
 * @param {string} formId - ID del formulario
 * @returns {object}
 */
function validarFormulario(formId) {
    const form = document.getElementById(formId);
    if (!form) return { valid: false, errors: ['Formulario no encontrado'] };
    
    const inputs = form.querySelectorAll('[data-validate]');
    const errors = [];
    let isValid = true;
    
    inputs.forEach(input => {
        const reglas = input.getAttribute('data-validate').split(' ');
        const valor = input.value;
        let campoValido = true;
        
        for (const regla of reglas) {
            const [nombre, parametro] = regla.split(':');
            
            if (REGLAS_VALIDACION[nombre]) {
                const valido = parametro ? 
                    REGLAS_VALIDACION[nombre](valor, parseInt(parametro)) : 
                    REGLAS_VALIDACION[nombre](valor);
                
                if (!valido) {
                    campoValido = false;
                    mostrarError(input, obtenerMensajeError(nombre, input, parametro));
                    errors.push({
                        campo: input.name || input.id,
                        mensaje: obtenerMensajeError(nombre, input, parametro)
                    });
                    break;
                }
            }
        }
        
        if (campoValido) {
            limpiarError(input);
        } else {
            isValid = false;
        }
    });
    
    return { valid: isValid, errors };
}

/**
 * Valida un campo individualmente
 * @param {HTMLElement} input
 * @returns {boolean}
 */
function validarCampo(input) {
    const reglas = input.getAttribute('data-validate');
    if (!reglas) return true;
    
    const listaReglas = reglas.split(' ');
    const valor = input.value;
    
    for (const regla of listaReglas) {
        const [nombre, parametro] = regla.split(':');
        
        if (REGLAS_VALIDACION[nombre]) {
            const valido = parametro ? 
                REGLAS_VALIDACION[nombre](valor, parseInt(parametro)) : 
                REGLAS_VALIDACION[nombre](valor);
            
            if (!valido) {
                mostrarError(input, obtenerMensajeError(nombre, input, parametro));
                return false;
            }
        }
    }
    
    limpiarError(input);
    return true;
}

/**
 * Muestra un mensaje de error en el campo
 * @param {HTMLElement} input
 * @param {string} mensaje
 */
function mostrarError(input, mensaje) {
    limpiarError(input);
    input.classList.add('error');
    
    const errorSpan = document.createElement('span');
    errorSpan.className = 'form-error';
    errorSpan.textContent = mensaje;
    
    input.parentNode.appendChild(errorSpan);
}

/**
 * Limpia el error de un campo
 * @param {HTMLElement} input
 */
function limpiarError(input) {
    input.classList.remove('error');
    const errorSpan = input.parentNode.querySelector('.form-error');
    if (errorSpan) errorSpan.remove();
}

/**
 * Obtiene el mensaje de error según la regla
 * @param {string} regla
 * @param {HTMLElement} input
 * @param {string} parametro
 * @returns {string}
 */
function obtenerMensajeError(regla, input, parametro) {
    const label = input.previousElementSibling?.textContent || input.placeholder || 'Este campo';
    const mensajes = {
        required: `${label} es obligatorio`,
        email: `Ingresa un correo electrónico válido`,
        password: `La contraseña debe tener al menos 6 caracteres`,
        minLength: `${label} debe tener al menos ${parametro} caracteres`,
        maxLength: `${label} no puede exceder ${parametro} caracteres`,
        numeric: `${label} debe ser numérico`,
        alphanumeric: `${label} solo puede contener letras y números`,
        url: `Ingresa una URL válida`,
        select: `Selecciona una opción válida`
    };
    return mensajes[regla] || `${label} no es válido`;
}

/**
 * Configura validación en tiempo real para un formulario
 * @param {string} formId
 */
function configurarValidacionTiempoReal(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const inputs = form.querySelectorAll('[data-validate]');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validarCampo(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                validarCampo(input);
            }
        });
    });
}

/**
 * Valida que dos contraseñas coincidan
 * @param {string} passwordId
 * @param {string} confirmId
 * @returns {boolean}
 */
function validarConfirmacionPassword(passwordId, confirmId) {
    const password = document.getElementById(passwordId);
    const confirm = document.getElementById(confirmId);
    
    if (!password || !confirm) return false;
    
    const coinciden = password.value === confirm.value;
    
    if (!coinciden) {
        mostrarError(confirm, 'Las contraseñas no coinciden');
    } else {
        limpiarError(confirm);
    }
    
    return coinciden;
}

// Exportar funciones globales
window.validarFormulario = validarFormulario;
window.validarCampo = validarCampo;
window.configurarValidacionTiempoReal = configurarValidacionTiempoReal;
window.validarConfirmacionPassword = validarConfirmacionPassword;