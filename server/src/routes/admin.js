import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, logAdminActivity, recordTransaction } from '../db/index.js';
import { requireAuth, requireAdmin, sanitizeUser } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ---------- DASHBOARD / STATS ----------
router.get('/stats', (_req, res) => {
  const totals = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'player') as totalPlayers,
        (SELECT COUNT(*) FROM users WHERE role = 'player' AND status = 'blocked') as blockedPlayers,
        (SELECT COUNT(*) FROM game_history) as totalGamesPlayed,
        (SELECT COALESCE(SUM(bet_amount),0) FROM game_history) as totalWagered,
        (SELECT COALESCE(SUM(payout),0) FROM game_history) as totalPaidOut,
        (SELECT COALESCE(SUM(credits),0) FROM users WHERE role='player') as creditsInCirculation
      `
    )
    .get();

  const byGame = db
    .prepare(
      `SELECT game_key, COUNT(*) as plays, COALESCE(SUM(bet_amount),0) as wagered, COALESCE(SUM(payout),0) as paidOut
       FROM game_history GROUP BY game_key ORDER BY plays DESC`
    )
    .all();

  const recentActivity = db
    .prepare(`SELECT * FROM admin_activity_log ORDER BY created_at DESC LIMIT 10`)
    .all()
    .map((r) => ({ ...r, details: r.details ? JSON.parse(r.details) : null }));

  res.json({ totals, byGame, recentActivity });
});

// ---------- USERS ----------
router.get('/users', (req, res) => {
  const q = (req.query.q || '').toString().trim();
  let rows;
  if (q) {
    rows = db
      .prepare(`SELECT * FROM users WHERE username LIKE ? OR email LIKE ? ORDER BY created_at DESC`)
      .all(`%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  }
  res.json({ users: rows.map(sanitizeUser) });
});

router.post('/users', (req, res) => {
  const { username, email, password, credits = 5000, role = 'player' } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: 'Faltan campos obligatorios' });
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) return res.status(409).json({ error: 'Usuario o email ya existe' });
  const hash = bcrypt.hashSync(String(password), 10);
  const info = db
    .prepare('INSERT INTO users (username, email, password_hash, role, credits, avatar) VALUES (?, ?, ?, ?, ?, ?)')
    .run(username, email, hash, role, credits, '🎮');
  recordTransaction(info.lastInsertRowid, 'admin_credit', credits, credits, 'Cuenta de prueba creada por admin');
  logAdminActivity(req.user.id, req.user.username, 'create_user', username, { credits, role });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ user: sanitizeUser(user) });
});

router.patch('/users/:id/credits', (req, res) => {
  const { amount, mode = 'add' } = req.body || {}; // mode: 'add' | 'remove' | 'set'
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < 0) return res.status(400).json({ error: 'Cantidad inválida' });

  let newBalance;
  let txType;
  let txAmount;
  if (mode === 'set') {
    newBalance = amt;
    txType = 'admin_credit';
    txAmount = amt - user.credits;
  } else if (mode === 'remove') {
    newBalance = Math.max(0, user.credits - amt);
    txType = 'admin_debit';
    txAmount = -(user.credits - newBalance);
  } else {
    newBalance = user.credits + amt;
    txType = 'admin_credit';
    txAmount = amt;
  }
  newBalance = Math.round(newBalance * 100) / 100;
  db.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newBalance, user.id);
  recordTransaction(user.id, txType, txAmount, newBalance, `Ajuste manual por admin (${mode})`);
  logAdminActivity(req.user.id, req.user.username, 'adjust_credits', user.username, { mode, amount: amt, newBalance });
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.json({ user: sanitizeUser(updated) });
});

router.post('/users/:id/reset', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const startingCredits = Number(process.env.STARTING_CREDITS || 5000);
  db.prepare('UPDATE users SET credits = ? WHERE id = ?').run(startingCredits, user.id);
  db.prepare('DELETE FROM game_history WHERE user_id = ?').run(user.id);
  recordTransaction(user.id, 'reset', startingCredits, startingCredits, 'Cuenta restablecida por admin');
  logAdminActivity(req.user.id, req.user.username, 'reset_account', user.username, { startingCredits });
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.json({ user: sanitizeUser(updated) });
});

router.patch('/users/:id/status', (req, res) => {
  const { status } = req.body || {}; // 'active' | 'blocked'
  if (!['active', 'blocked'].includes(status)) return res.status(400).json({ error: 'Estado inválido' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, user.id);
  logAdminActivity(req.user.id, req.user.username, status === 'blocked' ? 'block_user' : 'unblock_user', user.username, {});
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.json({ user: sanitizeUser(updated) });
});

router.get('/users/:id/history', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM game_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 100')
    .all(req.params.id)
    .map((r) => ({ ...r, details: r.details ? JSON.parse(r.details) : null }));
  res.json({ history: rows });
});

// ---------- GAME CONFIG ----------
router.get('/games', (_req, res) => {
  const rows = db.prepare('SELECT * FROM game_configs ORDER BY name').all().map((r) => ({ ...r, params: JSON.parse(r.params) }));
  res.json({ games: rows });
});

