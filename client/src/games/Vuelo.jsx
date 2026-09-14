import React, { useEffect, useRef, useState } from 'react';
import { Wallet } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import PlaneIcon from './PlaneIcon.jsx';
import Cloud from './Cloud.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

function multiplierAt(elapsedMs) {
  const t = elapsedMs / 1000;
  return Math.max(1, Math.pow(Math.E, t / 9));
}

// Movimiento tipo "bounce runner": el avión pega saltos parabólicos
// continuos en vez de subir por una curva suave.
const BOUNCE_MS = 620; // duración de un salto completo
const HOPS_PER_LAP = 3; // saltos antes de reiniciar el recorrido horizontal
const LAP_MS = BOUNCE_MS * HOPS_PER_LAP;
const GROUND_PCT = 80;
const HOP_HEIGHT_PCT = 52;
const X_START = 10;
const X_END = 90;

function bounceAt(elapsedMs) {
  const lapT = elapsedMs % LAP_MS;
  const xPct = X_START + (lapT / LAP_MS) * (X_END - X_START);
  const hopT = (elapsedMs % BOUNCE_MS) / BOUNCE_MS;
  const arc = 4 * hopT * (1 - hopT); // 0 -> 1 -> 0, parábola de salto
  const yPct = GROUND_PCT - arc * HOP_HEIGHT_PCT;
  const rot = (0.5 - hopT) * 46;
  return { xPct, yPct, rot };
}

const CLOUDS = [
  { top: '10%', w: 60, h: 22, dur: '26s', delay: '0s', op: 0.5 },
  { top: '22%', w: 44, h: 16, dur: '34s', delay: '-8s', op: 0.35 },
  { top: '40%', w: 36, h: 14, dur: '22s', delay: '-4s', op: 0.3 },
];

export default function Vuelo() {
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
  const [pos, setPos] = useState({ xPct: X_START, yPct: GROUND_PCT, rot: 0 });
  const startRef = useRef(0);
  const rafRef = useRef(null);
  const pollRef = useRef(null);
  const sessionRef = useRef(null);
  const settlingRef = useRef(false);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(pollRef.current);
    },
    []
  );

  const tick = () => {
    const elapsed = Date.now() - startRef.current;
    setLive(multiplierAt(elapsed));
    setPos(bounceAt(elapsed));
    rafRef.current = requestAnimationFrame(tick);
  };

  const settle = async (auto) => {
    if (!sessionRef.current || settlingRef.current) return;
    settlingRef.current = true;
    const sid = sessionRef.current;
    sessionRef.current = null;
    cancelAnimationFrame(rafRef.current);
    clearInterval(pollRef.current);
    setFlying(false);
    setSession(null);
    if (!auto) setLoading(true);
    try {
      const data = await api.post('/games/vuelo/cashout', { sessionId: sid });
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
      settlingRef.current = false;
    }
  };

  const start = async () => {
    setError('');
    setResult(null);
    setCrashed(false);
    setLoading(true);
    try {
      const data = await api.post('/games/vuelo/start', { bet });
      updateCredits(data.newBalance);
      setSession(data.sessionId);
      sessionRef.current = data.sessionId;
      startRef.current = Date.now();
      setLive(1);
      setPos({ xPct: X_START, yPct: GROUND_PCT, rot: 0 });
      setFlying(true);
      rafRef.current = requestAnimationFrame(tick);
      pollRef.current = setInterval(async () => {
        if (!sessionRef.current) return;
        try {
          const status = await api.post('/games/vuelo/status', { sessionId: sessionRef.current });
          if (status.crashed) settle(true);
        } catch {
          // sesión expirada u otro error: se resolverá cuando el jugador intente retirar
        }
      }, 250);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cashout = () => settle(false);

  return (
    <GameShell
      error={error}
      idle={!flying && !result}
      idleMessage="Apuesta y despega cuando quieras"
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={500} disabled={flying || loading} />
          {!flying ? (
            <button className="btn-primary w-full" onClick={start} disabled={loading}>
              <PlaneIcon size={18} /> {loading ? 'Despegando…' : 'Apostar y despegar'}
            </button>
          ) : (
            <button className="btn-danger w-full animate-pulse-glow" onClick={cashout} disabled={loading}>
              <Wallet size={18} /> Retirar en x{live.toFixed(2)}
            </button>
          )}
          <p className="text-xs text-slate-500">El avión va saltando sin parar. Retira antes de que se estrelle.</p>
        </>
      }
      table={
        <>
          <div className="relative w-full h-56 overflow-hidden rounded-xl border border-white/5 bg-gradient-to-b from-indigo-950 via-violet-800 to-amber-500/60">
            <div className="absolute inset-0 overflow-hidden">
              {CLOUDS.map((c, i) => (
                <Cloud
                  key={i}
                  className="absolute animate-drift"
                  style={{ top: c.top, left: '100%', width: c.w, height: c.h, opacity: c.op, animationDuration: c.dur, animationDelay: c.delay }}
                />
              ))}
            </div>

            <div
              className="absolute left-0 right-0"
              style={{ top: `${GROUND_PCT + 4}%`, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
            />

            <div
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${flying ? '' : 'transition-all duration-500'}`}
              style={{ left: `${pos.xPct}%`, top: `${pos.yPct}%`, transform: `translate(-50%, -50%) rotate(${crashed ? 70 : pos.rot}deg)` }}
            >
              <div className={crashed ? 'text-crimson-400' : 'text-crimson-500'}>
                <PlaneIcon size={40} />
              </div>
            </div>

            <div className={`absolute top-3 left-1/2 -translate-x-1/2 text-4xl font-extrabold tabular-nums drop-shadow ${crashed ? 'text-rose-300' : flying ? 'text-white' : 'text-white/90'}`}>
              x{live.toFixed(2)}
            </div>
            {crashed && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-white bg-rose-500/80 border border-rose-300/40 rounded-full px-3 py-1">
                ¡Se estrelló!
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
