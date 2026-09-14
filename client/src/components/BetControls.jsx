import React from 'react';
import { Coins, Lock } from 'lucide-react';
import { useSound } from '../context/SoundContext.jsx';

export default function BetControls({ bet, setBet, min = 1, max = 1000, disabled }) {
  const { play } = useSound();
  const clamp = (v) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));

  const setBetWithSound = (v) => {
    play('click');
    setBet(v);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="label-field !mb-0">Monto de la apuesta</label>
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Lock size={11} /> {min} – {max}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            value={bet}
            disabled={disabled}
            onChange={(e) => setBet(clamp(Number(e.target.value) || min))}
            className="input-field text-center font-bold pr-9"
          />
          <Coins size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-400 pointer-events-none" />
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setBetWithSound(clamp(bet / 2))}
          className="btn-secondary !px-3.5 !py-2.5 text-xs font-bold"
        >
          ½
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setBetWithSound(clamp(bet * 2))}
          className="btn-secondary !px-3.5 !py-2.5 text-xs font-bold"
        >
          2X
        </button>
      </div>
    </div>
  );
}
