import React from 'react';
import { Menu, Coins, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSound } from '../context/SoundContext.jsx';

export default function Topbar({ title, subtitle, onMenu }) {
  const { user } = useAuth();
  const { muted, setMuted } = useSound();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-base-950/70 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenu} className="lg:hidden text-slate-300">
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-white truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-slate-500 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMuted((m) => !m)}
          title={muted ? 'Activar sonido' : 'Silenciar'}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 shrink-0"
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <div className="glass-card flex items-center gap-2 px-4 py-2 border-amber-400/20">
          <Coins size={18} className="text-amber-300" />
          <span className="font-bold text-white tabular-nums">
            {Number(user?.credits ?? 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">créditos</span>
        </div>
      </div>
    </header>
  );
}
