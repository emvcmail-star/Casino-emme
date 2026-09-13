import React, { useState } from 'react';
import { Coins } from 'lucide-react';
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
                    choice === o.v ? 'bg-electric-500/20 border-electric-400/50 text-white' : 'bg-white/5 border-white/10 text-slate-400'
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
          <div
            className={`w-32 h-32 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-5xl shadow-glow mb-6 ${
              flipping ? 'animate-spin-slow' : ''
            }`}
          >
            {result ? (result.details.result === 'heads' ? '👑' : '⚡') : '🪙'}
          </div>
          {result && <ResultBanner result={result} />}
        </>
      }
      history={<LastPlaysList plays={plays} render={(p) => `${p.label === 'heads' ? 'Cara' : 'Cruz'}`} />}
    />
  );
}
