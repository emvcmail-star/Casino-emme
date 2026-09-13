import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import PlayingCard from '../components/PlayingCard.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function Hand({ cards, label }) {
  return (
    <div className="text-center">
      <p className="text-xs text-emerald-200/60 mb-1.5 tracking-wide uppercase">{label}</p>
      <div className="flex gap-1.5 justify-center">
        {cards?.map((c, i) => (
          <PlayingCard key={i} rank={c.rank} suit={c.suit} className="w-10 h-14" />
        ))}
      </div>
    </div>
  );
}

export default function Baccarat() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState('player');
  const [dealing, setDealing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const deal = async () => {
    setError('');
    setDealing(true);
    setResult(null);
    try {
      const data = await api.post('/games/baccarat/play', { bet, betType });
      await new Promise((r) => setTimeout(r, 800));
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier, label: data.details.winner });
    } catch (err) {
      setError(err.message);
    } finally {
      setDealing(false);
    }
  };

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={1000} disabled={dealing} />
          <div>
            <label className="label-field">Apuesta</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { v: 'player', l: 'Jugador' },
                { v: 'banker', l: 'Banca' },
                { v: 'tie', l: 'Empate' },
              ].map((o) => (
                <button
                  key={o.v}
                  disabled={dealing}
                  onClick={() => setBetType(o.v)}
                  className={`rounded-lg py-2 text-xs font-semibold border ${
                    betType === o.v ? 'bg-gold-500/20 border-gold-400/50 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" onClick={deal} disabled={dealing}>
            <Layers size={18} /> {dealing ? 'Repartiendo…' : 'Repartir'}
          </button>
        </>
      }
      table={
        <div className="felt-table w-full min-h-[280px] flex flex-col items-center justify-center py-8 px-4">
          <div className="ribbon mb-8">BACCARAT</div>
          <div className="flex gap-10 mb-6">
            <Hand cards={result?.details.playerHand} label={`Jugador (${result?.details.playerValue ?? ''})`} />
            <Hand cards={result?.details.bankerHand} label={`Banca (${result?.details.bankerValue ?? ''})`} />
          </div>
          {result && <div className="w-full max-w-xs"><ResultBanner result={result} /></div>}
        </div>
      }
      history={<LastPlaysList plays={plays} render={(p) => p.label} />}
    />
  );
}
