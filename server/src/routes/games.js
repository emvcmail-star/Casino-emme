import { Router } from 'express';
import { db, recordTransaction } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { createSession, getSession, updateSession, endSession } from '../games/sessions.js';
import { randInt } from '../games/rng.js';
import {
  playSlots,
  playRoulette,
  resolveRouletteBet,
  playDice,
  playCoinFlip,
  playWheel,
  playKeno,
  playLimbo,
  playPlinko,
  playBaccarat,
  playHorseRace,
} from '../games/oneshot.js';
import {
  blackjackDeal,
  blackjackHit,
  blackjackResolve,
  minesCreateGrid,
  minesFairMultiplier,
  towersRowBadIndex,
  towersFairMultiplier,
  hiloFairMultiplier,
  crashStart,
  crashMultiplierAtElapsed,
  videoPokerDeal,
  videoPokerDraw,
  evaluatePokerHand,
  rankValue,
} from '../games/sessionGames.js';

const router = Router();

async function getConfig(gameKey) {
  const row = await db.prepare('SELECT * FROM game_configs WHERE game_key = ?').get(gameKey);
  if (!row) return null;
  return { ...row, params: JSON.parse(row.params) };
}

async function requireEnabledConfig(gameKey, res) {
  const config = await getConfig(gameKey);
  if (!config) {
    res.status(404).json({ error: 'Juego no encontrado' });
    return null;
  }
  if (!config.enabled) {
    res.status(403).json({ error: 'Este juego está desactivado temporalmente' });
    return null;
  }
  return config;
}

function validateBet(config, bet, res) {
  const amount = Number(bet);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Apuesta inválida' });
    return null;
  }
  if (amount < config.min_bet || amount > config.max_bet) {
    res.status(400).json({ error: `La apuesta debe estar entre ${config.min_bet} y ${config.max_bet} créditos` });
    return null;
  }
  return amount;
}

async function currentCredits(userId) {
  return (await db.prepare('SELECT credits FROM users WHERE id = ?').get(userId)).credits;
}

async function debit(userId, amount, gameKey) {
  const credits = await currentCredits(userId);
  if (credits < amount) throw { status: 400, message: 'Créditos virtuales insuficientes' };
  const newBalance = Math.round((credits - amount) * 100) / 100;
  await db.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newBalance, userId);
  await recordTransaction(userId, 'bet', -amount, newBalance, `Apuesta en ${gameKey}`);
  return newBalance;
}

