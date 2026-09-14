import React, { useState } from 'react';
import { Sparkles, Cherry, Citrus, Bell, Star, Diamond, Coins } from 'lucide-react';
import BetControls from '../components/BetControls.jsx';
import ResultBanner from '../components/ResultBanner.jsx';
import GameShell from './GameShell.jsx';
import { useLastPlays, LastPlaysList } from './useLastPlays.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const SYMBOL_META = {
  cherry: { icon: Cherry, className: 'text-rose-500' },
  lemon: { icon: Citrus, className: 'text-yellow-500' },
  bell: { icon: Bell, className: 'text-gold-600' },
  star: { icon: Star, className: 'text-amber-500' },
  diamond: { icon: Diamond, className: 'text-sky-500' },
  seven: { icon: null, className: 'text-crimson-500' },
};
const SYMBOL_KEYS = Object.keys(SYMBOL_META);

function Reel({ symbol, spinning }) {
  const meta = SYMBOL_META[symbol] || SYMBOL_META.cherry;
  const Icon = meta.icon;
  return (
    <div className={`card-face w-24 h-24 sm:w-28 sm:h-28 relative ${spinning ? 'animate-pulse' : ''}`}>
      <div className="absolute inset-1.5 rounded-md border border-slate-300/60" />
      <div className={`absolute top-1 left-1.5 text-[10px] font-extrabold ${meta.className}`}>
        {Icon ? <Icon size={11} fill="currentColor" /> : '7'}
      </div>
      <div className={`absolute bottom-1 right-1.5 text-[10px] font-extrabold rotate-180 ${meta.className}`}>
        {Icon ? <Icon size={11} fill="currentColor" /> : '7'}
      </div>
      <div className={`relative z-10 flex items-center justify-center w-full h-full ${meta.className}`}>
        {Icon ? <Icon size={44} strokeWidth={1.6} fill="currentColor" fillOpacity={0.15} /> : <span className="text-5xl font-extrabold font-serif">7</span>}
      </div>
    </div>
  );
}

export default function Slots() {
  const { user, updateCredits } = useAuth();
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState(['cherry', 'lemon', 'bell']);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [plays, pushPlay] = useLastPlays();

  const spin = async () => {
    setError('');
    setSpinning(true);
    setResult(null);
    try {
      const spinInterval = setInterval(() => {
        setReels([randSym(), randSym(), randSym()]);
      }, 80);

      const data = await api.post('/games/slots/play', { bet });
      await sleep(900);
      clearInterval(spinInterval);

      setReels(data.details.reels);
      setResult({ ...data, bet });
      updateCredits(data.newBalance);
      pushPlay({ outcome: data.outcome, multiplier: data.multiplier });
    } catch (err) {
      setError(err.message);
    } finally {
      setSpinning(false);
    }
  };

  return (
    <GameShell
      error={error}
      idle={!result}
      controls={
        <>
          <BetControls bet={bet} setBet={setBet} min={1} max={500} disabled={spinning} />
          <button className="btn-primary w-full" onClick={spin} disabled={spinning}>
            <Sparkles size={18} /> {spinning ? 'Girando…' : 'Girar'}
          </button>
          <p className="text-xs text-slate-500">3 símbolos iguales pagan según su valor. 2 iguales dan una pequeña recompensa.</p>
        </>
      }
      table={
        <>
          <div
            className="relative p-3.5 sm:p-5 rounded-[28px] mb-4"
            style={{
              background: 'linear-gradient(155deg, rgb(var(--gold-400)) 0%, rgb(var(--gold-600)) 45%, rgb(var(--gold-400)) 100%)',
              boxShadow: '0 0 0 3px rgba(0,0,0,0.35) inset, 0 12px 30px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="rounded-[20px] p-4 sm:p-6"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.07), transparent 60%), #100c14',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
              }}
            >
              <div className="flex gap-3 justify-center">
                {reels.map((s, i) => (
                  <Reel key={i} symbol={s} spinning={spinning} />
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card !bg-white/[0.03] w-full flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2 shrink-0">
              <Coins size={16} className="text-gold-400" />
              <span className="text-sm font-bold text-white tabular-nums">
                {Number(user?.credits ?? 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 justify-center max-w-[220px]">
              <button disabled={spinning} onClick={() => setBet((b) => Math.max(1, Math.round(b / 2)))} className="btn-secondary !px-2.5 !py-1.5 text-[11px] font-bold">
                ½
              </button>
              <span className="input-field !py-1.5 text-center font-bold text-sm flex-1">{bet}</span>
              <button disabled={spinning} onClick={() => setBet((b) => Math.min(500, b * 2))} className="btn-secondary !px-2.5 !py-1.5 text-[11px] font-bold">
                2X
              </button>
            </div>
            <button
              onClick={spin}
              disabled={spinning}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-base-950 flex items-center justify-center shadow-glow shrink-0 disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all"
            >
              <Sparkles size={18} />
            </button>
          </div>

          {result && <div className="mt-4 w-full"><ResultBanner result={result} /></div>}
        </>
      }
      history={<LastPlaysList plays={plays} />}
    />
  );
}

function randSym() {
  return SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)];
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
