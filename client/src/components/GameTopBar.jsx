import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, BookOpen, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useSound } from '../context/SoundContext.jsx';

export default function GameTopBar({ name, icon: Icon }) {
  const { muted, setMuted } = useSound();

  return (
    <div className="glass-card flex items-center justify-between px-4 py-3 mb-5 border-neon-400/20">
      <Link to="/games" className="flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white transition-colors shrink-0">
        <ChevronLeft size={16} /> Ver todo
      </Link>

      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-neon-400/10 border border-neon-400/30 shadow-glow-neon flex items-center justify-center text-neon-400 shrink-0">
          {Icon ? <Icon size={16} strokeWidth={1.75} /> : <Sparkles size={16} strokeWidth={1.75} />}
        </div>
        <p className="font-bold text-white tracking-wide uppercase truncate">{name}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
          <BookOpen size={15} /> Guía
        </button>
        <button onClick={() => setMuted((m) => !m)} title={muted ? 'Activar sonido' : 'Silenciar'} className="text-slate-400 hover:text-white transition-colors">
          {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
      </div>
    </div>
  );
}