async function settle(userId, gameKey, betAmount, multiplier, outcome, details) {
  const payout = Math.round(betAmount * multiplier * 100) / 100;
  let newBalance = await currentCredits(userId);
  if (payout > 0) {
    newBalance = Math.round((newBalance + payout) * 100) / 100;
    await db.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newBalance, userId);
    await recordTransaction(userId, 'win', payout, newBalance, `Pago de ${gameKey}`);
  }
  await db
    .prepare(
      `INSERT INTO game_history (user_id, game_key, bet_amount, payout, multiplier, outcome, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(userId, gameKey, betAmount, payout, multiplier, outcome, JSON.stringify(details || {}));
  return { payout, newBalance };
}

router.get('/', requireAuth, async (_req, res) => {
  const rows = await db.prepare('SELECT game_key, name, rtp, min_bet, max_bet, enabled FROM game_configs').all();
  res.json({ games: rows });
});

router.get('/leaderboard', requireAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const rows = await db
    .prepare(
      `SELECT gh.id, gh.game_key, gh.bet_amount, gh.payout, gh.multiplier, gh.created_at,
              u.username, u.avatar
       FROM game_history gh JOIN users u ON u.id = gh.user_id
       WHERE gh.outcome = 'win' AND gh.multiplier > 1
       ORDER BY gh.multiplier DESC, gh.created_at DESC
       LIMIT ?`
    )
    .all(limit);
  res.json({ leaderboard: rows });
});

router.get('/:key/config', requireAuth, async (req, res) => {
  const config = await getConfig(req.params.key);
  if (!config) return res.status(404).json({ error: 'Juego no encontrado' });
  const { params, ...rest } = config;
  res.json({ ...rest, params });
});

// ============== GENERIC ONE-SHOT ENDPOINT ==============
const ONE_SHOT_HANDLERS = {
  slots: playSlots,
  roulette: playRoulette,
  dice: playDice,
  coinflip: playCoinFlip,
  wheel: playWheel,
  keno: playKeno,
  limbo: playLimbo,
  plinko: playPlinko,
  baccarat: playBaccarat,
  horserace: playHorseRace,
};

router.post('/:key/play', requireAuth, async (req, res) => {
  const gameKey = req.params.key;
  const handler = ONE_SHOT_HANDLERS[gameKey];
  if (!handler) return res.status(400).json({ error: 'Este juego usa un flujo distinto (sesión por pasos)' });

  const config = await requireEnabledConfig(gameKey, res);
  if (!config) return;
  const bet = validateBet(config, req.body?.bet, res);
  if (bet === null) return;

  try {
    await debit(req.user.id, bet, gameKey);
    const result = handler(config.params, bet, req.body || {});
    const { payout, newBalance } = await settle(req.user.id, gameKey, bet, result.multiplier, result.outcome, result.details);
    res.json({
      outcome: result.outcome,
      multiplier: result.multiplier,
      bet,
      payout,
      newBalance,
      details: result.details,
    });
  } catch (err) {
    const status = err.status || 400;
    res.status(status).json({ error: err.message || 'Error al procesar la jugada' });
  }
});

// Plinko en lote: soltar varias bolas de una vez. Se calcula todo en un solo
// movimiento de créditos (una lectura + una escritura) para no perder
// actualizaciones si el cliente disparara N apuestas en paralelo.
router.post('/plinko/play-batch', requireAuth, async (req, res) => {
  const config = await requireEnabledConfig('plinko', res);
  if (!config) return;
  const bet = validateBet(config, req.body?.bet, res);
  if (bet === null) return;
  const count = Math.min(Math.max(Number(req.body?.count) || 1, 1), 50);

  try {
    const totalBet = Math.round(bet * count * 100) / 100;
    const credits = await currentCredits(req.user.id);
    if (credits < totalBet) throw { status: 400, message: 'Créditos virtuales insuficientes' };

    const results = [];
    let totalPayout = 0;
    for (let i = 0; i < count; i++) {
      const result = playPlinko(config.params, bet, req.body || {});
      const payout = Math.round(bet * result.multiplier * 100) / 100;
      totalPayout += payout;
      results.push({ ...result, bet, payout });
    }
    totalPayout = Math.round(totalPayout * 100) / 100;

    const newBalance = Math.round((credits - totalBet + totalPayout) * 100) / 100;
    await db.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newBalance, req.user.id);
    await recordTransaction(req.user.id, 'bet', -totalBet, newBalance, `Apuesta en plinko (x${count} bolas)`);
    if (totalPayout > 0) {
      await recordTransaction(req.user.id, 'win', totalPayout, newBalance, `Pago de plinko (x${count} bolas)`);
    }
    for (const r of results) {
      await db
        .prepare(
          `INSERT INTO game_history (user_id, game_key, bet_amount, payout, multiplier, outcome, details)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(req.user.id, 'plinko', bet, r.payout, r.multiplier, r.outcome, JSON.stringify(r.details || {}));
    }

    res.json({ results, totalBet, totalPayout, newBalance });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'Error al procesar la jugada' });
  }
});

