import React, { useState } from 'react';
import { CircleDot } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Plinko() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [risk, setRisk] = useState('medium');
  const [dropping, setDropping] = useState(false);
  const [ballPos, setBallPos] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const drop = async () => {
    setError('');
    setDropping(true);
    setResult(null);
    setBallPos(null);
    try {
      const data = await api.post('/games/plinko/play', { bet, risk });
      let x = 5; // start centered out of 10 columns
      const path = data.details.path;
      for (let i = 0; i < path.length; i++) {
        await new Promise((r) => setTimeout(r, 90));
        x += path[i] === 'R' ? 0.5 : -0.5;
        setBallPos({ row: i + 1, x });
      }
      await new Promise((r) => setTimeout(r, 200));
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier });
    } catch (err) {
      setError(err.message);
    } finally {
      setDropping(false);
    }
  };

  const table = { low: [8, 3, 1.5, 1.2, 1, 0.5, 1, 1.2, 1.5, 3, 8], medium: [15, 5, 2, 1.3, 0.7, 0.4, 0.7, 1.3, 2, 5, 15], high: [43, 10, 3, 1.3, 0.4, 0.2, 0.4, 1.3, 3, 10, 43] }[risk];

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={500} disabled={dropping} />
          <div>
            <label className="label-field">Riesgo</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['low', 'medium', 'high'].map((r) => (
                <button
                  key={r}
                  disabled={dropping}
                  onClick={() => setRisk(r)}
                  className={`rounded-lg py-2 text-xs font-semibold border capitalize ${
                    risk === r ? 'bg-gold-500/20 border-gold-400/50 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" onClick={drop} disabled={dropping}>
            <CircleDot size={18} /> {dropping ? 'Cayendo…' : 'Soltar bola'}
          </button>
        </>
      }
      table={
        <>
          <div className="relative w-full max-w-md h-52 mb-4">
            {ballPos && (
              <div
                className="absolute w-4 h-4 rounded-full bg-amber-300 shadow-glow transition-all duration-100"
                style={{
                  left: `${(ballPos.x / 10) * 100}%`,
                  top: `${(ballPos.row / 10) * 85}%`,
                  transform: 'translateX(-50%)',
                }}
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between gap-0.5">
              {table.map((m, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center text-[10px] font-bold py-1.5 rounded ${m >= 5 ? 'bg-amber-400/20 text-amber-300' : m >= 1 ? 'bg-gold-400/15 text-gold-300' : 'bg-white/5 text-slate-500'}`}
                >
                  {m}x
                </div>
              ))}
            </div>
          </div>
          {result && <ResultBanner result={result} />}
        </>
      }
      history={<LastPlaysList plays={plays} />}
    />
  );
}
