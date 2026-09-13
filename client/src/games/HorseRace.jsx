import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSound } from '../context/SoundContext.jsx';

const HORSES = [
  { name: 'Relámpago', color: '#ef4444', multiplier: 2.7 },
  { name: 'Trueno', color: '#3b82f6', multiplier: 3.8 },
  { name: 'Fantasma', color: '#22c55e', multiplier: 4.8 },
  { name: 'Dorado', color: '#f59e0b', multiplier: 8 },
  { name: 'Sombra', color: '#a855f7', multiplier: 12 },
];

const RACE_MS = 3000;
const STAGGER_MS = 200;
const FINISH_LEFT = 88;

export default function HorseRace() {
  const { updateCredits } = useAuth();
  const { play } = useSound();
  const [bet, setBet] = useState(10);
  const [picked, setPicked] = useState(0);
  const [racing, setRacing] = useState(false);
  const [positions, setPositions] = useState(Array(HORSES.length).fill(0));
  const [durations, setDurations] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const race = async () => {
    setError('');
    setResult(null);
    setRacing(true);
    setDurations({});
    setPositions(Array(HORSES.length).fill(0));
    try {
      const data = await api.post('/games/horserace/play', { bet, horseIndex: picked });
      const { finishOrder } = data.details;

      requestAnimationFrame(() => {
        const nextDurations = {};
        finishOrder.forEach((horseIdx, place) => {
          nextDurations[horseIdx] = RACE_MS + place * STAGGER_MS + Math.random() * 100;
        });
        setDurations(nextDurations);
        setPositions(Array(HORSES.length).fill(FINISH_LEFT));
      });

      const totalWait = RACE_MS + (HORSES.length - 1) * STAGGER_MS + 500;
      await new Promise((r) => setTimeout(r, totalWait));
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier });
    } catch (err) {
      setError(err.message);
    } finally {
      setRacing(false);
    }
  };

  const pick = (i) => {
    if (racing) return;
    play('click');
    setPicked(i);
  };

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={500} disabled={racing} />
          <div>
            <label className="label-field">Elige tu caballo</label>
            <div className="space-y-1.5">
              {HORSES.map((h, i) => (
                <button
                  key={h.name}
                  type="button"
                  disabled={racing}
                  onClick={() => pick(i)}
                  className={`w-full flex items-center gap-2.5 rounded-lg py-2 px-3 border text-left transition-all disabled:opacity-50 ${
                    picked === i ? 'bg-gold-500/15 border-gold-400/50' : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                  <span className="text-sm font-semibold text-white flex-1">{h.name}</span>
                  <span className="text-xs text-gold-300 font-bold">x{h.multiplier}</span>
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" onClick={race} disabled={racing}>
            <Flag size={18} /> {racing ? 'Corriendo…' : 'Iniciar carrera'}
          </button>
        </>
      }
      table={
        <>
          <div className="w-full max-w-xl space-y-2 mb-4">
            {HORSES.map((h, i) => (
              <div key={h.name} className="relative h-11 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                <div className="absolute inset-y-0 flex flex-col items-center justify-center" style={{ left: `${FINISH_LEFT + 6}%` }}>
                  <span className="text-[10px]">🏁</span>
                </div>
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 z-10">
                  {h.name}
                </span>
                <div
                  className="absolute top-1/2 -translate-y-1/2 text-xl transition-[left] ease-out"
                  style={{
                    left: `${positions[i]}%`,
                    transitionDuration: racing ? `${durations[i] || RACE_MS}ms` : '0ms',
                  }}
                >
                  🐎
                </div>
              </div>
            ))}
          </div>
          {result && <ResultBanner result={result} />}
        </>
      }
      history={<LastPlaysList plays={plays} />}
    />
  );
}
