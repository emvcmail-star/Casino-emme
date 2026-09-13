import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'demo-super-secret-change-me';

const ANON_ADJECTIVES = ['Sombra', 'Fantasma', 'Enmascarado', 'Misterioso', 'Incógnito', 'Oculto', 'Secreto', 'Desconocido'];

function randomAnonName() {
  const adj = ANON_ADJECTIVES[Math.floor(Math.random() * ANON_ADJECTIVES.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj} #${num}`;
}

const RATE_LIMIT_MS = 800;
const MAX_MESSAGE_LEN = 300;

export function attachChat(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No autenticado'));
      const payload = jwt.verify(token, JWT_SECRET);
      socket.userId = payload.id;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const anonName = randomAnonName();
    let lastMessageAt = 0;

    socket.on('chat:message', async ({ text, incognito } = {}) => {
      const now = Date.now();
      if (now - lastMessageAt < RATE_LIMIT_MS) return;
      lastMessageAt = now;

      const trimmed = String(text || '').trim().slice(0, MAX_MESSAGE_LEN);
      if (!trimmed) return;

      try {
        const user = await db.prepare('SELECT username, avatar, status FROM users WHERE id = ?').get(socket.userId);
        if (!user || user.status === 'blocked') return;

        const displayName = incognito ? anonName : user.username;
        const avatar = incognito ? null : user.avatar;

        const info = await db
          .prepare('INSERT INTO chat_messages (user_id, display_name, avatar, text, incognito) VALUES (?, ?, ?, ?, ?)')
          .run(socket.userId, displayName, avatar, trimmed, incognito ? 1 : 0);

        io.emit('chat:new', {
          id: info.lastInsertRowid,
          displayName,
          avatar,
          text: trimmed,
          incognito: !!incognito,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // demo chat: fallo silencioso ante mensajes malformados o error de DB puntual
      }
    });
  });

  return io;
}
