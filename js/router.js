<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>AXON | Laboratorios Académicos</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- CSS -->
    <link rel="stylesheet" href="css/estilo.css">
    <link rel="stylesheet" href="css/layout.css">
    <link rel="stylesheet" href="css/componentes.css">
    <link rel="stylesheet" href="css/animaciones.css">
    <link rel="stylesheet" href="css/dark-mode.css">
    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-storage-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js"></script>
    <!-- EmailJS -->
    <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
</head>
<body>
    <div class="app-container">
        <aside class="sidebar" id="sidebar">
            <div class="sidebar__header">
                <div class="sidebar__logo">AXON</div>
                <div class="sidebar__subtitle">Laboratorios Académicos</div>
            </div>
            <nav class="sidebar__nav">
                <a href="#inicio" class="nav-link active" data-page="inicio"><span class="icon">🏠</span><span>Inicio</span></a>
                <a href="#laboratorios" class="nav-link" data-page="laboratorios"><span class="icon">📚</span><span>Laboratorios</span></a>
                <a href="#categorias" class="nav-link" data-page="categorias"><span class="icon">🏷️</span><span>Categorías</span></a>
                <a href="#subir" class="nav-link" data-page="subir" id="subirNavLink" style="display: none;"><span class="icon">📤</span><span>Subir Laboratorio</span></a>
                <div class="sidebar__divider"></div>
                <a href="#registro" class="nav-link" data-page="registro" id="registroNavLink"><span class="icon">📝</span><span>Registrarse</span></a>
                <a href="#login" class="nav-link" data-page="login" id="loginNavLink"><span class="icon">🔑</span><span>Iniciar Sesión</span></a>
                <a href="#logout" class="nav-link" id="logoutNavLink" style="display: none;"><span class="icon">🚪</span><span>Cerrar Sesión</span></a>
            </nav>
        </aside>
        <div class="sidebar-overlay" id="sidebarOverlay"></div>
        <main class="main-content">
            <header class="main-header">
                <button class="menu-toggle" id="menuToggle">☰</button>
                <div class="user-info" id="userInfo">
                    <span class="user-greeting">Bienvenido, <span id="userName">Invitado</span></span>
                    <div class="user-avatar" id="userAvatar">👤</div>
                </div>
            </header>
            <div id="page-content" class="page-content">
                <div class="loader"><div class="loader-spinner"></div></div>
            </div>
        </main>
    </div>

    <!-- ============================================ -->
    <!-- SCRIPTS (CON ROUTER INCLUIDO)                -->
    <!-- ============================================ -->
    <script src="js/firebase-config.js"></script>
    <script src="js/utils.js"></script>
    <script src="js/validaciones.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/labs.js"></script>
    <script src="js/progreso.js"></script>
    <script src="js/buscador.js"></script>
    <!-- Ya no se carga router.js externo, va inline -->
    <script src="js/fcm.js"></script>
    <script src="js/app.js"></script>

    <!-- ROUTER SPA (INLINE) -->
    <script>
        (function() {
            const routes = {
                'inicio': { title: 'Inicio', protegida: false },
                'laboratorios': { title: 'Laboratorios', protegida: false },
                'detalle': { title: 'Detalle', protegida: false },
                'subir': { title: 'Subir Laboratorio', protegida: true },
                'categorias': { title: 'Categorías', protegida: false },
                'registro': { title: 'Registrarse', protegida: false },
                'login': { title: 'Iniciar Sesión', protegida: false },
                'verificacion': { title: 'Verificar Cuenta', protegida: false }
            };

            async function cargarPagina(page, params = {}) {
                const contentDiv = document.getElementById('page-content');
                if (!contentDiv) return;

                // Protección de rutas
                if (routes[page]?.protegida && (!window.firebaseAuth || !window.firebaseAuth.currentUser)) {
                    mostrarAlerta('Debes iniciar sesión', 'warning');
                    page = 'login';
                }

                contentDiv.innerHTML = '<div class="loader"><div class="loader-spinner"></div><p>Cargando...</p></div>';
                document.title = `AXON | ${routes[page]?.title || page}`;

                try {
                    const response = await fetch(`pages/${page}.html`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    let html = await response.text();
                    // Extraer scripts para ejecutarlos después (evitar duplicados)
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    const scripts = [];
                    tempDiv.querySelectorAll('script').forEach(script => {
                        if (script.textContent.trim()) scripts.push(script.textContent);
                        script.remove();
                    });
                    contentDiv.innerHTML = tempDiv.innerHTML;
                    // Ejecutar scripts inline de la página
                    scripts.forEach(scriptContent => {
                        const newScript = document.createElement('script');
                        newScript.textContent = scriptContent;
                        document.body.appendChild(newScript);
                    });
                    // Marcar enlace activo
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('data-page') === page) link.classList.add('active');
                    });
                    // Disparar evento
                    document.dispatchEvent(new CustomEvent('pageLoaded', { detail: { page, params } }));
                    console.log(`✅ Página cargada: ${page}`);
                } catch (error) {
                    contentDiv.innerHTML = `<div class="container"><h2>Error</h2><p>${error.message}</p><button onclick="location.reload()">Recargar</button></div>`;
                }
            }

            function mostrarAlerta(msg, tipo) {
                const div = document.createElement('div');
                div.textContent = msg;
                div.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#333; color:white; padding:10px; border-radius:8px; z-index:10000;';
                document.body.appendChild(div);
                setTimeout(() => div.remove(), 3000);
            }

            function handleRoute() {
                let hash = window.location.hash.slice(1) || 'inicio';
                let [page, queryString] = hash.split('?');
                const params = {};
                if (queryString) {
                    queryString.split('&').forEach(p => {
                        let [k, v] = p.split('=');
                        if (k && v) params[k] = decodeURIComponent(v);
                    });
                }
                if (!routes[page]) page = 'inicio';
                cargarPagina(page, params);
            }

            window.addEventListener('hashchange', handleRoute);
            window.cambiarPagina = (page, params) => {
                let url = page;
                if (params) url += '?' + new URLSearchParams(params).toString();
                window.location.hash = url;
            };
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', handleRoute);
            else handleRoute();
        })();
    </script>
</body>
</html>
