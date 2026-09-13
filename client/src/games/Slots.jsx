import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Slots() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState(['🍒', '🍋', '🔔']);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const spin = async () => {
    setError('');
    setSpinning(true);
    setResult(null);
    try {
      const spinInterval = setInterval(() => {
        setReels([randSym(), randSym(), randSym()]);
      }, 80);

      const data = await api.post('/games/slots/play', { bet });
      await sleep(900);
      clearInterval(spinInterval);

      setReels(data.details.reels);
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier });
    } catch (err) {
      setError(err.message);
    } finally {
      setSpinning(false);
    }
  };

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={500} disabled={spinning} />
          <button className="btn-primary w-full" onClick={spin} disabled={spinning}>
            <Sparkles size={18} /> {spinning ? 'Girando…' : 'Girar'}
          </button>
          <p className="text-xs text-slate-500">3 símbolos iguales pagan según su valor. 2 iguales dan una pequeña recompensa.</p>
        </>
      }
      table={
        <>
          <div className="flex gap-3 mb-6">
            {reels.map((s, i) => (
              <div
                key={i}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center text-5xl shadow-inner ${
                  spinning ? 'animate-pulse' : ''
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          {result && <ResultBanner result={result} />}
        </>
      }
      history={<LastPlaysList plays={plays} />}
    />
  );
}

const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
function randSym() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
