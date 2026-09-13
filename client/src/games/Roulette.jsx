import React, { useState } from 'react';
import { Disc } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
// Physical order of pockets on a European wheel, clockwise from 0.
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const ANGLE = 360 / WHEEL_ORDER.length;
// Grid rows top-to-bottom as on a real table: 3-6-9.. / 2-5-8.. / 1-4-7..
const GRID_ROWS = [
  { colValue: 0, nums: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36] },
  { colValue: 2, nums: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35] },
  { colValue: 1, nums: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34] },
];

function cellColor(n) {
  if (n === 0) return 'bg-emerald-700 hover:bg-emerald-600 text-white';
  return RED.has(n) ? 'bg-crimson-600 hover:bg-crimson-500 text-white' : 'bg-base-700 hover:bg-base-600 text-white';
}

export default function Roulette() {
  const { updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [selection, setSelection] = useState({ type: 'red', value: null, label: 'Rojo' });
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const pick = (type, value, label) => !spinning && setSelection({ type, value, label });

  const spin = async () => {
    setError('');
    setSpinning(true);
    setResult(null);
    try {
      const data = await api.post('/games/roulette/play', { bet, betType: selection.type, betValue: selection.value });
      const landing = data.details.spin;
      const pocketIndex = WHEEL_ORDER.indexOf(landing);
      const targetAngle = 360 * 5 + (360 - pocketIndex * ANGLE - ANGLE / 2);
      setRotation((r) => r + targetAngle);
      await new Promise((res) => setTimeout(res, 2600));
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier, label: data.details.spin });
    } catch (err) {
      setError(err.message);
    } finally {
      setSpinning(false);
    }
  };

  const isSel = (type, value) => selection.type === type && selection.value === value;

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={1000} disabled={spinning} />
          <div className="glass-card !bg-white/[0.03] p-3 text-center">
            <p className="text-[11px] text-slate-500 mb-0.5">Apuesta seleccionada</p>
            <p className="text-sm font-bold text-gold-300">{selection.label}</p>
          </div>
          <button className="btn-primary w-full" onClick={spin} disabled={spinning}>
            <Disc size={18} /> {spinning ? 'Girando…' : 'Girar ruleta'}
          </button>
          <p className="text-xs text-slate-500">Toca un número, color, docena o columna en la mesa para elegir tu apuesta.</p>
        </>
      }
      table={
        <div className="w-full flex flex-col items-center gap-6">
          <div className="relative w-48 h-48 shrink-0">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[9px] border-r-[9px] border-t-[14px] border-l-transparent border-r-transparent border-t-gold-300" />
            <div
              className="w-48 h-48 rounded-full border-[6px] border-gold-500/30 relative overflow-hidden shadow-glow transition-transform"
              style={{
                transform: `rotate(${rotation}deg)`,
                transitionDuration: spinning ? '2600ms' : '0ms',
                transitionTimingFunction: 'cubic-bezier(0.12, 0.7, 0.15, 1)',
                background: `conic-gradient(${WHEEL_ORDER.map(
                  (n, i) => `${n === 0 ? '#065f46' : RED.has(n) ? '#7f1a29' : '#17141a'} ${i * ANGLE}deg ${(i + 1) * ANGLE}deg`
                ).join(', ')})`,
              }}
            >
              {WHEEL_ORDER.map((n, i) => (
                <div
                  key={i}
                  className="absolute inset-0 flex justify-center"
                  style={{ transform: `rotate(${i * ANGLE + ANGLE / 2}deg)` }}
                >
                  <span className="text-[8px] font-bold text-white/90 mt-1">{n}</span>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-base-900 border border-gold-500/30 flex items-center justify-center text-lg font-extrabold text-white">
              {result ? result.details.spin : '—'}
            </div>
          </div>

          <div className="w-full max-w-xl overflow-x-auto">
            <div className="min-w-[480px] flex gap-1">
              <button
                onClick={() => pick('number', 0, 'Número 0')}
                disabled={spinning}
                className={`w-9 rounded-md ${cellColor(0)} text-xs font-bold flex items-center justify-center ${
                  isSel('number', 0) ? 'ring-2 ring-gold-300' : ''
                }`}
              >
                0
              </button>
              <div className="flex-1 flex flex-col gap-1">
                {GRID_ROWS.map((row) => (
                  <div key={row.colValue} className="flex gap-1">
                    {row.nums.map((n) => (
                      <button
                        key={n}
                        onClick={() => pick('number', n, `Número ${n}`)}
                        disabled={spinning}
                        className={`flex-1 h-8 rounded-md text-xs font-bold ${cellColor(n)} ${
                          isSel('number', n) ? 'ring-2 ring-gold-300' : ''
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                {GRID_ROWS.map((row) => (
                  <button
                    key={row.colValue}
                    onClick={() => pick('column', row.colValue, `Columna ${row.colValue === 0 ? '3-36' : row.colValue === 2 ? '2-35' : '1-34'}`)}
                    disabled={spinning}
                    className={`w-11 h-8 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 hover:bg-white/10 ${
                      isSel('column', row.colValue) ? 'ring-2 ring-gold-300' : ''
                    }`}
                  >
                    2:1
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-[480px] grid grid-cols-3 gap-1 mt-1 ml-[40px] mr-[48px]">
              {[
                { v: 1, l: '1 a 12' },
                { v: 2, l: '13 a 24' },
                { v: 3, l: '25 a 36' },
              ].map((d) => (
                <button
                  key={d.v}
                  onClick={() => pick('dozen', d.v, d.l)}
                  disabled={spinning}
                  className={`h-8 rounded-md bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-300 hover:bg-white/10 ${
                    isSel('dozen', d.v) ? 'ring-2 ring-gold-300' : ''
                  }`}
                >
                  {d.l}
                </button>
              ))}
            </div>

            <div className="min-w-[480px] grid grid-cols-6 gap-1 mt-1 ml-[40px] mr-[48px]">
              {[
                { t: 'low', l: '1 a 18' },
                { t: 'even', l: 'Par' },
                { t: 'red', l: 'Rojo', swatch: 'bg-crimson-600 hover:bg-crimson-500' },
                { t: 'black', l: 'Negro', swatch: 'bg-base-700 hover:bg-base-600' },
                { t: 'odd', l: 'Impar' },
                { t: 'high', l: '19 a 36' },
              ].map((o) => (
                <button
                  key={o.t}
                  onClick={() => pick(o.t, null, o.l)}
                  disabled={spinning}
                  className={`h-8 rounded-md text-[11px] font-semibold text-white ${
                    o.swatch || 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                  } ${isSel(o.t, null) ? 'ring-2 ring-gold-300' : ''}`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {result && (
            <p className="text-sm text-slate-400">
              Número {result.details.spin} · {result.details.spin === 0 ? 'Verde' : RED.has(result.details.spin) ? 'Rojo' : 'Negro'}
            </p>
          )}
          {result && <ResultBanner result={result} />}
        </div>
      }
      history={<LastPlaysList plays={plays} render={(p) => `${p.label} · x${Number(p.multiplier).toFixed(1)}`} />}
    />
  );
}
