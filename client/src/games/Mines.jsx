import React, { useState } from 'react';
import { Bomb, Gem, Wallet } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const GRID_SIZE = 25;

export default function Mines() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [minesCount, setMinesCount] = useState(3);
  const [session, setSession] = useState(null);
  const [revealed, setRevealed] = useState([]);
  const [mines, setMines] = useState([]);
  const [multiplier, setMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const start = async () => {
    setError('');
    setLoading(true);
    setResult(null);
    setRevealed([]);
    setMines([]);
    setMultiplier(1);
    try {
      const data = await api.post('/games/mines/start', { bet, minesCount });
      updateCredits(data.newBalance);
      setSession(data.sessionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reveal = async (i) => {
    if (!session || revealed.includes(i) || loading) return;
    setLoading(true);
    try {
      const data = await api.post('/games/mines/reveal', { sessionId: session, cellIndex: i });
      if (data.hitMine) {
        setMines(data.mines);
        setRevealed((r) => [...r, i]);
        setSession(null);
        setResult({ outcome: 'loss', multiplier: 0, payout: data.payout, bet });
        pushPlay({ outcome: 'loss', multiplier: 0 });
      } else {
        setRevealed((r) => [...r, i]);
        setMultiplier(data.multiplier);
        if (data.finished) {
          setMines(data.mines);
          setSession(null);
          updateCredits(data.newBalance);
          setResult({ outcome: 'win', multiplier: data.multiplier, payout: data.payout, bet });
          pushPlay({ outcome: 'win', multiplier: data.multiplier });
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
      const data = await api.post('/games/mines/cashout', { sessionId: session });
      setMines(data.mines);
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
      idle={!inRound && !result}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={500} disabled={inRound || loading} />
          <div>
            <label className="label-field">Número de minas: {minesCount}</label>
            <input
              type="range"
              min={1}
              max={20}
              value={minesCount}
              disabled={inRound}
              onChange={(e) => setMinesCount(Number(e.target.value))}
              className="w-full accent-gold-500"
            />
          </div>
          {!inRound ? (
            <button className="btn-primary w-full" onClick={start} disabled={loading}>
              <Bomb size={18} /> {loading ? 'Iniciando…' : 'Iniciar partida'}
            </button>
          ) : (
            <>
              <div className="glass-card !bg-emerald-500/10 border-emerald-400/20 p-3 text-center">
                <p className="text-xs text-slate-400">Multiplicador actual</p>
                <p className="text-2xl font-extrabold text-emerald-300">x{multiplier.toFixed(2)}</p>
              </div>
              <button className="btn-primary w-full" onClick={cashout} disabled={loading || revealed.length === 0}>
                <Wallet size={18} /> Retirar créditos
              </button>
            </>
          )}
        </>
      }
      table={
        <>
          <div className="w-full max-w-sm flex justify-end gap-2 mb-3">
            <div className="glass-card !bg-white/[0.03] px-3 py-1.5 flex items-center gap-1.5">
              <Gem size={13} className="text-emerald-400" />
              <span className="text-xs font-bold text-white tabular-nums">{revealed.filter((i) => !mines.includes(i)).length}</span>
            </div>
            <div className="glass-card !bg-white/[0.03] px-3 py-1.5 flex items-center gap-1.5">
              <Bomb size={13} className="text-crimson-400" />
              <span className="text-xs font-bold text-white tabular-nums">{minesCount}</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3 w-full max-w-sm p-1">
            {Array.from({ length: GRID_SIZE }).map((_, i) => {
              const isRevealed = revealed.includes(i);
              const isMine = mines.includes(i);
              const showMine = mines.length > 0 && isMine;
              return (
                <button
                  key={i}
                  onClick={() => reveal(i)}
                  disabled={!inRound || isRevealed || loading}
                  className={`aspect-square rounded-3xl border flex items-center justify-center transition-all duration-200 shadow-inner-line
                    ${
                      showMine
                        ? isRevealed
                          ? 'bg-gradient-to-b from-crimson-500/40 to-crimson-700/30 border-crimson-400/50 shadow-[0_0_16px_rgba(179,39,58,0.4)]'
                          : 'bg-gradient-to-b from-crimson-500/10 to-crimson-700/5 border-crimson-400/20'
                        : isRevealed
                        ? 'bg-gradient-to-b from-emerald-400/25 to-emerald-600/10 border-emerald-400/40 shadow-[0_0_16px_rgba(52,211,153,0.25)] scale-[1.03]'
                        : 'bg-gradient-to-b from-white/[0.06] to-white/[0.01] border-white/10 hover:border-gold-400/30 hover:-translate-y-0.5 hover:shadow-glow'
                    }`}
                >
                  {showMine ? (
                    <Bomb className="text-crimson-300" size={20} strokeWidth={1.75} />
                  ) : isRevealed ? (
                    <Gem className="text-emerald-300" size={20} strokeWidth={1.75} fill="currentColor" fillOpacity={0.2} />
                  ) : (
                    ''
                  )}
                </button>
              );
            })}
          </div>
          {result && <div className="mt-6 w-full"><ResultBanner result={result} /></div>}
        </>
      }
      history={<LastPlaysList plays={plays} />}
    />
  );
}
