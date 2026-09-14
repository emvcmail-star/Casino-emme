import confetti from 'canvas-confetti';

function accentHex(varName, fallback) {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return fallback;
  const [r, g, b] = raw.split(/\s+/).map(Number);
  if ([r, g, b].some(Number.isNaN)) return fallback;
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

export function smallWinConfetti() {
  const main = accentHex('--gold-500', '#d4af37');
  const light = accentHex('--gold-300', '#f3dc9a');
  confetti({
    particleCount: 40,
    spread: 70,
    origin: { y: 0.6 },
    colors: [main, light, '#34d399'],
    scalar: 0.8,
  });
}

export function bigWinConfetti() {
  const duration = 2200;
  const end = Date.now() + duration;
  const main = accentHex('--gold-500', '#d4af37');
  const light = accentHex('--gold-300', '#f3dc9a');
  const colors = [main, light, '#ffffff', '#b3273a'];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 65,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 65,
      origin: { x: 1 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.4 },
    colors,
  });
}
