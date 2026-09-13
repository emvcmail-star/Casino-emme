import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Wheel() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const spin = async () => {
    setError('');
    setSpinning(true);
    setResult(null);
    try {
      const data = await api.post('/games/wheel/play', { bet });
      const segCount = data.details.segments.length;
      const anglePer = 360 / segCount;
      const targetAngle = 360 * 4 + (360 - data.details.segmentIndex * anglePer);
      setRotation((r) => r + targetAngle);
      await new Promise((r) => setTimeout(r, 1600));
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier });
    } catch (err) {
      setError(err.message);
    } finally {
      setSpinning(false);
    }
  };

  const segments = [1.2, 1.5, 2, 3, 5, 0, 1.2, 1.5, 2, 3, 10, 0];
  const anglePer = 360 / segments.length;

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={500} disabled={spinning} />
          <button className="btn-primary w-full" onClick={spin} disabled={spinning}>
            <RotateCw size={18} /> {spinning ? 'Girando…' : 'Girar rueda'}
          </button>
        </>
      }
      table={
        <>
          <div className="relative w-56 h-56 mb-6">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-amber-300" />
            <div
              className="w-56 h-56 rounded-full border-4 border-white/10 relative overflow-hidden transition-transform"
              style={{
                transform: `rotate(${rotation}deg)`,
                transitionDuration: spinning ? '1600ms' : '0ms',
                transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                background: `conic-gradient(${segments
                  .map((s, i) => `${segColor(s)} ${i * anglePer}deg ${(i + 1) * anglePer}deg`)
                  .join(', ')})`,
              }}
            >
              {segments.map((s, i) => (
                <div
                  key={i}
                  className="absolute inset-0 flex justify-center"
                  style={{ transform: `rotate(${i * anglePer + anglePer / 2}deg)` }}
                >
                  <span className="text-xs font-bold text-white mt-2">{s === 0 ? '💀' : `x${s}`}</span>
                </div>
              ))}
            </div>
          </div>
          {result && <ResultBanner result={result} />}
        </>
      }
      history={<LastPlaysList plays={plays} />}
    />
  );
}

function segColor(s) {
  if (s === 0) return '#3f1d2e';
  if (s >= 10) return '#f59e0b';
  if (s >= 5) return '#2f7dff';
  if (s >= 2) return '#5eb1ff';
  return '#1e3a6e';
}
