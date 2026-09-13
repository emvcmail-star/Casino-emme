import crypto from 'node:crypto';

// Uniform random float in [0, 1) using crypto for better randomness quality than Math.random
export function rand() {
  return crypto.randomInt(0, 1_000_000_000) / 1_000_000_000;
}

export function randInt(min, max) {
  // inclusive min, inclusive max
  return min + Math.floor(rand() * (max - min + 1));
}

export function pickWeighted(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Industry-style "crash point" generator driven by a configurable house edge.
// houseEdge = 0.04 means long-run RTP ~96%.
export function generateCrashPoint(houseEdge = 0.04) {
  const r = Math.max(rand(), 1e-9);
  const raw = (1 - houseEdge) / r;
  const point = Math.max(1, Math.floor(raw * 100) / 100);
  return Math.min(point, 10000); // cap for sanity
}
