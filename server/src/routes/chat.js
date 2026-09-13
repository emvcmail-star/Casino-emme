import { Router } from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/history', requireAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = await db
    .prepare(
      `SELECT id, display_name, avatar, text, incognito, created_at
       FROM chat_messages ORDER BY id DESC LIMIT ?`
    )
    .all(limit);
  res.json({ messages: rows.reverse() });
});

export default router;
