import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth, sanitizeUser } from '../middleware/auth.js';

const router = Router();

router.get('/profile', requireAuth, (req, res) => {
  const stats = db
    .prepare(
      `SELECT
        COUNT(*) as totalGames,
        SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN outcome = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN payout > bet_amount THEN payout - bet_amount ELSE 0 END) as creditsWon,
        SUM(CASE WHEN payout <= bet_amount THEN bet_amount - payout ELSE 0 END) as creditsLost
      FROM game_history WHERE user_id = ?`
    )
    .get(req.user.id);

  const promoUses = db
    .prepare(
      `SELECT pc.code, pc.credits, pr.redeemed_at
       FROM promo_redemptions pr JOIN promo_codes pc ON pc.id = pr.promo_code_id
       WHERE pr.user_id = ? ORDER BY pr.redeemed_at DESC`
    )
    .all(req.user.id);

  res.json({
    user: sanitizeUser(req.user),
    stats: {
      totalGames: stats.totalGames || 0,
      wins: stats.wins || 0,
      losses: stats.losses || 0,
      creditsWon: Math.round((stats.creditsWon || 0) * 100) / 100,
      creditsLost: Math.round((stats.creditsLost || 0) * 100) / 100,
    },
    promoUses,
  });
});

router.patch('/profile', requireAuth, (req, res) => {
  const { avatar } = req.body || {};
  if (avatar) db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: sanitizeUser(user) });
});

router.get('/history', requireAuth, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = db
    .prepare('SELECT * FROM game_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(req.user.id, limit)
    .map((r) => ({ ...r, details: r.details ? JSON.parse(r.details) : null }));
  res.json({ history: rows });
});

router.get('/transactions', requireAuth, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = db
    .prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(req.user.id, limit);
  res.json({ transactions: rows });
});

export default router;
