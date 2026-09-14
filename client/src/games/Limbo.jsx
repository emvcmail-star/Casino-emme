import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const BOARD = 180;
const RINGS = [
  { r: 90, color: 'bg-base-800' },
  { r: 72, color: 'bg-crimson-700' },
  { r: 54, color: 'bg-base-700' },
  { r: 36, color: 'bg-gold-600' },
  { r: 20, color: 'bg-crimson-500' },
  { r: 10, color: 'bg-gold-300' },
];
const IDLE_DART = { dx: 0, dy: -160, rot: -25, visible: false };

function dartTargetFor(outcome) {
  if (outcome === 'win') {
    return { dx: (Math.random() * 2 - 1) * 5, dy: (Math.random() * 2 - 1) * 5, rot: Math.random() * 24 - 12, visible: true };
  }
  const angle = Math.random() * Math.PI * 2;
  const radius = 50 + Math.random() * 20;
  return { dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius, rot: Math.random() * 40 - 20, visible: true };
}

export default function Limbo() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [target, setTarget] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();
  const [dart, setDart] = useState(IDLE_DART);
  const [animating, setAnimating] = useState(false);

  const play = async () => {
    setError('');
    setPlaying(true);
    setResult(null);
    setAnimating(false);
    setDart(IDLE_DART);
    try {
      const data = await api.post('/games/limbo/play', { bet, targetMultiplier: target });
      await new Promise((r) => setTimeout(r, 60));
      requestAnimationFrame(() => {
        setAnimating(true);
        setDart(dartTargetFor(data.outcome));
      });
      await new Promise((r) => setTimeout(r, 700));
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier, label: data.details.result.toFixed(2) });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlaying(false);
    }
  };

  return (
    <GameShell
      error={error}
      idle={!result}
      idleMessage="Elige tu objetivo y lanza el dardo"
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={1000} disabled={playing} />
          <div>
            <label className="label-field">Multiplicador objetivo</label>
            <input
              type="number"
              step="0.01"
              min={1.01}
              className="input-field"
              value={target}
              disabled={playing}
              onChange={(e) => setTarget(Math.max(1.01, Number(e.target.value)))}
            />
          </div>
          <p className="text-xs text-slate-500">Ganas si el resultado generado es ≥ a tu objetivo.</p>
          <button className="btn-primary w-full" onClick={play} disabled={playing}>
            <TrendingUp size={18} /> {playing ? 'Lanzando…' : 'Jugar'}
          </button>
        </>
      }
      table={
        <>
          <div className={`text-6xl font-extrabold mb-1 tabular-nums ${result ? (result.outcome === 'win' ? 'text-emerald-400' : 'text-rose-400') : 'text-white'}`}>
            {result ? `${result.details.result.toFixed(2)}x` : '—'}
          </div>
          <p className="text-sm text-slate-500 mb-6">Objetivo: x{Number(target).toFixed(2)}</p>

          <div className="relative shrink-0" style={{ width: BOARD, height: BOARD }}>
            {RINGS.map((ring, i) => (
              <div key={i} className={`absolute rounded-full ${ring.color} shadow-inner-line`} style={{ inset: `${90 - ring.r}px` }} />
            ))}
            <div
              className="absolute left-1/2 top-1/2 z-20 pointer-events-none"
              style={{
                transform: `translate(-50%, -50%) translate(${dart.dx}px, ${dart.dy}px) rotate(${dart.rot}deg)`,
                transition: animating ? 'transform 650ms cubic-bezier(0.32, 1.7, 0.5, 1), opacity 400ms ease-out' : 'none',
                opacity: dart.visible ? 1 : 0,
              }}
            >
              <div className="relative w-2 h-16">
                <div className="absolute left-1/2 -translate-x-1/2 top-2 w-1 h-9 bg-gradient-to-b from-slate-200 via-slate-400 to-slate-500 rounded-full" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[11px] border-l-transparent border-r-transparent border-t-crimson-400" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[9px] border-l-transparent border-r-transparent border-b-gold-400" />
              </div>
            </div>
          </div>

          {result && <div className="mt-6"><ResultBanner result={result} /></div>}
        </>
      }
      history={<LastPlaysList plays={plays} render={(p) => `${p.label}x`} />}
    />
  );
}
