import React, { useState } from 'react';
import { Grid3x3 } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const NUMBERS = Array.from({ length: 40 }, (_, i) => i + 1);

export default function Keno() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [picks, setPicks] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const togglePick = (n) => {
    if (drawing) return;
    setPicks((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length < 10 ? [...p, n] : p));
  };

  const draw = async () => {
    if (picks.length === 0) return setError('Elige al menos un número');
    setError('');
    setDrawing(true);
    setResult(null);
    try {
      const data = await api.post('/games/keno/play', { bet, picks });
      await new Promise((r) => setTimeout(r, 700));
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier, label: `${data.details.matches}/${picks.length}` });
    } catch (err) {
      setError(err.message);
    } finally {
      setDrawing(false);
    }
  };

  const drawn = result?.details.drawn || [];

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={500} disabled={drawing} />
          <p className="text-xs text-slate-500">Elige hasta 10 números (elegidos: {picks.length})</p>
          <button className="btn-primary w-full" onClick={draw} disabled={drawing}>
            <Grid3x3 size={18} /> {drawing ? 'Sorteando…' : 'Sortear'}
          </button>
          <button className="btn-secondary w-full text-xs" onClick={() => setPicks([])} disabled={drawing}>
            Limpiar selección
          </button>
        </>
      }
      table={
        <>
          <div className="grid grid-cols-8 gap-1.5 mb-4">
            {NUMBERS.map((n) => {
              const picked = picks.includes(n);
              const hit = drawn.includes(n);
              return (
                <button
                  key={n}
                  onClick={() => togglePick(n)}
                  disabled={drawing}
                  className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center border transition-all
                    ${picked ? 'bg-gold-500/30 border-gold-400/60 text-white' : 'bg-white/5 border-white/10 text-slate-400'}
                    ${hit && picked ? 'ring-2 ring-emerald-400' : ''}
                    ${hit && !picked ? 'bg-amber-400/20 border-amber-400/40' : ''}
                  `}
                >
                  {n}
                </button>
              );
            })}
          </div>
          {result && <ResultBanner result={result} />}
        </>
      }
      history={<LastPlaysList plays={plays} render={(p) => `${p.label} aciertos`} />}
    />
  );
}
