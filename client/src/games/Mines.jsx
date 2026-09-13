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
              className="w-full accent-electric-500"
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
          <div className="grid grid-cols-5 gap-2 w-full max-w-sm">
            {Array.from({ length: GRID_SIZE }).map((_, i) => {
              const isRevealed = revealed.includes(i);
              const isMine = mines.includes(i);
              const showMine = mines.length > 0 && isMine;
              return (
                <button
                  key={i}
                  onClick={() => reveal(i)}
                  disabled={!inRound || isRevealed || loading}
                  className={`aspect-square rounded-xl border flex items-center justify-center text-xl transition-all duration-200
                    ${
                      showMine
                        ? isRevealed
                          ? 'bg-rose-500/30 border-rose-400/50'
                          : 'bg-rose-500/10 border-rose-400/20'
                        : isRevealed
                        ? 'bg-emerald-500/20 border-emerald-400/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  {showMine ? '💣' : isRevealed ? <Gem className="text-emerald-300" size={18} /> : ''}
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
