import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Wallet, Play } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function Card({ card, hidden }) {
  if (!card || hidden) return <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-electric-600 to-electric-800 border border-white/20" />;
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div className={`w-16 h-24 rounded-lg bg-white flex items-center justify-center text-2xl font-bold shadow ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
      {card.rank}
      {card.suit}
    </div>
  );
}

export default function HiLo() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [session, setSession] = useState(null);
  const [current, setCurrent] = useState(null);
  const [next, setNext] = useState(null);
  const [multiplier, setMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const start = async () => {
    setError('');
    setLoading(true);
    setResult(null);
    setNext(null);
    setMultiplier(1);
    try {
      const data = await api.post('/games/hilo/start', { bet });
      updateCredits(data.newBalance);
      setSession(data.sessionId);
      setCurrent(data.currentCard);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const guess = async (g) => {
    if (!session || loading) return;
    setLoading(true);
    try {
      const data = await api.post('/games/hilo/guess', { sessionId: session, guess: g });
      setNext(data.nextCard);
      if (!data.correct) {
        setSession(null);
        setResult({ outcome: 'loss', multiplier: 0, payout: data.payout, bet });
        pushPlay({ outcome: 'loss', multiplier: 0 });
      } else {
        setMultiplier(data.multiplier);
        if (data.finished) {
          setSession(null);
          updateCredits(data.newBalance);
          setResult({ outcome: 'win', multiplier: data.multiplier, payout: data.payout, bet });
          pushPlay({ outcome: 'win', multiplier: data.multiplier });
        } else {
          setTimeout(() => {
            setCurrent(data.nextCard);
            setNext(null);
          }, 700);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cashout = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await api.post('/games/hilo/cashout', { sessionId: session });
      setSession(null);
      updateCredits(data.newBalance);
      setResult({ outcome: 'win', multiplier: data.multiplier, payout: data.payout, bet });
      pushPlay({ outcome: 'win', multiplier: data.multiplier });
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
            <button className="btn-primary w-full" onClick={start} disabled={loading}>
              <Play size={18} /> {loading ? 'Repartiendo…' : 'Repartir carta'}
            </button>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                <button className="btn-secondary !py-2.5" onClick={() => guess('higher')} disabled={loading}>
                  <ArrowUp size={16} /> Mayor
                </button>
                <button className="btn-secondary !py-2.5" onClick={() => guess('lower')} disabled={loading}>
                  <ArrowDown size={16} /> Menor
                </button>
              </div>
              <div className="glass-card !bg-emerald-500/10 border-emerald-400/20 p-3 text-center">
                <p className="text-xs text-slate-400">Multiplicador</p>
                <p className="text-2xl font-extrabold text-emerald-300">x{multiplier.toFixed(2)}</p>
              </div>
              <button className="btn-primary w-full" onClick={cashout} disabled={loading}>
                <Wallet size={18} /> Retirar créditos
              </button>
            </>
          )}
        </>
      }
      table={
        <>
          <div className="flex gap-6 items-center mb-6">
            <Card card={current} />
            <span className="text-2xl text-slate-600">→</span>
            <Card card={next} hidden={!next} />
          </div>
          {result && <ResultBanner result={result} />}
        </>
      }
      history={<LastPlaysList plays={plays} />}
    />
  );
}
