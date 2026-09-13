import { rand, randInt, pickWeighted, generateCrashPoint } from './rng.js';
import { createDeck, baccaratCardValue, baccaratHandValue } from './cards.js';

// ---------- SLOTS ----------
export function playSlots(params, bet, input) {
  const { symbols, weights, payTable } = params;
  const reels = [0, 1, 2].map(() => pickWeighted(symbols, weights));
  let multiplier = 0;
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    multiplier = payTable[reels[0]] || 0;
  } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    multiplier = 0.5; // small consolation for a pair
  }
  return {
    multiplier,
    outcome: multiplier > 0 ? 'win' : 'loss',
    details: { reels },
  };
}

// ---------- ROULETTE ----------
const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function playRoulette(_params, bet, input) {
  const { betType, betValue } = input; // betType: 'number' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'dozen' | 'column'
  const spin = randInt(0, 36);
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
    case 'low': // 1-18
      win = spin >= 1 && spin <= 18;
      payoutMultiplier = 2;
      break;
    case 'high': // 19-36
      win = spin >= 19 && spin <= 36;
      payoutMultiplier = 2;
      break;
    case 'dozen': // 1,2,3
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

  return {
    multiplier: win ? payoutMultiplier : 0,
    outcome: win ? 'win' : 'loss',
    details: { spin, isRed: spin === 0 ? null : isRed, betType, betValue },
  };
}

// ---------- DICE ----------
export function playDice(params, bet, input) {
  const { target, direction } = input; // direction: 'under' | 'over', target: 1-98
  const houseEdge = params.houseEdge ?? 0.04;
  const t = Math.min(Math.max(Number(target), 1), 98);
  const roll = Math.round(rand() * 10000) / 100; // 0.00 - 99.99

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

// ---------- COIN FLIP ----------
export function playCoinFlip(params, bet, input) {
  const { choice } = input; // 'heads' | 'tails'
  const result = rand() < 0.5 ? 'heads' : 'tails';
  const win = choice === result;
  const payout = params.payout ?? 1.96;
  return {
    multiplier: win ? payout : 0,
    outcome: win ? 'win' : 'loss',
    details: { result, choice },
  };
}

// ---------- WHEEL ----------
export function playWheel(params, bet, input) {
  const segments = params.segments;
  const idx = randInt(0, segments.length - 1);
  const multiplier = segments[idx];
  return {
    multiplier,
    outcome: multiplier > 0 ? 'win' : 'loss',
    details: { segmentIndex: idx, segments },
  };
}

// ---------- KENO ----------
export function playKeno(params, bet, input) {
  const { picks } = input; // array of numbers chosen by player
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

  // Simplified paytable scaling with number of picks vs matches
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
export function playLimbo(params, bet, input) {
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

// ---------- PLINKO ----------
const PLINKO_MULTIPLIERS = {
  low: [8, 3, 1.5, 1.2, 1, 0.5, 1, 1.2, 1.5, 3, 8],
  medium: [15, 5, 2, 1.3, 0.7, 0.4, 0.7, 1.3, 2, 5, 15],
  high: [43, 10, 3, 1.3, 0.4, 0.2, 0.4, 1.3, 3, 10, 43],
};

export function playPlinko(params, bet, input) {
  const risk = ['low', 'medium', 'high'].includes(input.risk) ? input.risk : 'medium';
  const rows = 10;
  const path = [];
  let position = 0; // -rows/2 .. +rows/2 conceptually, track rights count
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

// ---------- BACCARAT ----------
export function playBaccarat(params, bet, input) {
  const { betType } = input; // 'player' | 'banker' | 'tie'
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
    else multiplier = 9; // tie pays 8:1
  } else if (winner === 'tie' && betType !== 'tie') {
    multiplier = 1; // push: bet returned on player/banker when tie hits
  }

  return {
    multiplier,
    outcome: multiplier > 1 ? 'win' : multiplier === 1 ? 'push' : 'loss',
    details: { playerHand, bankerHand, playerValue, bankerValue, winner, betType },
  };
}
