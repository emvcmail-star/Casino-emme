import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, recordTransaction } from '../db/index.js';
import { signToken, requireAuth, sanitizeUser } from '../middleware/auth.js';

const router = Router();
const STARTING_CREDITS = Number(process.env.STARTING_CREDITS || 5000);
const AVATARS = ['crown', 'spade', 'club', 'diamond', 'heart', 'gem', 'flame', 'rocket', 'trophy', 'ghost'];

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Usuario, email y contraseña son obligatorios (datos ficticios, sin verificación real)' });
  }
  if (String(password).length < 4) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
  }
  const existing = await db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) return res.status(409).json({ error: 'Ese usuario o email ya existe' });

  const hash = bcrypt.hashSync(String(password), 10);
  const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const info = await db
    .prepare('INSERT INTO users (username, email, password_hash, role, avatar, credits) VALUES (?, ?, ?, ?, ?, ?)')
    .run(username, email, hash, 'player', avatar, STARTING_CREDITS);

  await recordTransaction(info.lastInsertRowid, 'signup_bonus', STARTING_CREDITS, STARTING_CREDITS, 'Bono de bienvenida (créditos virtuales)');

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken(user);
  res.status(201).json({ token, user: sanitizeUser(user), welcomeBonus: STARTING_CREDITS });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  const user = await db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  if (user.status === 'blocked') return res.status(403).json({ error: 'Cuenta bloqueada' });
  const token = signToken(user);
  res.json({ token, user: sanitizeUser(user) });
});

router.post('/logout', (_req, res) => {
  // Stateless JWT demo: logout se maneja en el cliente descartando el token.
  res.json({ ok: true });
});

// Recuperación de contraseña SIMULADA: no envía correos reales, solo genera un token de demo
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email || '');
  // Siempre responde OK para no filtrar qué emails existen (comportamiento realista de demo)
  res.json({
    ok: true,
    message: 'Si el email existe, se ha generado un enlace de recuperación simulado.',
    simulatedResetCode: user ? `DEMO-RESET-${user.id}-${Date.now().toString(36).toUpperCase()}` : null,
  });
});

router.post('/reset-password', async (req, res) => {
  const { email, simulatedResetCode, newPassword } = req.body || {};
  const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email || '');
  if (!user || !simulatedResetCode || !String(simulatedResetCode).startsWith(`DEMO-RESET-${user.id}-`)) {
    return res.status(400).json({ error: 'Código de recuperación simulado inválido' });
  }
  if (!newPassword || String(newPassword).length < 4) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres' });
  }
  const hash = bcrypt.hashSync(String(newPassword), 10);
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  res.json({ ok: true, message: 'Contraseña actualizada' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

export default router;
