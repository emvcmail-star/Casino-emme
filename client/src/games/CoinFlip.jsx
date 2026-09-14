import React, { useMemo, useState } from 'react';
import { Coins, Crown, Zap } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CoinFlip() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const winStreak = useMemo(() => {
    let n = 0;
    for (const p of plays) {
      if (p.outcome !== 'win') break;
      n += 1;
    }
    return n;
  }, [plays]);

  const flip = async () => {
    setError('');
    setFlipping(true);
    setResult(null);
    try {
      const data = await api.post('/games/coinflip/play', { bet, choice });
      await new Promise((r) => setTimeout(r, 900));
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier, label: data.details.result });
    } catch (err) {
      setError(err.message);
    } finally {
      setFlipping(false);
    }
  };

  return (
    <GameShell
      error={error}
      idle={!result}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={1000} disabled={flipping} />
          <div>
            <label className="label-field">Elige tu lado</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { v: 'heads', l: 'Cara' },
                { v: 'tails', l: 'Cruz' },
              ].map((o) => (
                <button
                  key={o.v}
                  disabled={flipping}
                  onClick={() => setChoice(o.v)}
                  className={`rounded-lg py-2 text-sm font-semibold border ${
                    choice === o.v ? 'bg-gold-500/20 border-gold-400/50 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" onClick={flip} disabled={flipping}>
            <Coins size={18} /> {flipping ? 'Lanzando…' : 'Lanzar moneda'}
          </button>
          <p className="text-xs text-slate-500">Pago x1.96 (house edge ~4%)</p>
        </>
      }
      table={
        <>
          <div className="flex items-center gap-5 sm:gap-8">
            <div className="glass-card !bg-white/[0.03] px-4 py-2.5 text-center w-20 shrink-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Serie</p>
              <p className="text-lg font-extrabold text-emerald-400 tabular-nums">{winStreak}</p>
            </div>

            <div
              className={`w-32 h-32 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center shadow-glow text-base-950 ${
                flipping ? 'animate-spin-slow' : ''
              }`}
            >
              {result ? (
                result.details.result === 'heads' ? <Crown size={48} strokeWidth={1.75} /> : <Zap size={48} strokeWidth={1.75} />
              ) : (
                <Coins size={48} strokeWidth={1.75} />
              )}
            </div>

            <div className="glass-card !bg-white/[0.03] px-4 py-2.5 text-center w-20 shrink-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Coef.</p>
              <p className="text-lg font-extrabold text-gold-300 tabular-nums">x{result ? Number(result.multiplier).toFixed(2) : '0.00'}</p>
            </div>
          </div>
          {result && <div className="mt-6"><ResultBanner result={result} /></div>}
        </>
      }
      history={<LastPlaysList plays={plays} render={(p) => `${p.label === 'heads' ? 'Cara' : 'Cruz'}`} />}
    />
  );
}