router.patch('/games/:key', (req, res) => {
  const config = db.prepare('SELECT * FROM game_configs WHERE game_key = ?').get(req.params.key);
  if (!config) return res.status(404).json({ error: 'Juego no encontrado' });
  const { rtp, min_bet, max_bet, enabled, params } = req.body || {};
  const merged = {
    rtp: rtp ?? config.rtp,
    min_bet: min_bet ?? config.min_bet,
    max_bet: max_bet ?? config.max_bet,
    enabled: enabled === undefined ? config.enabled : enabled ? 1 : 0,
    params: params ? JSON.stringify({ ...JSON.parse(config.params), ...params }) : config.params,
  };
  db.prepare(
    `UPDATE game_configs SET rtp = ?, min_bet = ?, max_bet = ?, enabled = ?, params = ?, updated_at = datetime('now') WHERE game_key = ?`
  ).run(merged.rtp, merged.min_bet, merged.max_bet, merged.enabled, merged.params, req.params.key);
  logAdminActivity(req.user.id, req.user.username, 'update_game_config', req.params.key, merged);
  const updated = db.prepare('SELECT * FROM game_configs WHERE game_key = ?').get(req.params.key);
  res.json({ game: { ...updated, params: JSON.parse(updated.params) } });
});

// ---------- PROMO CODES ----------
router.get('/promo-codes', (_req, res) => {
  const rows = db.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC').all();
  res.json({ promoCodes: rows });
});

router.post('/promo-codes', (req, res) => {
  const { code, credits, maxUses = 100, expiresAt = null, active = true } = req.body || {};
  if (!code || !credits) return res.status(400).json({ error: 'Código y créditos son obligatorios' });
  const upper = String(code).trim().toUpperCase();
  const existing = db.prepare('SELECT id FROM promo_codes WHERE code = ?').get(upper);
  if (existing) return res.status(409).json({ error: 'Ese código ya existe' });
  const info = db
    .prepare('INSERT INTO promo_codes (code, credits, max_uses, active, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(upper, Number(credits), Number(maxUses), active ? 1 : 0, expiresAt);
  logAdminActivity(req.user.id, req.user.username, 'create_promo_code', upper, { credits, maxUses, expiresAt });
  const promo = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ promoCode: promo });
});

router.patch('/promo-codes/:id', (req, res) => {
  const promo = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(req.params.id);
  if (!promo) return res.status(404).json({ error: 'Código no encontrado' });
  const { credits, maxUses, expiresAt, active } = req.body || {};
  const merged = {
    credits: credits ?? promo.credits,
    maxUses: maxUses ?? promo.max_uses,
    expiresAt: expiresAt === undefined ? promo.expires_at : expiresAt,
    active: active === undefined ? promo.active : active ? 1 : 0,
  };
  db.prepare('UPDATE promo_codes SET credits = ?, max_uses = ?, expires_at = ?, active = ? WHERE id = ?').run(
    merged.credits,
    merged.maxUses,
    merged.expiresAt,
    merged.active,
    promo.id
  );
  logAdminActivity(req.user.id, req.user.username, 'update_promo_code', promo.code, merged);
  const updated = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(promo.id);
  res.json({ promoCode: updated });
});

router.delete('/promo-codes/:id', (req, res) => {
  const promo = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(req.params.id);
  if (!promo) return res.status(404).json({ error: 'Código no encontrado' });
  db.prepare('DELETE FROM promo_codes WHERE id = ?').run(promo.id);
  logAdminActivity(req.user.id, req.user.username, 'delete_promo_code', promo.code, {});
  res.json({ ok: true });
});

router.get('/promo-codes/:id/redemptions', (req, res) => {
  const rows = db
    .prepare(
      `SELECT pr.redeemed_at, u.username, u.email FROM promo_redemptions pr
       JOIN users u ON u.id = pr.user_id WHERE pr.promo_code_id = ? ORDER BY pr.redeemed_at DESC`
    )
    .all(req.params.id);
  res.json({ redemptions: rows });
});

// ---------- TRANSACTIONS ----------
router.get('/transactions', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const rows = db
    .prepare(
      `SELECT t.*, u.username FROM transactions t JOIN users u ON u.id = t.user_id
       ORDER BY t.created_at DESC LIMIT ?`
    )
    .all(limit);
  res.json({ transactions: rows });
});

// ---------- ACTIVITY LOG ----------
router.get('/activity-log', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const rows = db
    .prepare('SELECT * FROM admin_activity_log ORDER BY created_at DESC LIMIT ?')
    .all(limit)
    .map((r) => ({ ...r, details: r.details ? JSON.parse(r.details) : null }));
  res.json({ activityLog: rows });
});

// ---------- SETTINGS ----------
router.get('/settings', (_req, res) => {
  const startingCredits = db.prepare(`SELECT value FROM app_settings WHERE key = 'starting_credits'`).get();
  res.json({
    settings: {
      startingCredits: startingCredits ? Number(startingCredits.value) : Number(process.env.STARTING_CREDITS || 5000),
    },
  });
});

router.patch('/settings', (req, res) => {
  const { startingCredits } = req.body || {};
  if (startingCredits !== undefined) {
    db.prepare(
      `INSERT INTO app_settings (key, value) VALUES ('starting_credits', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).run(String(startingCredits));
    logAdminActivity(req.user.id, req.user.username, 'update_settings', 'starting_credits', { startingCredits });
  }
  res.json({ ok: true });
});

export default router;
