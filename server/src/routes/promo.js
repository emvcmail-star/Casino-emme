import { Router } from 'express';
import { db, recordTransaction } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/redeem', requireAuth, (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Introduce un código promocional' });

  const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ?').get(String(code).trim().toUpperCase());
  if (!promo) return res.status(404).json({ error: 'Código promocional no válido' });
  if (!promo.active) return res.status(400).json({ error: 'Este código está desactivado' });
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Este código ha expirado' });
  }
  if (promo.uses_count >= promo.max_uses) {
    return res.status(400).json({ error: 'Este código alcanzó su número máximo de usos' });
  }
  const already = db
    .prepare('SELECT id FROM promo_redemptions WHERE promo_code_id = ? AND user_id = ?')
    .get(promo.id, req.user.id);
  if (already) return res.status(400).json({ error: 'Ya has usado este código' });

  const tx = db.transaction(() => {
    db.prepare('INSERT INTO promo_redemptions (promo_code_id, user_id) VALUES (?, ?)').run(promo.id, req.user.id);
    db.prepare('UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = ?').run(promo.id);
    const newBalance = req.user.credits + promo.credits;
    db.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newBalance, req.user.id);
    recordTransaction(req.user.id, 'promo', promo.credits, newBalance, `Código promocional ${promo.code}`);
    return newBalance;
  });

  const newBalance = tx();
  res.json({
    ok: true,
    message: `¡Código ${promo.code} activado! +${promo.credits} créditos virtuales`,
    creditsAdded: promo.credits,
    newBalance,
  });
});

router.get('/available', requireAuth, (_req, res) => {
  const now = new Date().toISOString();
  const rows = db
    .prepare(
      `SELECT code, credits, max_uses, uses_count, expires_at FROM promo_codes
       WHERE active = 1 AND (expires_at IS NULL OR expires_at > ?) AND uses_count < max_uses`
    )
    .all(now);
  res.json({ promoCodes: rows });
});

export default router;
