import React, { useEffect, useRef, useState } from 'react';
import { Rocket, Wallet } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function multiplierAt(elapsedMs) {
  const t = elapsedMs / 1000;
  return Math.max(1, Math.pow(Math.E, t / 9));
}

export default function Crash() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [session, setSession] = useState(null);
  const [live, setLive] = useState(1);
  const [flying, setFlying] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();
  const startRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const tick = () => {
    const elapsed = Date.now() - startRef.current;
    setLive(multiplierAt(elapsed));
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = async () => {
    setError('');
    setResult(null);
    setCrashed(false);
    setLoading(true);
    try {
      const data = await api.post('/games/crash/start', { bet });
      updateCredits(data.newBalance);
      setSession(data.sessionId);
      startRef.current = Date.now();
      setLive(1);
      setFlying(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cashout = async () => {
    if (!session) return;
    cancelAnimationFrame(rafRef.current);
    setFlying(false);
    setLoading(true);
    try {
      const data = await api.post('/games/crash/cashout', { sessionId: session });
      setSession(null);
      updateCredits(data.newBalance);
      if (data.crashed) {
        setCrashed(true);
        setLive(data.crashPoint);
        setResult({ outcome: 'loss', multiplier: 0, payout: 0, bet });
        pushPlay({ outcome: 'loss', multiplier: 0 });
      } else {
        setLive(data.multiplier);
        setResult({ outcome: 'win', multiplier: data.multiplier, payout: data.payout, bet });
        pushPlay({ outcome: 'win', multiplier: data.multiplier });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={500} disabled={flying || loading} />
          {!flying ? (
            <button className="btn-primary w-full" onClick={start} disabled={loading}>
              <Rocket size={18} /> {loading ? 'Despegando…' : 'Apostar y despegar'}
            </button>
          ) : (
            <button className="btn-danger w-full animate-pulse-glow" onClick={cashout} disabled={loading}>
              <Wallet size={18} /> Retirar en x{live.toFixed(2)}
            </button>
          )}
          <p className="text-xs text-slate-500">Retira antes de que la nave explote para asegurar tu multiplicador.</p>
        </>
      }
      table={
        <>
          <div className="relative w-full h-56 flex items-center justify-center overflow-hidden">
            <div
              className={`text-6xl transition-transform duration-100 ${flying ? '-translate-y-10' : ''} ${crashed ? 'opacity-20 rotate-45' : ''}`}
            >
              {crashed ? '💥' : '🚀'}
            </div>
          </div>
          <div className={`text-5xl font-extrabold tabular-nums ${crashed ? 'text-rose-400' : flying ? 'text-emerald-400' : 'text-white'}`}>
            x{live.toFixed(2)}
          </div>
          {result && <div className="mt-4 w-full"><ResultBanner result={result} /></div>}
        </>
      }
      history={<LastPlaysList plays={plays} />}
    />
  );
}
