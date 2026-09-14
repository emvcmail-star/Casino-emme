import React, { useState } from 'react';
import { CircleDot, TrendingUp, TrendingDown } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const BALL_COUNTS = [1, 10, 25, 50];
const STEP_MS = 90;
const LAUNCH_STAGGER_MS = 70;

export default function Plinko() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [risk, setRisk] = useState('medium');
  const [ballCount, setBallCount] = useState(1);
  const [dropping, setDropping] = useState(false);
  const [balls, setBalls] = useState([]);
  const [bucketHits, setBucketHits] = useState({});
  const [result, setResult] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const dropOneBall = (path, key) =>
    new Promise((resolve) => {
      let x = 5;
      let i = 0;
      const step = () => {
        if (i >= path.length) {
          setTimeout(() => {
            setBalls((prev) => prev.filter((b) => b.key !== key));
            resolve();
          }, 150);
          return;
        }
        x += path[i] === 'R' ? 0.5 : -0.5;
        const row = i + 1;
        setBalls((prev) => prev.map((b) => (b.key === key ? { ...b, x, row } : b)));
        i += 1;
        setTimeout(step, STEP_MS);
      };
      setTimeout(step, STEP_MS);
    });

  const drop = async () => {
    setError('');
    setResult(null);
    setBatchResult(null);
    setBucketHits({});
    setBalls([]);
    setDropping(true);
    try {
      const data = await api.post('/games/plinko/play-batch', { bet, risk, count: ballCount });
      const { results, totalBet, totalPayout, newBalance } = data;

      const nextHits = {};
      const animations = results.map((r, idx) => {
        const key = `${Date.now()}-${idx}`;
        setBalls((prev) => [...prev, { key, x: 5, row: 0 }]);
        nextHits[r.details.bucket] = (nextHits[r.details.bucket] || 0) + 1;
        return new Promise((resolve) => {
          setTimeout(() => {
            dropOneBall(r.details.path, key).then(resolve);
          }, idx * LAUNCH_STAGGER_MS);
        });
      });

      await Promise.all(animations);
      setBucketHits(nextHits);
      updateCredits(newBalance);
      results.forEach((r) => pushPlay({ outcome: r.outcome, multiplier: r.multiplier }));

      if (results.length === 1) {
        setResult({ ...results[0], bet });
      } else {
        const wins = results.filter((r) => r.outcome === 'win').length;
        setBatchResult({
          count: results.length,
          wins,
          totalBet,
          totalPayout: Math.round(totalPayout * 100) / 100,
          net: Math.round((totalPayout - totalBet) * 100) / 100,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDropping(false);
    }
  };

  const table = { low: [8, 3, 1.5, 1.2, 1, 0.5, 1, 1.2, 1.5, 3, 8], medium: [15, 5, 2, 1.3, 0.7, 0.4, 0.7, 1.3, 2, 5, 15], high: [43, 10, 3, 1.3, 0.4, 0.2, 0.4, 1.3, 3, 10, 43] }[risk];
  const ROWS = 10;
  const PEG_ZONE_PCT = 84;
  const maxHits = Math.max(1, ...Object.values(bucketHits));

  return (
    <GameShell
      error={error}
      idle={!dropping && !result && !batchResult}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={500} disabled={dropping} />
          <div>
            <label className="label-field">Riesgo</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['low', 'medium', 'high'].map((r) => (
                <button
                  key={r}
                  disabled={dropping}
                  onClick={() => setRisk(r)}
                  className={`rounded-lg py-2 text-xs font-semibold border capitalize ${
                    risk === r ? 'bg-gold-500/20 border-gold-400/50 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-field">Número de bolas</label>
            <div className="grid grid-cols-4 gap-1.5">
              {BALL_COUNTS.map((c) => (
                <button
                  key={c}
                  disabled={dropping}
                  onClick={() => setBallCount(c)}
                  className={`rounded-lg py-2 text-xs font-bold border ${
                    ballCount === c ? 'bg-gold-500/20 border-gold-400/50 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            {ballCount > 1 && (
              <p className="text-[11px] text-slate-500 mt-1.5">
                Apuesta total: {(bet * ballCount).toLocaleString('es-ES')} créditos ({ballCount} × {bet})
              </p>
            )}
          </div>
          <button className="btn-primary w-full" onClick={drop} disabled={dropping}>
            <CircleDot size={18} /> {dropping ? 'Cayendo…' : ballCount > 1 ? `Soltar ${ballCount} bolas` : 'Soltar bola'}
          </button>
        </>
      }
      table={
        <>
          <div
            className="relative w-full max-w-md h-64 mb-4 rounded-xl border border-white/5 overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at 50% -10%, rgba(139,92,246,0.30), transparent 55%), radial-gradient(circle at 50% 110%, rgba(99,102,241,0.20), transparent 50%), #0d0a1a',
            }}
          >
            {Array.from({ length: ROWS }).map((_, r) => (
              <div
                key={r}
                className="absolute left-0 right-0 flex justify-center items-center gap-[5%]"
                style={{ top: `${((r + 1) / (ROWS + 1)) * PEG_ZONE_PCT}%` }}
              >
                {Array.from({ length: r + 2 }).map((_, p) => (
                  <span key={p} className="w-1.5 h-1.5 rounded-full bg-violet-200/30 shadow-[0_0_4px_rgba(196,181,253,0.25)]" />
                ))}
              </div>
            ))}
            {balls.map((b) => (
              <div
                key={b.key}
                className="absolute w-3.5 h-3.5 rounded-full bg-gradient-to-br from-fuchsia-300 to-pink-600 shadow-[0_0_12px_rgba(232,121,249,0.7)] transition-all duration-100 z-10"
                style={{
                  left: `${(b.x / 10) * 100}%`,
                  top: `${(b.row / (ROWS + 1)) * PEG_ZONE_PCT}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between gap-0.5 p-1">
              {table.map((m, i) => {
                const hits = bucketHits[i] || 0;
                const isHot = hits > 0 && hits === maxHits;
                return (
                  <div
                    key={i}
                    className={`relative flex-1 text-center text-[10px] font-bold py-1.5 rounded transition-colors ${
                      isHot
                        ? 'bg-fuchsia-400 text-base-950 scale-105'
                        : hits > 0
                        ? 'bg-fuchsia-400/40 text-white'
                        : m >= 5
                        ? 'bg-rose-400/20 text-rose-300'
                        : m >= 1
                        ? 'bg-violet-400/15 text-violet-300'
                        : 'bg-indigo-400/10 text-indigo-300'
                    }`}
                  >
                    {m}x
                    {hits > 1 && (
                      <span className="absolute -top-1.5 -right-1 bg-emerald-500 text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
                        {hits}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {result && <ResultBanner result={result} />}
          {batchResult && (
            <div
              className={`animate-slide-up rounded-2xl border bg-gradient-to-br p-4 flex items-center gap-4 ${
                batchResult.net >= 0
                  ? 'from-emerald-500/20 to-emerald-400/5 border-emerald-400/30 text-emerald-300'
                  : 'from-rose-500/20 to-rose-400/5 border-rose-400/30 text-rose-300'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                {batchResult.net >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-lg leading-none">
                  {batchResult.count} bolas · {batchResult.wins} ganadoras
                </p>
                <p className="text-sm text-slate-300 mt-1">
                  Apostado {batchResult.totalBet.toLocaleString('es-ES')} · Pagado {batchResult.totalPayout.toLocaleString('es-ES')} ·{' '}
                  {batchResult.net >= 0 ? '+' : ''}
                  {batchResult.net.toLocaleString('es-ES')} neto
                </p>
              </div>
            </div>
          )}
        </>
      }
      history={<LastPlaysList plays={plays} />}
    />
  );
}
