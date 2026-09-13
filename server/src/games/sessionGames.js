import { rand, randInt, generateCrashPoint } from './rng.js';
import { createDeck, blackjackHandValue, rankValue, evaluatePokerHand } from './cards.js';

// ================= BLACKJACK =================
export function blackjackDeal(params) {
  const deck = createDeck(params.decks || 6);
  const player = [deck.pop(), deck.pop()];
  const dealer = [deck.pop(), deck.pop()];
  const state = { deck, player, dealer, doubled: false, finished: false };
  const playerValue = blackjackHandValue(player);
  const naturalBlackjack = playerValue === 21;
  return { state, naturalBlackjack };
}

export function blackjackHit(state) {
  state.player.push(state.deck.pop());
  const value = blackjackHandValue(state.player);
  if (value >= 21) state.finished = true;
  return state;
}

export function blackjackDealerPlay(state) {
  while (blackjackHandValue(state.dealer) < 17) {
    state.dealer.push(state.deck.pop());
  }
  return state;
}

export function blackjackResolve(state, params) {
  const playerValue = blackjackHandValue(state.player);
  let dealerValue;
  let outcomeMultiplier = 0;
  let outcome = 'loss';

  if (playerValue > 21) {
    outcomeMultiplier = 0;
    outcome = 'loss';
    dealerValue = blackjackHandValue(state.dealer);
  } else {
    blackjackDealerPlay(state);
    dealerValue = blackjackHandValue(state.dealer);
    const playerBJ = playerValue === 21 && state.player.length === 2;
    const dealerBJ = dealerValue === 21 && state.dealer.length === 2;

    if (playerBJ && !dealerBJ) {
      outcome = 'win';
      outcomeMultiplier = 1 + (params.blackjackPayout ?? 1.5);
    } else if (dealerValue > 21 || playerValue > dealerValue) {
      outcome = 'win';
      outcomeMultiplier = 2;
    } else if (playerValue === dealerValue) {
      outcome = 'push';
      outcomeMultiplier = 1;
    } else {
      outcome = 'loss';
      outcomeMultiplier = 0;
    }
  }

  return { outcome, multiplier: outcomeMultiplier, playerValue, dealerValue };
}

// ================= MINES =================
export function minesCreateGrid(gridSize, minesCount) {
  const cells = Array.from({ length: gridSize }, (_, i) => i);
  const mines = new Set();
  while (mines.size < minesCount) {
    mines.add(cells[randInt(0, gridSize - 1)]);
  }
  return mines;
}

export function minesFairMultiplier(gridSize, minesCount, revealed, houseEdge) {
  // Multiplier = product over each safe reveal of (remaining cells / remaining safe cells), adjusted by house edge
  let mult = 1;
  for (let i = 0; i < revealed; i++) {
    const remainingCells = gridSize - i;
    const remainingSafe = gridSize - minesCount - i;
    mult *= remainingCells / remainingSafe;
  }
  return Math.round(mult * (1 - houseEdge) * 10000) / 10000;
}

// ================= TOWERS =================
export function towersRowBadIndex(cols) {
  return randInt(0, cols - 1);
}

export function towersFairMultiplier(cols, badPerRow, row, houseEdge) {
  const safeChancePerRow = (cols - badPerRow) / cols;
  const mult = Math.pow(1 / safeChancePerRow, row);
  return Math.round(mult * (1 - houseEdge) * 10000) / 10000;
}

// ================= HI-LO =================
export function hiloFairMultiplier(currentRank, guess, houseEdge) {
  // Probability of guessing correctly depends on current card rank (2-14)
  let favorable;
  if (guess === 'higher') favorable = 14 - currentRank;
  else favorable = currentRank - 2;
  favorable = Math.max(favorable, 1);
  const chance = favorable / 12; // 12 other rank-values possible (excluding equal, simplified)
  const mult = 1 / chance;
  return Math.round(mult * (1 - houseEdge) * 10000) / 10000;
}

// ================= CRASH =================
export function crashStart(houseEdge) {
  const crashPoint = generateCrashPoint(houseEdge);
  return { crashPoint, startedAt: Date.now() };
}

// multiplier(t) grows ~ e^(t/8) style curve; must match client animation formula
export function crashMultiplierAtElapsed(elapsedMs) {
  const t = elapsedMs / 1000;
  return Math.max(1, Math.round(Math.pow(Math.E, t / 9) * 100) / 100);
}

// ================= VIDEO POKER =================
export function videoPokerDeal(params) {
  const deck = createDeck(1);
  const hand = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
  return { deck, hand };
}

export function videoPokerDraw(state, holds) {
  const newHand = state.hand.map((card, idx) => (holds.includes(idx) ? card : state.deck.pop()));
  return newHand;
}

export { evaluatePokerHand, rankValue };
