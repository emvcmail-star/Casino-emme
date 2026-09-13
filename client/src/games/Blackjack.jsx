import React, { useState } from 'react';
import { Play, Plus, Hand as HandIcon, Copy } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function Cards({ cards }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {cards?.map((c, i) =>
        c.hidden ? (
          <div key={i} className="w-11 h-16 rounded-md bg-gradient-to-br from-electric-600 to-electric-800 border border-white/20" />
        ) : (
          <div key={i} className="w-11 h-16 rounded-md bg-white text-slate-900 flex items-center justify-center text-sm font-bold shadow">
            {c.rank}
            {c.suit}
          </div>
        )
      )}
    </div>
  );
}

function handTotal(cards) {
  if (!cards) return 0;
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.hidden) continue;
    if (c.rank === 'A') {
      total += 11;
      aces++;
    } else if (['K', 'Q', 'J'].includes(c.rank)) total += 10;
    else total += Number(c.rank);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export default function Blackjack() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [session, setSession] = useState(null);
  const [hand, setHand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const deal = async () => {
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await api.post('/games/blackjack/deal', { bet });
      updateCredits(data.newBalance);
      setHand({ player: data.player, dealer: data.dealer });
      if (data.finished) {
        setSession(null);
        setResult({ ...data, bet });
        pushPlay({ outcome: data.outcome, multiplier: data.multiplier });
      } else {
        setSession(data.sessionId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const act = async (action) => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await api.post(`/games/blackjack/${action}`, { sessionId: session });
      setHand({ player: data.player, dealer: data.dealer });
      if (data.finished) {
        setSession(null);
        updateCredits(data.newBalance);
        setResult({ ...data, bet });
        pushPlay({ outcome: data.outcome, multiplier: data.multiplier });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inRound = !!session;

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={1000} disabled={inRound || loading} />
          {!inRound ? (
            <button className="btn-primary w-full" onClick={deal} disabled={loading}>
              <Play size={18} /> {loading ? 'Repartiendo…' : 'Repartir'}
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              <button className="btn-secondary !py-2 text-sm" onClick={() => act('hit')} disabled={loading}>
                <Plus size={15} /> Pedir
              </button>
              <button className="btn-secondary !py-2 text-sm" onClick={() => act('stand')} disabled={loading}>
                <HandIcon size={15} /> Plantarse
              </button>
              <button className="btn-secondary !py-2 text-sm" onClick={() => act('double')} disabled={loading}>
                <Copy size={15} /> Doblar
              </button>
            </div>
          )}
        </>
      }
      table={
        <>
          <div className="mb-6 text-center">
            <p className="text-xs text-slate-500 mb-1.5">Dealer {hand ? `(${handTotal(hand.dealer)})` : ''}</p>
            <Cards cards={hand?.dealer} />
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1.5">Tú {hand ? `(${handTotal(hand.player)})` : ''}</p>
            <Cards cards={hand?.player} />
          </div>
          {result && <div className="mt-6 w-full"><ResultBanner result={result} /></div>}
        </>
      }
      history={<LastPlaysList plays={plays} />}
    />
  );
}
