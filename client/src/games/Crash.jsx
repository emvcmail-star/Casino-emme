import React, { useEffect, useRef, useState } from 'react';
import { Rocket, Wallet, Flame } from 'lucide-react';
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

const GRAPH_W = 400;
const GRAPH_H = 200;
const GRAPH_DURATION_MS = 12000;

function pointFor(elapsedMs, multiplier) {
  const x = Math.min(GRAPH_W, (elapsedMs / GRAPH_DURATION_MS) * GRAPH_W);
  const y = Math.max(8, GRAPH_H - Math.log(multiplier) * 55);
  return [x, y];
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
  const [points, setPoints] = useState([[0, GRAPH_H]]);
  const startRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const tick = () => {
    const elapsed = Date.now() - startRef.current;
    const mult = multiplierAt(elapsed);
    setLive(mult);
    setPoints((prev) => [...prev, pointFor(elapsed, mult)]);
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
      setPoints([[0, GRAPH_H]]);
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
      const elapsed = Date.now() - startRef.current;
      if (data.crashed) {
        setCrashed(true);
        setLive(data.crashPoint);
        setPoints((prev) => [...prev, pointFor(elapsed, data.crashPoint)]);
        setResult({ outcome: 'loss', multiplier: 0, payout: 0, bet });
        pushPlay({ outcome: 'loss', multiplier: 0 });
      } else {
        setLive(data.multiplier);
        setPoints((prev) => [...prev, pointFor(elapsed, data.multiplier)]);
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
          <div className="relative w-full h-56 overflow-hidden rounded-xl bg-base-950/60 border border-white/5">
            <svg viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {[0.25, 0.5, 0.75].map((f) => (
                <line key={f} x1="0" x2={GRAPH_W} y1={GRAPH_H * f} y2={GRAPH_H * f} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              {points.length > 1 && (
                <>
                  <defs>
                    <linearGradient id="crashFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={crashed ? '#f43f5e' : '#34d399'} stopOpacity="0.35" />
                      <stop offset="100%" stopColor={crashed ? '#f43f5e' : '#34d399'} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`0,${GRAPH_H} ${points.map(([x, y]) => `${x},${y}`).join(' ')} ${points[points.length - 1][0]},${GRAPH_H}`}
                    fill="url(#crashFill)"
                  />
                  <polyline
                    points={points.map(([x, y]) => `${x},${y}`).join(' ')}
                    fill="none"
                    stroke={crashed ? '#f43f5e' : '#34d399'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
            </svg>
            {points.length > 0 && (
              <div
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-none ${
                  crashed ? 'text-crimson-400 rotate-45' : 'text-gold-300 -rotate-12'
                }`}
                style={{
                  left: `${(points[points.length - 1][0] / GRAPH_W) * 100}%`,
                  top: `${(points[points.length - 1][1] / GRAPH_H) * 100}%`,
                }}
              >
                {crashed ? <Flame size={40} strokeWidth={1.6} /> : <Rocket size={40} strokeWidth={1.6} />}
              </div>
            )}
            <div className={`absolute top-3 left-1/2 -translate-x-1/2 text-4xl font-extrabold tabular-nums ${crashed ? 'text-rose-400' : flying ? 'text-emerald-400' : 'text-white'}`}>
              x{live.toFixed(2)}
            </div>
            {crashed && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-full px-3 py-1">
                ¡Explotó!
              </div>
            )}
          </div>
          {result && <div className="mt-4 w-full"><ResultBanner result={result} /></div>}
        </>
      }
      history={<LastPlaysList plays={plays} />}
    />
  );
}
