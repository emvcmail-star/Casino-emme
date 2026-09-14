# Changelog

Registro de todos los cambios hechos sobre el Casino DEMO, del más reciente al más antiguo.

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
