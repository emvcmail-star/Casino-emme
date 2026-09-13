import { nanoid } from 'nanoid';

// In-memory session store for multi-step games (demo only; cleared on restart)
const sessions = new Map();
const TTL_MS = 1000 * 60 * 30; // 30 minutes

export function createSession(userId, gameKey, state) {
  const id = nanoid(16);
  sessions.set(id, { id, userId, gameKey, state, createdAt: Date.now() });
  return id;
}

export function getSession(id, userId, gameKey) {
  const s = sessions.get(id);
  if (!s) return null;
  if (Date.now() - s.createdAt > TTL_MS) {
    sessions.delete(id);
    return null;
  }
  if (s.userId !== userId || s.gameKey !== gameKey) return null;
  return s;
}

export function updateSession(id, state) {
  const s = sessions.get(id);
  if (!s) return null;
  s.state = state;
  return s;
}

export function endSession(id) {
  sessions.delete(id);
}

// periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions.entries()) {
    if (now - s.createdAt > TTL_MS) sessions.delete(id);
  }
}, 60_000).unref();
