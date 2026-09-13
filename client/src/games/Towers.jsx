import React, { useState } from 'react';
import { Building2, Wallet, Check, Bomb, X } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Towers() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [session, setSession] = useState(null);
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(3);
  const [choices, setChoices] = useState([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [badCells, setBadCells] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const start = async () => {
    setError('');
    setLoading(true);
    setResult(null);
    setChoices([]);
    setCurrentRow(0);
    setMultiplier(1);
    setBadCells([]);
    try {
      const data = await api.post('/games/towers/start', { bet });
      updateCredits(data.newBalance);
      setSession(data.sessionId);
      setRows(data.rows);
      setCols(data.cols);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const climb = async (col) => {
    if (!session || loading) return;
    setLoading(true);
    try {
      const data = await api.post('/games/towers/climb', { sessionId: session, col });
      if (data.lost) {
        setBadCells(data.badCells);
        setChoices((c) => [...c, { row: currentRow, col }]);
        setSession(null);
        setResult({ outcome: 'loss', multiplier: 0, payout: data.payout, bet });
        pushPlay({ outcome: 'loss', multiplier: 0 });
      } else {
        setChoices((c) => [...c, { row: currentRow, col }]);
        setCurrentRow(data.currentRow);
        setMultiplier(data.multiplier);
        if (data.finished) {
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
      const data = await api.post('/games/towers/cashout', { sessionId: session });
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
  const rowsArray = Array.from({ length: rows });

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={500} disabled={inRound || loading} />
          {!inRound ? (
            <button className="btn-primary w-full" onClick={start} disabled={loading}>
              <Building2 size={18} /> {loading ? 'Iniciando…' : 'Construir torre'}
            </button>
          ) : (
            <>
              <div className="glass-card !bg-emerald-500/10 border-emerald-400/20 p-3 text-center">
                <p className="text-xs text-slate-400">Fila {currentRow} de {rows}</p>
                <p className="text-2xl font-extrabold text-emerald-300">x{multiplier.toFixed(2)}</p>
              </div>
              <button className="btn-primary w-full" onClick={cashout} disabled={loading || currentRow === 0}>
                <Wallet size={18} /> Retirar créditos
              </button>
            </>
          )}
        </>
      }
      table={
        <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex flex-col-reverse gap-2 w-full max-w-xs">
          {rowsArray.map((_, row) => {
            const choice = choices.find((c) => c.row === row);
            const isActive = inRound && row === currentRow;
            const isPast = row < currentRow || choice;
            return (
              <div key={row} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: cols }).map((__, col) => {
                  const isBad = badCells[row] === col;
                  const wasChosen = choice?.col === col;
                  return (
                    <button
                      key={col}
                      disabled={!isActive || loading}
                      onClick={() => climb(col)}
                      className={`h-10 rounded-lg border text-sm font-bold flex items-center justify-center transition-all
                        ${isActive ? 'bg-white/5 border-white/10 hover:bg-gold-500/20 hover:border-gold-400/40' : ''}
                        ${isPast && !wasChosen ? 'bg-white/[0.02] border-white/5' : ''}
                        ${wasChosen && isBad ? 'bg-rose-500/30 border-rose-400/50' : ''}
                        ${wasChosen && !isBad ? 'bg-emerald-500/30 border-emerald-400/50' : ''}
                        ${!isActive && !isPast ? 'opacity-30' : ''}
                      `}
                    >
                      {wasChosen ? (
                        isBad ? <X size={16} className="text-rose-300" /> : <Check size={16} className="text-emerald-300" />
                      ) : isBad && badCells.length ? (
                        <Bomb size={15} className="text-rose-400/70" />
                      ) : (
                        ''
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        {result && <ResultBanner result={result} />}
        </div>
      }
      history={<LastPlaysList plays={plays} />}
    />
  );
}
