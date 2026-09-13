import confetti from 'canvas-confetti';

export function smallWinConfetti() {
  confetti({
    particleCount: 40,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#d4af37', '#f3dc9a', '#34d399'],
    scalar: 0.8,
  });
}

export function bigWinConfetti() {
  const duration = 2200;
  const end = Date.now() + duration;
  const colors = ['#d4af37', '#f3dc9a', '#ffffff', '#b3273a'];

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
