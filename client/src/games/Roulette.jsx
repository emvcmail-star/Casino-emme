import React, { useMemo, useState } from 'react';
import { Disc, Trash2 } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSound } from '../context/SoundContext.jsx';
import { bigWinConfetti, smallWinConfetti } from '../components/confetti.js';

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

function chipKey(type, value) {
  return `${type}:${value}`;
}

export default function Roulette() {
  const { updateCredits } = useAuth();
  const { play } = useSound();
  const [bet, setBet] = useState(10);
  const [chips, setChips] = useState({});
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [landing, setLanding] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const totalWagered = useMemo(() => Object.values(chips).reduce((s, c) => s + c.amount, 0), [chips]);

  const addChip = (type, value, label) => {
    if (spinning) return;
    play('click');
    const key = chipKey(type, value);
    setChips((prev) => ({
      ...prev,
      [key]: { type, value, label, amount: (prev[key]?.amount || 0) + bet },
    }));
  };

  const clearChips = () => !spinning && setChips({});

  const spin = async () => {
    if (totalWagered === 0) return;
    setError('');
    setSpinning(true);
    setResult(null);
    try {
      const bets = Object.values(chips).map((c) => ({ betType: c.type, betValue: c.value, amount: c.amount }));
      const data = await api.post('/games/roulette/play-multi', { bets });
      const spinNumber = data.spin;
      const pocketIndex = WHEEL_ORDER.indexOf(spinNumber);
      const desiredMod = (((360 - pocketIndex * ANGLE - ANGLE / 2) % 360) + 360) % 360;
      setRotation((r) => {
        const currentMod = ((r % 360) + 360) % 360;
        let delta = desiredMod - currentMod;
        if (delta <= 0) delta += 360;
        return r + 360 * 5 + delta;
      });
      await new Promise((res) => setTimeout(res, 2600));
      setLanding(spinNumber);
      setResult({ ...data, chips: Object.values(chips) });
      updateCredits(data.newBalance);
      const won = data.totalPayout > 0;
      if (won) {
        play(data.totalPayout >= data.totalBet * 3 ? 'jackpot' : 'win');
        if (data.totalPayout >= data.totalBet * 3) bigWinConfetti();
        else smallWinConfetti();
      } else {
        play('loss');
      }
      pushPlay({ outcome: data.totalPayout >= data.totalBet ? 'win' : 'loss', multiplier: data.totalBet > 0 ? Math.round((data.totalPayout / data.totalBet) * 100) / 100 : 0, label: spinNumber });
    } catch (err) {
      setError(err.message);
    } finally {
      setSpinning(false);
    }
  };

  const chipAt = (type, value) => chips[chipKey(type, value)]?.amount || 0;

  const ChipBadge = ({ amount }) =>
    amount > 0 ? (
      <span className="absolute -top-1.5 -right-1.5 bg-gold-400 text-base-950 text-[9px] font-extrabold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center shadow-glow z-10">
        {amount}
      </span>
    ) : null;

  return (
    <GameShell
      error={error}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={1000} disabled={spinning} />
          <div className="glass-card !bg-white/[0.03] p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-slate-500">Total en mesa</p>
              <button onClick={clearChips} disabled={spinning || totalWagered === 0} className="text-slate-500 hover:text-rose-300 disabled:opacity-30">
                <Trash2 size={13} />
              </button>
            </div>
            <p className="text-lg font-bold text-gold-300">{totalWagered.toLocaleString('es-ES')} créditos</p>
          </div>
          <button className="btn-primary w-full" onClick={spin} disabled={spinning || totalWagered === 0}>
            <Disc size={18} /> {spinning ? 'Girando…' : 'Girar ruleta'}
          </button>
          <p className="text-xs text-slate-500">
            Toca cualquier casilla para poner una ficha ahí — puedes poner fichas en varias a la vez. Toca de nuevo para sumar más.
          </p>
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
              {landing !== null ? landing : '—'}
            </div>
          </div>

          <div className="w-full max-w-xl overflow-x-auto">
            <div className="min-w-[480px] flex gap-1">
              <button
                onClick={() => addChip('number', 0, 'Número 0')}
                disabled={spinning}
                className={`relative w-9 rounded-md ${cellColor(0)} text-xs font-bold flex items-center justify-center`}
              >
                0
                <ChipBadge amount={chipAt('number', 0)} />
              </button>
              <div className="flex-1 flex flex-col gap-1">
                {GRID_ROWS.map((row) => (
                  <div key={row.colValue} className="flex gap-1">
                    {row.nums.map((n) => (
                      <button
                        key={n}
                        onClick={() => addChip('number', n, `Número ${n}`)}
                        disabled={spinning}
                        className={`relative flex-1 h-8 rounded-md text-xs font-bold ${cellColor(n)}`}
                      >
                        {n}
                        <ChipBadge amount={chipAt('number', n)} />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                {GRID_ROWS.map((row) => (
                  <button
                    key={row.colValue}
                    onClick={() => addChip('column', row.colValue, `Columna ${row.colValue === 0 ? '3-36' : row.colValue === 2 ? '2-35' : '1-34'}`)}
                    disabled={spinning}
                    className="relative w-11 h-8 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 hover:bg-white/10"
                  >
                    2:1
                    <ChipBadge amount={chipAt('column', row.colValue)} />
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
                  onClick={() => addChip('dozen', d.v, d.l)}
                  disabled={spinning}
                  className="relative h-8 rounded-md bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                >
                  {d.l}
                  <ChipBadge amount={chipAt('dozen', d.v)} />
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
                  onClick={() => addChip(o.t, null, o.l)}
                  disabled={spinning}
                  className={`relative h-8 rounded-md text-[11px] font-semibold text-white ${
                    o.swatch || 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {o.l}
                  <ChipBadge amount={chipAt(o.t, null)} />
                </button>
              ))}
            </div>
          </div>

          {landing !== null && (
            <p className="text-sm text-slate-400">
              Número {landing} · {landing === 0 ? 'Verde' : RED.has(landing) ? 'Rojo' : 'Negro'}
            </p>
          )}

          {result && (
            <div
              className={`animate-slide-up w-full rounded-2xl border bg-gradient-to-br p-4 ${
                result.totalPayout >= result.totalBet
                  ? 'from-emerald-500/20 to-emerald-400/5 border-emerald-400/30 text-emerald-300'
                  : 'from-rose-500/20 to-rose-400/5 border-rose-400/30 text-rose-300'
              }`}
            >
              <p className="font-bold text-lg leading-none mb-1">
                {result.results.filter((r) => r.win).length} de {result.results.length} apuestas ganadoras
              </p>
              <p className="text-sm text-slate-300">
                Apostado {result.totalBet.toLocaleString('es-ES')} · Pagado {result.totalPayout.toLocaleString('es-ES')} ·{' '}
                {result.totalPayout - result.totalBet >= 0 ? '+' : ''}
                {(result.totalPayout - result.totalBet).toLocaleString('es-ES')} neto
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {result.chips.map((c, i) => {
                  const r = result.results[i];
                  return (
                    <span
                      key={i}
                      className={`pill ${r.win ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/5 text-slate-500'}`}
                    >
                      {c.label} ({c.amount}) {r.win ? `→ +${r.payout}` : '→ 0'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      }
      history={<LastPlaysList plays={plays} render={(p) => `${p.label} · x${Number(p.multiplier).toFixed(2)}`} />}
    />
  );
}
