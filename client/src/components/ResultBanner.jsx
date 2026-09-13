import React, { useEffect } from 'react';
import { Trophy, Frown, Equal } from 'lucide-react';
import { bigWinConfetti } from './confetti.js';

export default function ResultBanner({ result }) {
  useEffect(() => {
    if (result && result.outcome === 'win' && result.payout >= (result.bet || 0) * 5) {
      bigWinConfetti();
    }
  }, [result]);

  if (!result) return null;

  const { outcome, payout, multiplier } = result;
  const styles = {
    win: 'from-emerald-500/20 to-emerald-400/5 border-emerald-400/30 text-emerald-300',
    loss: 'from-rose-500/20 to-rose-400/5 border-rose-400/30 text-rose-300',
    push: 'from-slate-500/20 to-slate-400/5 border-slate-400/30 text-slate-300',
  };
  const icons = { win: Trophy, loss: Frown, push: Equal };
  const Icon = icons[outcome] || Icon;
  const labels = { win: '¡Ganaste!', loss: 'Perdiste', push: 'Empate' };

  return (
    <div
      className={`animate-slide-up rounded-2xl border bg-gradient-to-br p-4 flex items-center gap-4 ${styles[outcome] || styles.loss}`}
    >
      <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="font-bold text-lg leading-none">{labels[outcome] || outcome}</p>
        <p className="text-sm text-slate-300 mt-1">
          Multiplicador x{Number(multiplier).toFixed(2)} · Pago {Number(payout).toLocaleString('es-ES')} créditos
        </p>
      </div>
    </div>
  );
}
