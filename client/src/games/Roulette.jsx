import React, { useState } from 'react';
import { Dice5 } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export default function Roulette() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState('red');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const spin = async () => {
    setError('');
    setSpinning(true);
    setResult(null);
    try {
      const data = await api.post('/games/roulette/play', { bet, betType });
      await new Promise((r) => setTimeout(r, 1200));
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier, label: data.details.spin });
    } catch (err) {
      setError(err.message);
    } finally {
      setSpinning(false);
    }
  };

  const options = [
    { v: 'red', l: 'Rojo' },
    { v: 'black', l: 'Negro' },
    { v: 'odd', l: 'Impar' },
    { v: 'even', l: 'Par' },
    { v: 'low', l: '1-18' },
    { v: 'high', l: '19-36' },
  ];

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={1000} disabled={spinning} />
          <div>
            <label className="label-field">Tipo de apuesta</label>
            <div className="grid grid-cols-2 gap-1.5">
              {options.map((o) => (
                <button
                  key={o.v}
                  disabled={spinning}
                  onClick={() => setBetType(o.v)}
                  className={`rounded-lg py-2 text-sm font-semibold border ${
                    betType === o.v ? 'bg-electric-500/20 border-electric-400/50 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" onClick={spin} disabled={spinning}>
            <Dice5 size={18} /> {spinning ? 'Girando…' : 'Girar ruleta'}
          </button>
        </>
      }
      table={
        <>
          <div
            className={`w-40 h-40 rounded-full border-8 border-white/10 flex items-center justify-center mb-6 relative bg-gradient-to-br from-white/5 to-transparent ${
              spinning ? 'animate-spin' : ''
            }`}
          >
            <div className="w-24 h-24 rounded-full bg-base-900 flex items-center justify-center text-3xl font-extrabold text-white">
              {result ? result.details.spin : '?'}
            </div>
          </div>
          {result && (
            <p className="text-sm text-slate-400 mb-3">
              Número {result.details.spin} ·{' '}
              {result.details.spin === 0 ? 'Verde' : RED.has(result.details.spin) ? 'Rojo' : 'Negro'}
            </p>
          )}
          {result && <ResultBanner result={result} />}
        </>
      }
      history={<LastPlaysList plays={plays} render={(p) => `${p.label} · x${Number(p.multiplier).toFixed(1)}`} />}
    />
  );
}
