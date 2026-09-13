import React from 'react';
import { Minus, Plus } from 'lucide-react';

export default function BetControls({ bet, setBet, min = 1, max = 1000, disabled }) {
  const step = bet < 10 ? 1 : bet < 100 ? 5 : 25;
  const clamp = (v) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));

  const chips = Array.from(
    new Set([min, Math.round(min * 10), Math.round(min * 100), max].map((v) => clamp(v)))
  ).slice(0, 4);

  return (
    <div>
      <label className="label-field">Apuesta (créditos virtuales)</label>
      <div className="flex items-center gap-2 mb-2">
        {chips.map((v) => (
          <button
            key={v}
            type="button"
            disabled={disabled}
            onClick={() => setBet(v)}
            title={`${v} créditos`}
            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-[9px] font-extrabold shrink-0 transition-all disabled:opacity-30 ${
              bet === v
                ? 'bg-gradient-to-br from-gold-300 to-gold-600 border-gold-200 text-base-950 shadow-glow'
                : 'bg-gradient-to-br from-base-700 to-base-800 border-white/20 text-slate-300 hover:border-gold-400/50'
            }`}
          >
            {v >= 1000 ? `${Math.round(v / 1000)}k` : v}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={disabled}
          onClick={() => setBet(clamp(bet - step))}
          className="btn-secondary !px-3 !py-2.5"
        >
          <Minus size={16} />
        </button>
        <input
          type="number"
          value={bet}
          disabled={disabled}
          onChange={(e) => setBet(clamp(Number(e.target.value) || min))}
          className="input-field text-center font-bold"
        />
        <button
          disabled={disabled}
          onClick={() => setBet(clamp(bet + step))}
          className="btn-secondary !px-3 !py-2.5"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[0.5, 2, 'max'].map((mult) => (
          <button
            key={mult}
            disabled={disabled}
            onClick={() => setBet(clamp(mult === 'max' ? max : bet * mult))}
            className="btn-secondary !py-1 !px-2.5 text-xs flex-1"
          >
            {mult === 'max' ? 'MAX' : mult === 0.5 ? '½' : `x${mult}`}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-slate-500 mt-1.5">
        Límites: {min} – {max} créditos
      </p>
    </div>
  );
}
