import React, { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function VideoPoker() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [session, setSession] = useState(null);
  const [hand, setHand] = useState(null);
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const deal = async () => {
    setError('');
    setLoading(true);
    setResult(null);
    setHolds([]);
    try {
      const data = await api.post('/games/videopoker/deal', { bet });
      updateCredits(data.newBalance);
      setSession(data.sessionId);
      setHand(data.hand);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleHold = (i) => {
    if (!session) return;
    setHolds((h) => (h.includes(i) ? h.filter((x) => x !== i) : [...h, i]));
  };

  const draw = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await api.post('/games/videopoker/draw', { sessionId: session, holds });
      setHand(data.finalHand);
      setSession(null);
      updateCredits(data.newBalance);
      setResult({ outcome: data.multiplier > 0 ? 'win' : 'loss', multiplier: data.multiplier, payout: data.payout, bet, handName: data.handName });
      pushPlay({ outcome: data.multiplier > 0 ? 'win' : 'loss', multiplier: data.multiplier, label: data.handName });
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
          <BetControls bet={bet} setBet={setBet} min={1} max={500} disabled={inRound || loading} />
          {!inRound ? (
            <button className="btn-primary w-full" onClick={deal} disabled={loading}>
              <Play size={18} /> {loading ? 'Repartiendo…' : 'Repartir'}
            </button>
          ) : (
            <button className="btn-primary w-full" onClick={draw} disabled={loading}>
              <RotateCcw size={18} /> Cambiar cartas no retenidas
            </button>
          )}
          <div className="text-xs text-slate-500 space-y-0.5">
            <p>Escalera real: x800 · Escalera de color: x50</p>
            <p>Póker: x25 · Full: x9 · Color: x6 · Escalera: x4</p>
            <p>Trío: x3 · Doble par: x2 · Pareja J+: x1</p>
          </div>
        </>
      }
      table={
        <>
          <div className="flex gap-2 mb-6">
            {(hand || Array.from({ length: 5 })).map((c, i) => (
              <button
                key={i}
                onClick={() => toggleHold(i)}
                disabled={!inRound}
                className={`w-16 h-24 rounded-lg flex flex-col items-center justify-center font-bold shadow transition-all ${
                  c ? 'bg-white text-slate-900' : 'bg-white/5 border border-white/10'
                } ${holds.includes(i) ? 'ring-2 ring-electric-400 -translate-y-2' : ''}`}
              >
                {c ? (
                  <span className={c.suit === '♥' || c.suit === '♦' ? 'text-rose-600' : ''}>
                    {c.rank}
                    {c.suit}
                  </span>
                ) : (
                  ''
                )}
              </button>
            ))}
          </div>
          {inRound && <p className="text-xs text-slate-500 mb-4">Toca las cartas que quieres conservar</p>}
          {result && (
            <>
              <p className="text-sm text-slate-400 mb-2">Mano: {result.handName}</p>
              <ResultBanner result={result} />
            </>
          )}
        </>
      }
      history={<LastPlaysList plays={plays} render={(p) => p.label} />}
    />
  );
}
