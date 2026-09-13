import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import './db/index.js';
import './db/seed.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import gameRoutes from './routes/games.js';
import promoRoutes from './routes/promo.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import { attachChat } from './realtime/chat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true, demo: true, realMoney: false }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

const server = http.createServer(app);
attachChat(server);

server.listen(PORT, () => {
  console.log(`Casino DEMO API escuchando en http://localhost:${PORT}`);
  console.log('Modo demostración: sin dinero real, solo créditos virtuales.');
});
