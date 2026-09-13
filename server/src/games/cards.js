import { shuffle } from './rng.js';

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createDeck(numDecks = 1) {
  const deck = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank, suit, code: `${rank}${suit}` });
      }
    }
  }
  return shuffle(deck);
}

export function rankValue(rank) {
  // High-card comparison value (2..14), Ace high
  if (rank === 'A') return 14;
  if (rank === 'K') return 13;
  if (rank === 'Q') return 12;
  if (rank === 'J') return 11;
  return Number(rank);
}

export function blackjackCardValue(rank) {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  return Number(rank);
}

export function blackjackHandValue(cards) {
  let total = cards.reduce((sum, c) => sum + blackjackCardValue(c.rank), 0);
  let aces = cards.filter((c) => c.rank === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

export function baccaratCardValue(rank) {
  if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
  if (rank === 'A') return 1;
  return Number(rank);
}

export function baccaratHandValue(cards) {
  const sum = cards.reduce((s, c) => s + baccaratCardValue(c.rank), 0);
  return sum % 10;
}

// Basic 5-card poker hand evaluator for Jacks-or-Better video poker
export function evaluatePokerHand(cards) {
  const ranks = cards.map((c) => rankValue(c.rank)).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);
  const uniqueRanks = [...new Set(ranks)];
  let isStraight = false;
  if (uniqueRanks.length === 5) {
    isStraight = ranks[4] - ranks[0] === 4;
    // Wheel straight A-2-3-4-5
    if (!isStraight && JSON.stringify(ranks) === JSON.stringify([2, 3, 4, 5, 14])) isStraight = true;
  }
  const counts = {};
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
  const countValues = Object.values(counts).sort((a, b) => b - a);
  const pairRankIsJacksOrBetter = Object.entries(counts).some(
    ([rank, count]) => count === 2 && Number(rank) >= 11
  );

  if (isStraight && isFlush && ranks[4] === 14 && ranks[0] === 10) return { name: 'Royal Flush', mult: 800 };
  if (isStraight && isFlush) return { name: 'Straight Flush', mult: 50 };
  if (countValues[0] === 4) return { name: 'Four of a Kind', mult: 25 };
  if (countValues[0] === 3 && countValues[1] === 2) return { name: 'Full House', mult: 9 };
  if (isFlush) return { name: 'Flush', mult: 6 };
  if (isStraight) return { name: 'Straight', mult: 4 };
  if (countValues[0] === 3) return { name: 'Three of a Kind', mult: 3 };
  if (countValues[0] === 2 && countValues[1] === 2) return { name: 'Two Pair', mult: 2 };
  if (countValues[0] === 2 && pairRankIsJacksOrBetter) return { name: 'Jacks or Better', mult: 1 };
  return { name: 'No Pair', mult: 0 };
}
