/**
 * AXON - DATOS.JS
 * Datos simulados para desarrollo y fallback
 */

const DATOS_AXON = {
    laboratorios: [
        { 
            id: 1, 
            nombre: "Introducción a Redes TCP/IP", 
            autor: "Dr. Carlos Martínez", 
            categoria: "redes", 
            descripcion: "Laboratorio básico sobre fundamentos de redes, direccionamiento IP y protocolos TCP/UDP. Incluye ejercicios prácticos y ejemplos reales.", 
            archivo: "lab-redes-tcpip.pdf", 
            fecha: "2024-01-15", 
            descargas: 245, 
            vistas: 1250, 
            icono: "🌐",
            modulos: ["Conceptos básicos de redes", "Modelo OSI vs TCP/IP", "Direccionamiento IPv4", "Protocolos TCP y UDP", "Subneteo y VLSM"]
        },
        { 
            id: 2, 
            nombre: "Programación en Python para Data Science", 
            autor: "Ing. Ana Rodríguez", 
            categoria: "programacion", 
            descripcion: "Laboratorio práctico de Python con pandas, numpy y matplotlib para análisis de datos. Ideal para comenzar en ciencia de datos.", 
            archivo: "lab-python-datascience.zip", 
            fecha: "2024-01-20", 
            descargas: 189, 
            vistas: 890, 
            icono: "🐍",
            modulos: ["Introducción a Python", "Manipulación de datos con pandas", "Visualización con matplotlib", "Análisis estadístico", "Proyecto final"]
        },
        { 
            id: 3, 
            nombre: "Diseño de Bases de Datos Relacionales", 
            autor: "Dra. María Fernández", 
            categoria: "bases-datos", 
            descripcion: "Laboratorio de modelado de datos, SQL y normalización. Aprende a diseñar bases de datos eficientes desde cero.", 
            archivo: "lab-bases-datos.pdf", 
            fecha: "2024-01-10", 
            descargas: 312, 
            vistas: 1560, 
            icono: "🗄️",
            modulos: ["Modelo Entidad-Relación", "Normalización 1NF, 2NF, 3NF", "Consultas SQL básicas", "Consultas SQL avanzadas", "Optimización de consultas"]
        },
        { 
            id: 4, 
            nombre: "Introducción a Machine Learning", 
            autor: "Dr. Roberto Sánchez", 
            categoria: "inteligencia", 
            descripcion: "Laboratorio introductorio a algoritmos de ML supervisado y no supervisado. Ejemplos prácticos con scikit-learn.", 
            archivo: "lab-ml-basico.zip", 
            fecha: "2024-01-25", 
            descargas: 178, 
            vistas: 1020, 
            icono: "🤖",
            modulos: ["Preprocesamiento de datos", "Regresión lineal", "Clasificación con árboles", "Clustering con K-means", "Evaluación de modelos"]
        },
        { 
            id: 5, 
            nombre: "Seguridad en Aplicaciones Web", 
            autor: "Ing. Laura Torres", 
            categoria: "seguridad", 
            descripcion: "Laboratorio de vulnerabilidades web comunes y cómo prevenirlas. Incluye OWASP Top 10 y ejercicios prácticos.", 
            archivo: "lab-seguridad-web.pdf", 
            fecha: "2024-01-18", 
            descargas: 267, 
            vistas: 1340, 
            icono: "🔒",
            modulos: ["OWASP Top 10", "Inyección SQL", "Cross-Site Scripting (XSS)", "CSRF y SSRF", "Buenas prácticas de seguridad"]
        },
        { 
            id: 6, 
            nombre: "Enrutamiento y Switching Avanzado", 
            autor: "Ing. Pablo Gómez", 
            categoria: "redes", 
            descripcion: "Laboratorio de configuración de routers y switches en entornos empresariales. Protocolos de enrutamiento y VLANs.", 
            archivo: "lab-enrutamiento.pdf", 
            fecha: "2024-02-01", 
            descargas: 156, 
            vistas: 980, 
            icono: "🔄",
            modulos: ["Configuración básica de routers", "Protocolos de enrutamiento", "VLANs y trunking", "STP y EtherChannel", "Seguridad en switches"]
        },
        { 
            id: 7, 
            nombre: "Desarrollo Web con React", 
            autor: "Ing. Sofía Ramírez", 
            categoria: "programacion", 
            descripcion: "Laboratorio para construir aplicaciones modernas con React.js. Hooks, componentes y estado global.", 
            archivo: "lab-react.zip", 
            fecha: "2024-02-05", 
            descargas: 134, 
            vistas: 750, 
            icono: "⚛️",
            modulos: ["Componentes y props", "State y eventos", "Hooks básicos", "Consumo de APIs", "Despliegue de aplicaciones"]
        },
        { 
            id: 8, 
            nombre: "Big Data con Hadoop", 
            autor: "Dr. Andrés López", 
            categoria: "bases-datos", 
            descripcion: "Laboratorio de procesamiento distribuido con Hadoop y MapReduce. Procesamiento de grandes volúmenes de datos.", 
            archivo: "lab-hadoop.pdf", 
            fecha: "2024-02-10", 
            descargas: 98, 
            vistas: 620, 
            icono: "🐘",
            modulos: ["Arquitectura Hadoop", "HDFS", "MapReduce básico", "Optimización de jobs", "Ecosistema Hadoop"]
        },
        { 
            id: 9, 
            nombre: "Redes Neuronales con TensorFlow", 
            autor: "Dra. Carmen Díaz", 
            categoria: "inteligencia", 
            descripcion: "Laboratorio práctico de deep learning con TensorFlow y Keras. Redes convolucionales y recurrentes.", 
            archivo: "lab-tensorflow.zip", 
            fecha: "2024-02-12", 
            descargas: 145, 
            vistas: 890, 
            icono: "🧠",
            modulos: ["Introducción a TensorFlow", "Redes neuronales densas", "CNN para imágenes", "RNN para secuencias", "Transfer Learning"]
        },
        { 
            id: 10, 
            nombre: "Criptografía y Seguridad", 
            autor: "Dr. Javier Mendoza", 
            categoria: "seguridad", 
            descripcion: "Laboratorio de algoritmos criptográficos y seguridad de la información. Cifrado simétrico y asimétrico.", 
            archivo: "lab-criptografia.pdf", 
            fecha: "2024-02-15", 
            descargas: 210, 
            vistas: 1100, 
            icono: "🔐",
            modulos: ["Criptografía simétrica", "Criptografía asimétrica", "Funciones hash", "Certificados digitales", "Criptografía en la práctica"]
        },
        { 
            id: 11, 
            nombre: "DevOps y CI/CD", 
            autor: "Ing. Miguel Ángel Ruiz", 
            categoria: "programacion", 
            descripcion: "Laboratorio de integración continua y despliegue continuo con Jenkins, Docker y GitHub Actions.", 
            archivo: "lab-devops.pdf", 
            fecha: "2024-02-20", 
            descargas: 87, 
            vistas: 540, 
            icono: "🚀",
            modulos: ["Fundamentos de DevOps", "Integración continua", "Contenedores con Docker", "Orquestación con Kubernetes", "Monitoreo y logging"]
        },
        { 
            id: 12, 
            nombre: "Internet de las Cosas (IoT)", 
            autor: "Dr. Fernando Ortiz", 
            categoria: "redes", 
            descripcion: "Laboratorio de sensores y dispositivos IoT con Arduino, ESP8266 y protocolo MQTT.", 
            archivo: "lab-iot.zip", 
            fecha: "2024-02-22", 
            descargas: 123, 
            vistas: 780, 
            icono: "📡",
            modulos: ["Introducción a IoT", "Sensores y actuadores", "Comunicación MQTT", "Plataformas IoT", "Proyecto integrador"]
        }
    ],
    
    categorias: [
        { id: "redes", nombre: "Redes", icono: "🌐", color: "#00d4ff" },
        { id: "programacion", nombre: "Programación", icono: "💻", color: "#00ff88" },
        { id: "bases-datos", nombre: "Bases de Datos", icono: "🗄️", color: "#ffaa00" },
        { id: "inteligencia", nombre: "Inteligencia Artificial", icono: "🧠", color: "#b300ff" },
        { id: "seguridad", nombre: "Seguridad", icono: "🔒", color: "#ff3366" }
    ],
    
    usuarios: [
        { id: 1, email: "demo@axon.com", nombre: "Usuario Demo", rol: "usuario", verificado: true }
    ]
};

// Exponer datos globalmente
window.datosAxon = DATOS_AXON;

// Inicializar localStorage si está vacío
function inicializarDatos() {
    if (!localStorage.getItem('axon_laboratorios')) {
        localStorage.setItem('axon_laboratorios', JSON.stringify(DATOS_AXON.laboratorios));
    }
    
    if (!localStorage.getItem('axon_categorias')) {
        localStorage.setItem('axon_categorias', JSON.stringify(DATOS_AXON.categorias));
    }
    
    if (!localStorage.getItem('axon_usuarios')) {
        localStorage.setItem('axon_usuarios', JSON.stringify(DATOS_AXON.usuarios));
    }
}

// Inicializar al cargar
inicializarDatos();