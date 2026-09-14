import bcrypt from 'bcryptjs';
import { db } from './index.js';

const STARTING_CREDITS = Number(process.env.STARTING_CREDITS || 5000);

const GAMES = [
  { key: 'slots', name: 'Slots', rtp: 96, min: 1, max: 500, params: { reels: 3, rows: 3, symbols: ['cherry', 'lemon', 'bell', 'star', 'diamond', 'seven'], weights: [30, 25, 18, 12, 9, 6], payTable: { cherry: 2, lemon: 3, bell: 5, star: 10, diamond: 25, seven: 50 } } },
  { key: 'roulette', name: 'Roulette', rtp: 97.3, min: 1, max: 1000, params: { type: 'european' } },
  { key: 'blackjack', name: 'Blackjack', rtp: 99, min: 1, max: 1000, params: { decks: 6, blackjackPayout: 1.5 } },
  { key: 'baccarat', name: 'Baccarat', rtp: 98.5, min: 1, max: 1000, params: { bankerCommission: 0.05 } },
  { key: 'dice', name: 'Dice', rtp: 96, min: 1, max: 1000, params: { houseEdge: 0.04 } },
  { key: 'mines', name: 'Mines', rtp: 96, min: 1, max: 500, params: { gridSize: 25, houseEdge: 0.04 } },
  { key: 'plinko', name: 'Plinko', rtp: 96, min: 1, max: 500, params: { rows: 12, riskLevels: ['low', 'medium', 'high'] } },
  { key: 'crash', name: 'Crash', rtp: 96, min: 1, max: 500, params: { houseEdge: 0.04 } },
  { key: 'vuelo', name: 'Vuelo', rtp: 96, min: 1, max: 500, params: { houseEdge: 0.04 } },
  { key: 'wheel', name: 'Wheel', rtp: 96, min: 1, max: 500, params: { segments: [1.2, 1.5, 2, 3, 5, 0, 1.2, 1.5, 2, 3, 10, 0] } },
  { key: 'coinflip', name: 'Coin Flip', rtp: 96, min: 1, max: 1000, params: { houseEdge: 0.04, payout: 1.96 } },
  { key: 'keno', name: 'Keno', rtp: 95, min: 1, max: 500, params: { totalNumbers: 40, drawCount: 10, maxPicks: 10 } },
  { key: 'hilo', name: 'Hi-Lo', rtp: 97, min: 1, max: 500, params: { houseEdge: 0.03 } },
  { key: 'limbo', name: 'Limbo', rtp: 96, min: 1, max: 1000, params: { houseEdge: 0.04 } },
  { key: 'towers', name: 'Towers', rtp: 96, min: 1, max: 500, params: { rows: 8, cols: 3, badPerRow: 1, houseEdge: 0.04 } },
  { key: 'videopoker', name: 'Video Poker', rtp: 96.5, min: 1, max: 500, params: { variant: 'jacks-or-better' } },
  {
    key: 'horserace',
    name: 'Horse Race',
    rtp: 95.5,
    min: 1,
    max: 500,
    params: {
      horses: [
        { name: 'Relámpago', color: '#ef4444', probability: 0.35, multiplier: 2.7 },
        { name: 'Trueno', color: '#3b82f6', probability: 0.25, multiplier: 3.8 },
        { name: 'Fantasma', color: '#22c55e', probability: 0.2, multiplier: 4.8 },
        { name: 'Dorado', color: '#f59e0b', probability: 0.12, multiplier: 8 },
        { name: 'Sombra', color: '#a855f7', probability: 0.08, multiplier: 12 },
      ],
    },
  },
];

const insertGame = db.prepare(`
  INSERT INTO game_configs (game_key, name, rtp, min_bet, max_bet, params, enabled)
  VALUES (?, ?, ?, ?, ?, ?, 1)
  ON CONFLICT(game_key) DO NOTHING
`);

async function upsertUser(username, email, password, role, credits, avatar) {
  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return existing.id;
  const hash = bcrypt.hashSync(password, 10);
  const info = await db
    .prepare('INSERT INTO users (username, email, password_hash, role, avatar, credits) VALUES (?, ?, ?, ?, ?, ?)')
    .run(username, email, hash, role, avatar, credits);
  return info.lastInsertRowid;
}

for (const g of GAMES) {
  await insertGame.run(g.key, g.name, g.rtp, g.min, g.max, JSON.stringify(g.params));
}

await upsertUser('admin', 'admin@casino-demo.local', 'Admin123!', 'admin', 5_000_000, 'gem');
await upsertUser('demo', 'demo@casino-demo.local', 'Demo123!', 'player', STARTING_CREDITS, 'spade');
await upsertUser('lucky_maria', 'maria@casino-demo.local', 'Demo123!', 'player', 8200, 'flame');
await upsertUser('vip_carlos', 'carlos@casino-demo.local', 'Demo123!', 'player', 24500, 'crown');

const insertPromo = db.prepare(`
  INSERT INTO promo_codes (code, credits, max_uses, active, expires_at)
  VALUES (?, ?, ?, 1, ?)
  ON CONFLICT(code) DO NOTHING
`);
const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString();
await insertPromo.run('WELCOME100', 100, 1000, future);
await insertPromo.run('DEMO500', 500, 500, future);
await insertPromo.run('LUCKY1000', 1000, 200, future);

console.log('Seed completado.');
console.log('   Admin  -> usuario: admin      contraseña: Admin123!');
console.log('   Demo   -> usuario: demo       contraseña: Demo123!');
console.log('   Códigos promo: WELCOME100, DEMO500, LUCKY1000');
