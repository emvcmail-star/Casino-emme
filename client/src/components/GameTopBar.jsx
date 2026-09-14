import React from 'react';
import { Sparkles } from 'lucide-react';

export default function GameTopBar({ name, icon: Icon, rtp }) {
  return (
    <div className="glass-card flex items-center justify-between px-4 py-3 mb-5 border-neon-400/20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-neon-400/10 border border-neon-400/30 shadow-glow-neon flex items-center justify-center text-neon-400 shrink-0">
          {Icon ? <Icon size={18} strokeWidth={1.75} /> : <Sparkles size={18} strokeWidth={1.75} />}
        </div>
        <p className="font-bold text-white font-serif">{name}</p>
      </div>
      {rtp !== undefined && <span className="pill bg-neon-400/10 text-neon-400 border border-neon-400/20">RTP {rtp}%</span>}
    </div>
  );
}