// Ruleta con varias apuestas en un solo giro: mismo número resuelve todas.
router.post('/roulette/play-multi', requireAuth, async (req, res) => {
  const config = await requireEnabledConfig('roulette', res);
  if (!config) return;

  const bets = Array.isArray(req.body?.bets) ? req.body.bets : [];
  if (bets.length === 0) return res.status(400).json({ error: 'Agrega al menos una apuesta' });
  if (bets.length > 20) return res.status(400).json({ error: 'Demasiadas apuestas para un solo giro' });

  let totalBet = 0;
  for (const b of bets) {
    const amt = Number(b.amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Apuesta inválida' });
    if (amt < config.min_bet || amt > config.max_bet) {
      return res.status(400).json({ error: `Cada apuesta debe estar entre ${config.min_bet} y ${config.max_bet} créditos` });
    }
    totalBet += amt;
  }
  totalBet = Math.round(totalBet * 100) / 100;

  try {
    const credits = await currentCredits(req.user.id);
    if (credits < totalBet) throw { status: 400, message: 'Créditos virtuales insuficientes' };

    const spin = randInt(0, 36);
    let isRed = null;
    let totalPayout = 0;
    const results = bets.map((b) => {
      const amt = Number(b.amount);
      const { win, payoutMultiplier, isRed: red } = resolveRouletteBet(spin, b.betType, b.betValue);
      isRed = red;
      const payout = win ? Math.round(amt * payoutMultiplier * 100) / 100 : 0;
      totalPayout += payout;
      return { betType: b.betType, betValue: b.betValue, amount: amt, win, multiplier: win ? payoutMultiplier : 0, payout };
    });
    totalPayout = Math.round(totalPayout * 100) / 100;

    const newBalance = Math.round((credits - totalBet + totalPayout) * 100) / 100;
    await db.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newBalance, req.user.id);
    await recordTransaction(req.user.id, 'bet', -totalBet, newBalance, `Apuesta en roulette (${bets.length} apuestas)`);
    if (totalPayout > 0) {
      await recordTransaction(req.user.id, 'win', totalPayout, newBalance, `Pago de roulette (${bets.length} apuestas)`);
    }
    await db
      .prepare(
        `INSERT INTO game_history (user_id, game_key, bet_amount, payout, multiplier, outcome, details)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.user.id,
        'roulette',
        totalBet,
        totalPayout,
        totalBet > 0 ? Math.round((totalPayout / totalBet) * 10000) / 10000 : 0,
        totalPayout >= totalBet ? 'win' : 'loss',
        JSON.stringify({ spin, isRed, bets: results })
      );

    res.json({ spin, isRed, results, totalBet, totalPayout, newBalance });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'Error al procesar la jugada' });
  }
});

// ============== BLACKJACK ==============
router.post('/blackjack/deal', requireAuth, async (req, res) => {
  const config = await requireEnabledConfig('blackjack', res);
  if (!config) return;
  const bet = validateBet(config, req.body?.bet, res);
  if (bet === null) return;
  try {
    const newBalance = await debit(req.user.id, bet, 'blackjack');
    const { state, naturalBlackjack } = blackjackDeal(config.params);
    const sessionId = createSession(req.user.id, 'blackjack', { ...state, bet });

    if (naturalBlackjack) {
      const resolved = blackjackResolve(state, config.params);
      const { payout, newBalance: finalBalance } = await settle(req.user.id, 'blackjack', bet, resolved.multiplier, resolved.outcome, {
        player: state.player,
        dealer: state.dealer,
      });
      endSession(sessionId);
      return res.json({
        finished: true,
        sessionId: null,
        player: state.player,
        dealer: state.dealer,
        outcome: resolved.outcome,
        multiplier: resolved.multiplier,
        payout,
        newBalance: finalBalance,
      });
    }

    res.json({
      finished: false,
      sessionId,
      player: state.player,
      dealer: [state.dealer[0], { hidden: true }],
      newBalance,
    });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'Error' });
  }
});

async function bjRespondFinal(req, res, session) {
  const config = await getConfig('blackjack');
  const resolved = blackjackResolve(session.state, config.params);
  const { payout, newBalance } = await settle(
    req.user.id,
    'blackjack',
    session.state.bet,
    resolved.multiplier,
    resolved.outcome,
    { player: session.state.player, dealer: session.state.dealer }
  );
  endSession(session.id);
  res.json({
    finished: true,
    player: session.state.player,
    dealer: session.state.dealer,
    outcome: resolved.outcome,
    multiplier: resolved.multiplier,
    payout,
    newBalance,
  });
}

router.post('/blackjack/hit', requireAuth, async (req, res) => {
  const session = getSession(req.body?.sessionId, req.user.id, 'blackjack');
  if (!session) return res.status(404).json({ error: 'Sesión de blackjack no encontrada o expirada' });
  blackjackHit(session.state);
  updateSession(session.id, session.state);
  const bust = (function () {
    let t = 0,
      aces = 0;
    for (const c of session.state.player) {
      if (c.rank === 'A') {
        t += 11;
        aces++;
      } else if (['K', 'Q', 'J'].includes(c.rank)) t += 10;
      else t += Number(c.rank);
    }
    while (t > 21 && aces > 0) {
      t -= 10;
      aces--;
    }
    return t > 21;
  })();

  if (bust || session.state.finished) {
    return bjRespondFinal(req, res, session);
  }
  res.json({ finished: false, player: session.state.player, dealer: [session.state.dealer[0], { hidden: true }] });
});

router.post('/blackjack/stand', requireAuth, async (req, res) => {
  const session = getSession(req.body?.sessionId, req.user.id, 'blackjack');
  if (!session) return res.status(404).json({ error: 'Sesión de blackjack no encontrada o expirada' });
  bjRespondFinal(req, res, session);
});

router.post('/blackjack/double', requireAuth, async (req, res) => {
  const session = getSession(req.body?.sessionId, req.user.id, 'blackjack');
  if (!session) return res.status(404).json({ error: 'Sesión de blackjack no encontrada o expirada' });
  if (session.state.player.length !== 2) return res.status(400).json({ error: 'Solo puedes doblar en tu primera decisión' });
  try {
    await debit(req.user.id, session.state.bet, 'blackjack (doble)');
    session.state.bet = session.state.bet * 2;
    blackjackHit(session.state);
    updateSession(session.id, session.state);
    return bjRespondFinal(req, res, session);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'Error' });
  }
});

// ============== MINES ==============
router.post('/mines/start', requireAuth, async (req, res) => {
  const config = await requireEnabledConfig('mines', res);
  if (!config) return;
  const bet = validateBet(config, req.body?.bet, res);
  if (bet === null) return;
  const minesCount = Math.min(Math.max(Number(req.body?.minesCount) || 3, 1), 24);
  try {
    const newBalance = await debit(req.user.id, bet, 'mines');
    const mines = minesCreateGrid(config.params.gridSize, minesCount);
    const sessionId = createSession(req.user.id, 'mines', {
      bet,
      minesCount,
      mines: [...mines],
      revealed: [],
      gridSize: config.params.gridSize,
      houseEdge: config.params.houseEdge,
      finished: false,
    });
    res.json({ sessionId, gridSize: config.params.gridSize, minesCount, newBalance });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'Error' });
  }
});

router.post('/mines/reveal', requireAuth, async (req, res) => {
  const session = getSession(req.body?.sessionId, req.user.id, 'mines');
  if (!session) return res.status(404).json({ error: 'Sesión de mines no encontrada o expirada' });
  const cellIndex = Number(req.body?.cellIndex);
  const state = session.state;
  if (state.finished) return res.status(400).json({ error: 'Esta partida ya terminó' });
  if (state.revealed.includes(cellIndex)) return res.status(400).json({ error: 'Casilla ya revelada' });

  const isMine = state.mines.includes(cellIndex);
  if (isMine) {
    state.finished = true;
    updateSession(session.id, state);
    const { payout, newBalance } = await settle(req.user.id, 'mines', state.bet, 0, 'loss', {
      mines: state.mines,
      revealed: state.revealed,
      hitMine: cellIndex,
    });
    endSession(session.id);
    return res.json({ finished: true, hitMine: true, mines: state.mines, payout, newBalance });
  }

  state.revealed.push(cellIndex);
  const multiplier = minesFairMultiplier(state.gridSize, state.minesCount, state.revealed.length, state.houseEdge ?? 0.04);
  const maxSafe = state.gridSize - state.minesCount;
  const allCleared = state.revealed.length === maxSafe;
  updateSession(session.id, state);

  if (allCleared) {
    state.finished = true;
    const { payout, newBalance } = await settle(req.user.id, 'mines', state.bet, multiplier, 'win', {
      mines: state.mines,
      revealed: state.revealed,
    });
    endSession(session.id);
    return res.json({ finished: true, hitMine: false, allCleared: true, multiplier, payout, newBalance, mines: state.mines });
  }

  res.json({ finished: false, revealed: state.revealed, multiplier });
});

router.post('/mines/cashout', requireAuth, async (req, res) => {
  const session = getSession(req.body?.sessionId, req.user.id, 'mines');
  if (!session) return res.status(404).json({ error: 'Sesión de mines no encontrada o expirada' });
  const state = session.state;
  if (state.finished) return res.status(400).json({ error: 'Esta partida ya terminó' });
  const multiplier = state.revealed.length
    ? minesFairMultiplier(state.gridSize, state.minesCount, state.revealed.length, state.houseEdge ?? 0.04)
    : 1;
  const { payout, newBalance } = await settle(req.user.id, 'mines', state.bet, multiplier, 'win', {
    mines: state.mines,
    revealed: state.revealed,
    cashedOut: true,
  });
  endSession(session.id);
  res.json({ finished: true, multiplier, payout, newBalance, mines: state.mines });
});

// ============== TOWERS ==============
router.post('/towers/start', requireAuth, async (req, res) => {
  const config = await requireEnabledConfig('towers', res);
  if (!config) return;
  const bet = validateBet(config, req.body?.bet, res);
  if (bet === null) return;
  try {
    const newBalance = await debit(req.user.id, bet, 'towers');
    const { rows, cols, badPerRow } = config.params;
    const badCells = Array.from({ length: rows }, () => towersRowBadIndex(cols));
    const sessionId = createSession(req.user.id, 'towers', {
      bet,
      rows,
      cols,
      badPerRow,
      badCells,
      currentRow: 0,
      houseEdge: config.params.houseEdge,
      finished: false,
    });
    res.json({ sessionId, rows, cols, newBalance });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'Error' });
  }
});

router.post('/towers/climb', requireAuth, async (req, res) => {
  const session = getSession(req.body?.sessionId, req.user.id, 'towers');
  if (!session) return res.status(404).json({ error: 'Sesión de towers no encontrada o expirada' });
  const state = session.state;
  if (state.finished) return res.status(400).json({ error: 'Esta partida ya terminó' });
  const col = Number(req.body?.col);
  const badCol = state.badCells[state.currentRow];

  if (col === badCol) {
    state.finished = true;
    updateSession(session.id, state);
    const { payout, newBalance } = await settle(req.user.id, 'towers', state.bet, 0, 'loss', {
      badCells: state.badCells,
      reachedRow: state.currentRow,
    });
    endSession(session.id);
    return res.json({ finished: true, lost: true, badCol, payout, newBalance, badCells: state.badCells });
  }

  state.currentRow += 1;
  const multiplier = towersFairMultiplier(state.cols, state.badPerRow, state.currentRow, state.houseEdge ?? 0.04);
  const atTop = state.currentRow >= state.rows;
  updateSession(session.id, state);

  if (atTop) {
    state.finished = true;
    const { payout, newBalance } = await settle(req.user.id, 'towers', state.bet, multiplier, 'win', {
      badCells: state.badCells,
      reachedRow: state.currentRow,
    });
    endSession(session.id);
    return res.json({ finished: true, lost: false, atTop: true, multiplier, payout, newBalance });
  }

  res.json({ finished: false, currentRow: state.currentRow, multiplier });
});

router.post('/towers/cashout', requireAuth, async (req, res) => {
  const session = getSession(req.body?.sessionId, req.user.id, 'towers');
  if (!session) return res.status(404).json({ error: 'Sesión de towers no encontrada o expirada' });
  const state = session.state;
  if (state.finished) return res.status(400).json({ error: 'Esta partida ya terminó' });
  const multiplier = state.currentRow > 0 ? towersFairMultiplier(state.cols, state.badPerRow, state.currentRow, state.houseEdge ?? 0.04) : 1;
  const { payout, newBalance } = await settle(req.user.id, 'towers', state.bet, multiplier, 'win', {
    reachedRow: state.currentRow,
    cashedOut: true,
  });
  endSession(session.id);
  res.json({ finished: true, multiplier, payout, newBalance });
});

// ============== HI-LO ==============
router.post('/hilo/start', requireAuth, async (req, res) => {
  const config = await requireEnabledConfig('hilo', res);
  if (!config) return;
  const bet = validateBet(config, req.body?.bet, res);
  if (bet === null) return;
  try {
    const newBalance = await debit(req.user.id, bet, 'hilo');
    const suits = ['♠', '♥', '♦', '♣'];
    const ranksArr = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (const s of suits) for (const r of ranksArr) deck.push({ rank: r, suit: s });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const current = deck.pop();
    const sessionId = createSession(req.user.id, 'hilo', {
      bet,
      deck,
      current,
      streak: 0,
      houseEdge: config.params.houseEdge,
      finished: false,
    });
    res.json({ sessionId, currentCard: current, newBalance });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'Error' });
  }
});

router.post('/hilo/guess', requireAuth, async (req, res) => {
  const session = getSession(req.body?.sessionId, req.user.id, 'hilo');
  if (!session) return res.status(404).json({ error: 'Sesión de hi-lo no encontrada o expirada' });
  const state = session.state;
  if (state.finished) return res.status(400).json({ error: 'Esta partida ya terminó' });
  const guess = req.body?.guess; // 'higher' | 'lower'
  const next = state.deck.pop();
  const curRank = rankValue(state.current.rank);
  const nextRank = rankValue(next.rank);

  let correct;
  if (nextRank === curRank) correct = false; // tie favors house
  else correct = guess === 'higher' ? nextRank > curRank : nextRank < curRank;

  if (!correct) {
    state.finished = true;
    updateSession(session.id, state);
    const { payout, newBalance } = await settle(req.user.id, 'hilo', state.bet, 0, 'loss', { previousCard: state.current, nextCard: next });
    endSession(session.id);
    return res.json({ finished: true, correct: false, nextCard: next, payout, newBalance });
  }

  state.streak += 1;
  state.current = next;
  const multiplier = hiloFairMultiplier(curRank, guess, state.houseEdge ?? 0.03) * (state.streak > 1 ? state.cumMultiplier || 1 : 1);
  state.cumMultiplier = (state.cumMultiplier || 1) * hiloFairMultiplier(curRank, guess, state.houseEdge ?? 0.03);
  updateSession(session.id, state);

  if (state.deck.length === 0) {
    state.finished = true;
    const { payout, newBalance } = await settle(req.user.id, 'hilo', state.bet, state.cumMultiplier, 'win', { streak: state.streak });
    endSession(session.id);
    return res.json({ finished: true, correct: true, deckEmpty: true, nextCard: next, multiplier: state.cumMultiplier, payout, newBalance });
  }

  res.json({ finished: false, correct: true, nextCard: next, streak: state.streak, multiplier: Math.round(state.cumMultiplier * 10000) / 10000 });
});

router.post('/hilo/cashout', requireAuth, async (req, res) => {
  const session = getSession(req.body?.sessionId, req.user.id, 'hilo');
  if (!session) return res.status(404).json({ error: 'Sesión de hi-lo no encontrada o expirada' });
  const state = session.state;
  if (state.finished) return res.status(400).json({ error: 'Esta partida ya terminó' });
  const multiplier = state.cumMultiplier || 1;
  const { payout, newBalance } = await settle(req.user.id, 'hilo', state.bet, multiplier, 'win', { streak: state.streak, cashedOut: true });
  endSession(session.id);
  res.json({ finished: true, multiplier, payout, newBalance });
});

// ============== CRASH ==============
router.post('/crash/start', requireAuth, async (req, res) => {
  const config = await requireEnabledConfig('crash', res);
  if (!config) return;
  const bet = validateBet(config, req.body?.bet, res);
  if (bet === null) return;
  try {
    const newBalance = await debit(req.user.id, bet, 'crash');
    const { crashPoint, startedAt } = crashStart(config.params.houseEdge ?? 0.04);
    const sessionId = createSession(req.user.id, 'crash', { bet, crashPoint, startedAt, finished: false });
    res.json({ sessionId, newBalance });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'Error' });
  }
});

router.post('/crash/cashout', requireAuth, async (req, res) => {
  const session = getSession(req.body?.sessionId, req.user.id, 'crash');
  if (!session) return res.status(404).json({ error: 'Sesión de crash no encontrada o expirada' });
  const state = session.state;
  if (state.finished) return res.status(400).json({ error: 'Esta partida ya terminó' });
  const elapsed = Date.now() - state.startedAt;
  const currentMultiplier = crashMultiplierAtElapsed(elapsed);

  state.finished = true;
  if (currentMultiplier >= state.crashPoint) {
    const { payout, newBalance } = await settle(req.user.id, 'crash', state.bet, 0, 'loss', {
      crashPoint: state.crashPoint,
      attemptedAt: state.crashPoint,
    });
    endSession(session.id);
    return res.json({ finished: true, crashed: true, crashPoint: state.crashPoint, payout, newBalance });
  }

  const { payout, newBalance } = await settle(req.user.id, 'crash', state.bet, currentMultiplier, 'win', {
    crashPoint: state.crashPoint,
    cashedOutAt: currentMultiplier,
  });
  endSession(session.id);
  res.json({ finished: true, crashed: false, multiplier: currentMultiplier, crashPoint: state.crashPoint, payout, newBalance });
});

router.post('/crash/status', requireAuth, async (req, res) => {
  const session = getSession(req.body?.sessionId, req.user.id, 'crash');
  if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
  const elapsed = Date.now() - session.state.startedAt;
  const currentMultiplier = crashMultiplierAtElapsed(elapsed);
  const crashed = currentMultiplier >= session.state.crashPoint;
  res.json({ multiplier: currentMultiplier, crashed });
});

// ============== VIDEO POKER ==============
router.post('/videopoker/deal', requireAuth, async (req, res) => {
  const config = await requireEnabledConfig('videopoker', res);
  if (!config) return;
  const bet = validateBet(config, req.body?.bet, res);
  if (bet === null) return;
  try {
    const newBalance = await debit(req.user.id, bet, 'videopoker');
    const { deck, hand } = videoPokerDeal(config.params);
    const sessionId = createSession(req.user.id, 'videopoker', { bet, deck, hand, finished: false });
    res.json({ sessionId, hand, newBalance });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message || 'Error' });
  }
});

router.post('/videopoker/draw', requireAuth, async (req, res) => {
  const session = getSession(req.body?.sessionId, req.user.id, 'videopoker');
  if (!session) return res.status(404).json({ error: 'Sesión de video poker no encontrada o expirada' });
  const holds = Array.isArray(req.body?.holds) ? req.body.holds.map(Number) : [];
  const state = session.state;
  const finalHand = videoPokerDraw(state, holds);
  const evaluation = evaluatePokerHand(finalHand);
  const outcome = evaluation.mult > 0 ? 'win' : 'loss';
  const { payout, newBalance } = await settle(req.user.id, 'videopoker', state.bet, evaluation.mult, outcome, {
    finalHand,
    handName: evaluation.name,
  });
  endSession(session.id);
  res.json({ finished: true, finalHand, handName: evaluation.name, multiplier: evaluation.mult, payout, newBalance });
});

export default router;
