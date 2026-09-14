# Changelog

Registro de todos los cambios hechos sobre el Casino DEMO, del más reciente al más antiguo.

## 2026-09-14

### Juego nuevo
- **Vuelo**: juego tipo "avión que sube y baja" (mismo motor que Crash, sesión y configuración propias). Cielo con degradado de atardecer, nubes flotando, y el avión se bambolea mientras asciende sobre una estela dorada punteada. Diseño e íconos 100% originales, sin copiar nombre, logo ni personaje de ningún juego de terceros.

### Rediseño visual de juegos (sin tocar lógica ni llamadas a la API)
- **GameTopBar**: nuevo encabezado en cada juego con "‹ Ver todo", ícono + nombre centrado en mayúsculas, y "Guía" + botón de sonido a la derecha.
- **BetControls**: panel de apuesta simplificado a una sola fila (monto con ícono de moneda, límites con candado, botones ½ y 2X).
- **GameShell**: monedas decorativas muy tenues en las esquinas, marca de agua "CASINO DE EMME" al pie, y mensaje idle ("Los resultados del juego aparecerán aquí") antes de la primera ronda.
- **CoinFlip**: cajas de "Serie" (racha de victorias) y "Coeficiente" a los lados de la moneda.
- **Dice**: fila de 3 cajas (Multiplicador, objetivo, Probabilidad) bajo la barra deslizante.
- **Mines**: contadores de Gemas/Minas sobre la grilla, celdas con más padding y esquinas más redondeadas.
- **Crash**: fila de chips con los últimos multiplicadores jugados, fondo degradado espacial morado/rosa.
- **Plinko**: fondo morado oscuro, bola rosa/magenta brillante, casilleros en tonos rosa/violeta/índigo.
- **Limbo**: diana con anillos concéntricos y dardo animado en CSS puro (sin emoji ni imágenes) que se clava cerca del centro al ganar o en un anillo exterior (siempre dentro del tablero) al perder, con rebote tipo "overshoot" al aterrizar.
- **Slots**: gabinete tipo máquina real con marco metálico dorado, símbolos con estilo de carta (esquinas con pip), y barra de control inferior con balance, apuesta y botón de girar circular.
- **Towers**: solo recibió el idle + las marcas de agua del GameShell (la grilla ya funcionaba bien).

## 2026-09-13

### Visual
- **Selector de color de acento (neón)**: nueva sección en Profile con 7 paletas (Dorado por defecto, Verde neón, Azul eléctrico, Cian, Rosa, Rojo, Púrpura). Cambia toda la app al instante, se guarda en el dispositivo.
- **Hero section en el Dashboard**: banner grande con foto de fondo, badge "Créditos 100% virtuales", título, saludo personalizado, balance y accesos rápidos a promo codes y juegos.
- **Color de acento "neon"** agregado a Tailwind (`neon-300/400/500/600` + sombra `glow-neon`) como detalle secundario, sin reemplazar el dorado principal.
- **Encabezado de cada juego** con un detalle sutil en verde neón (ícono del juego con resplandor).
- **Música de fondo**: 3 pistas instrumentales sin copyright (Kevin MacLeod / incompetech.com, licencia CC BY) seleccionables desde Profile, con control de volumen.
- **Más "dopamina"**: contador de créditos animado (cuenta en vez de saltar), pulso dorado/verde al ganar, confetti en toda victoria, sonido especial de jackpot en wins grandes.
- Se quitaron las credenciales demo autocompletadas en la pantalla de login (ahora solo aparecen como ejemplo/placeholder).

### Juegos nuevos
- **Horse Race**: 5 caballos de colores y multiplicadores distintos, animación de carrera.
- **Sonido con botón de silenciar**: efectos sintetizados (sin archivos externos) para victorias, derrotas y clicks, con botón global en la barra superior.
- **Leaderboard**: tabla de clasificación con los mayores multiplicadores ganados en todo el casino, conectada a la tarjeta "Grandes premios" de Bonuses.
- **Chat en vivo con modo incógnito**: sala general en tiempo real (WebSockets). Modo incógnito oculta el nombre real tras un alias aleatorio (ej. "Misterioso #3607").

### Jugabilidad
- **Ruleta**: ahora se pueden poner fichas en varias casillas a la vez (números, colores, docenas, columnas) y resolverlas todas en un mismo giro, con resumen desglosado por apuesta.
- **Plinko**: opción de soltar 1, 10, 25 o 50 bolas de una vez, con resumen agregado (apostado / pagado / neto).
- **Crash**: el avión ahora cae solo automáticamente al llegar al punto de choque (antes solo se descubría al intentar retirar manualmente).
- **Panel de admin**: se puede editar el nombre de usuario, promover/degradar el rol de admin, y cambiar la contraseña de cualquier cuenta.

### Correcciones
- **Ruleta**: el ángulo de giro se acumulaba entre tiradas y la rueda terminaba señalando un número vecino al real (ej. mostraba 7 cuando el resultado real era 28). Corregido normalizando la rotación en cada tirada.
- **Chat en vivo**: los mensajes cargados del historial no mostraban el nombre del remitente (bug de nomenclatura `display_name` vs `displayName`).

### Infraestructura
- **Persistencia real de datos**: migración de SQLite local (se borraba en cada reinicio/redeploy de Render) a **Turso** (libSQL remoto, capa gratuita). Usuarios, créditos, historial y promo codes ya no se pierden nunca.
- Ajustes de build/deploy en Render (Node 20 LTS por los binarios de `better-sqlite3`, luego innecesario tras migrar a Turso; instalación de devDependencies para que compile Vite).

## 2026-09-12

- **Lanzamiento inicial**: puesta en marcha local del proyecto (Node 20, seed de base de datos, servidor + cliente), publicación del repositorio en GitHub y primer deploy a Render.
