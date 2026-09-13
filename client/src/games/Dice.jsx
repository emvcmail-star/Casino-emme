import React, { useState } from 'react';
import { Dice6 } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dice() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [target, setTarget] = useState(50);
  const [direction, setDirection] = useState('under');
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const chance = direction === 'under' ? target : 100 - target;
  const payout = (100 / chance) * 0.96;

  const roll = async () => {
    setError('');
    setRolling(true);
    setResult(null);
    try {
      const data = await api.post('/games/dice/play', { bet, target, direction });
      await new Promise((r) => setTimeout(r, 500));
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier, label: data.details.roll.toFixed(2) });
    } catch (err) {
      setError(err.message);
    } finally {
      setRolling(false);
    }
  };

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={1000} disabled={rolling} />
          <div>
            <label className="label-field">Dirección</label>
            <div className="grid grid-cols-2 gap-1.5">
              {['under', 'over'].map((d) => (
                <button
                  key={d}
                  disabled={rolling}
                  onClick={() => setDirection(d)}
                  className={`rounded-lg py-2 text-sm font-semibold border ${
                    direction === d ? 'bg-electric-500/20 border-electric-400/50 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {d === 'under' ? 'Menos que' : 'Más que'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-field">Objetivo: {target}</label>
            <input
              type="range"
              min={2}
              max={97}
              value={target}
              disabled={rolling}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full accent-electric-500"
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Probabilidad: {chance}%</span>
            <span>Pago: x{payout.toFixed(2)}</span>
          </div>
          <button className="btn-primary w-full" onClick={roll} disabled={rolling}>
            <Dice6 size={18} /> {rolling ? 'Lanzando…' : 'Lanzar dado'}
          </button>
        </>
      }
      table={
        <>
          <div className="text-6xl font-extrabold text-white mb-4 tabular-nums">
            {result ? result.details.roll.toFixed(2) : '00.00'}
          </div>
          <div className="w-full max-w-sm h-3 rounded-full bg-white/10 relative overflow-hidden mb-6">
            <div
              className={`absolute inset-y-0 ${direction === 'under' ? 'left-0 bg-emerald-500/50' : 'right-0 bg-emerald-500/50'}`}
              style={{ width: `${chance}%` }}
            />
            <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: `${target}%` }} />
          </div>
          {result && <ResultBanner result={result} />}
        </>
      }
      history={<LastPlaysList plays={plays} render={(p) => `${p.label} · x${Number(p.multiplier).toFixed(2)}`} />}
    />
  );
}
