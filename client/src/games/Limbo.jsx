import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Limbo() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [target, setTarget] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const play = async () => {
    setError('');
    setPlaying(true);
    setResult(null);
    try {
      const data = await api.post('/games/limbo/play', { bet, targetMultiplier: target });
      await new Promise((r) => setTimeout(r, 700));
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier, label: data.details.result.toFixed(2) });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlaying(false);
    }
  };

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={1000} disabled={playing} />
          <div>
            <label className="label-field">Multiplicador objetivo</label>
            <input
              type="number"
              step="0.01"
              min={1.01}
              className="input-field"
              value={target}
              disabled={playing}
              onChange={(e) => setTarget(Math.max(1.01, Number(e.target.value)))}
            />
          </div>
          <p className="text-xs text-slate-500">Ganas si el resultado generado es ≥ a tu objetivo.</p>
          <button className="btn-primary w-full" onClick={play} disabled={playing}>
            <TrendingUp size={18} /> {playing ? 'Calculando…' : 'Jugar'}
          </button>
        </>
      }
      table={
        <>
          <div className={`text-6xl font-extrabold mb-4 tabular-nums ${result ? (result.outcome === 'win' ? 'text-emerald-400' : 'text-rose-400') : 'text-white'}`}>
            {result ? `${result.details.result.toFixed(2)}x` : '—'}
          </div>
          <p className="text-sm text-slate-500 mb-6">Objetivo: x{Number(target).toFixed(2)}</p>
          {result && <ResultBanner result={result} />}
        </>
      }
      history={<LastPlaysList plays={plays} render={(p) => `${p.label}x`} />}
    />
  );
}
