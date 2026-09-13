# Casino de Emme

Simulador de casino **100% de demostración**. No procesa dinero real, no
tiene depósitos, retiros, tarjetas ni criptomonedas. Todos los saldos son
**créditos virtuales** sin ningún valor monetario, pensados únicamente para
pruebas de producto, QA y demostraciones.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + lucide-react + react-router-dom
- **Backend:** Node.js + Express
- **Base de datos:** SQLite (better-sqlite3), archivo local en `server/data/casino.db`
- **Auth:** JWT (jsonwebtoken) + bcrypt

## Estructura

```
casino-demo/
├── server/               # API Express + SQLite
│   ├── src/
│   │   ├── db/           # esquema + seed
│   │   ├── games/        # motores de los 15 juegos (RNG, cartas, sesiones)
│   │   ├── middleware/   # auth JWT
│   │   └── routes/       # auth, users, games, promo, admin
│   └── data/casino.db    # se crea automáticamente
├── client/               # SPA React
│   └── src/
│       ├── pages/        # Dashboard, Profile, Games, Bonuses, Promo, History...
│       ├── pages/admin/  # Panel de administrador
│       ├── games/        # UI de los 15 juegos
│       ├── components/   # Sidebar, Topbar, Modal, Toasts, etc.
│       └── context/      # Auth + Toasts
└── package.json          # workspace raíz
```

## Puesta en marcha

Requisitos: Node.js 18+ y npm.

```bash
npm install
npm run seed      # crea la base de datos y los datos de demostración
npm run dev       # levanta API (puerto 4000) + cliente (puerto 5173)
```

Abre [http://localhost:5173](http://localhost:5173).

`npm run seed` solo hace falta la primera vez (o si borras `server/data/casino.db`).
El servidor también corre `CREATE TABLE IF NOT EXISTS` al arrancar, así que
`npm run dev` funciona igualmente sin seed previo, pero sin usuarios/códigos
de ejemplo.

## Cuentas de demostración

| Usuario | Contraseña | Rol |
|---|---|---|
| `demo` | `Demo123!` | Jugador (5000 créditos) |
| `admin` | `Admin123!` | Administrador |

Puedes registrar cuentas nuevas libremente desde `/register`: el registro
acepta cualquier dato (no hay verificación real de identidad ni de email) y
otorga automáticamente el bono de bienvenida configurado.

## Crear tu propio primer administrador

El usuario `admin` ya viene creado por el seed. Si prefieres crear uno nuevo:

1. Regístrate normalmente desde `/register` con tus propios datos.
2. Con acceso a la base de datos (`server/data/casino.db`), promuévelo a admin:

   ```bash
   sqlite3 server/data/casino.db "UPDATE users SET role='admin' WHERE username='TU_USUARIO';"
   ```
3. Cierra sesión y vuelve a entrar. Verás la opción **"Ir al panel admin"**
   en la barra lateral y podrás entrar a `/admin`.

## Códigos promocionales de ejemplo

Creados automáticamente por el seed, canjeables desde `/promo-codes`:

- `WELCOME100` → +100 créditos
- `DEMO500` → +500 créditos
- `LUCKY1000` → +1000 créditos

## Los 15 juegos

Slots, Roulette, Blackjack, Baccarat, Dice, Mines, Plinko, Crash, Wheel,
Coin Flip, Keno, Hi-Lo, Limbo, Towers y Video Poker. Todos usan únicamente
créditos virtuales, tienen su propia interfaz con animaciones e historial de
últimas jugadas, y su resultado se calcula en el servidor (nunca en el
cliente) a partir de la configuración vigente en `Game Configuration` en el
momento de la apuesta. El resultado nunca se modifica después de que el
usuario haya apostado.

Los juegos de una sola tirada (Slots, Roulette, Dice, Coin Flip, Wheel,
Keno, Limbo, Plinko, Baccarat) resuelven la jugada en una sola petición.
Los juegos por pasos (Blackjack, Mines, Towers, Hi-Lo, Crash, Video Poker)
usan una sesión de servidor en memoria (se cierra sola tras 30 min de
inactividad) para permitir decisiones sucesivas (pedir carta, revelar
casilla, retirar créditos, etc.).

## Panel de administrador (`/admin`)

Protegido por rol (`role = 'admin'`) además del login JWT normal.

- **Dashboard:** estadísticas globales, rendimiento por juego, actividad reciente.
- **Users:** buscar, crear usuarios de prueba, ver historial, restablecer cuentas, bloquear/desbloquear.
- **Credits:** añadir/quitar créditos virtuales rápidamente.
- **Games:** activar/desactivar juegos.
- **Game Configuration:** editar RTP de prueba, apuesta mín/máx y parámetros
  matemáticos (probabilidades, multiplicadores, pesos de símbolos, house edge,
  frecuencia de premios, etc.) de cada juego — claramente marcado como *solo
  para testing*.
- **Promo Codes:** crear, activar/desactivar, editar créditos/usos/expiración, eliminar.
- **Transactions:** todos los movimientos de créditos de todos los usuarios.
- **Activity Log:** registro inmutable de cada acción administrativa (quién, qué, cuándo).
- **Settings:** créditos iniciales de bienvenida para cuentas nuevas.

Cualquier cambio administrativo (ajustar créditos, bloquear usuario, cambiar
configuración de un juego, crear/editar código promo, etc.) queda registrado
en el **Admin Activity Log**.

## Notas de seguridad de la demo

- Las contraseñas se guardan con `bcrypt`.
- Las sesiones de usuario usan JWT firmado (`JWT_SECRET` en `server/.env`, ver `.env.example`).
- La recuperación de contraseña es **simulada**: no envía correos reales,
  genera un código de reseteo de demo en la propia respuesta de la API.
- No hay integración con pasarelas de pago, bancos ni criptomonedas de
  ningún tipo, ni en el frontend ni en el backend.

## Variables de entorno (`server/.env`)

```
PORT=4000
JWT_SECRET=cambia-esto-en-tu-propia-copia
STARTING_CREDITS=5000
```
