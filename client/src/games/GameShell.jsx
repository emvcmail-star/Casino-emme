import React from 'react';
import { Coins } from 'lucide-react';

export default function GameShell({ controls, table, history, error, idle, idleMessage }) {
  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-6">
      <div className="glass-card p-5 h-fit space-y-4">{controls}</div>
      <div className="space-y-4">
        <div className="glass-card p-6 min-h-[320px] flex flex-col items-center justify-center relative overflow-hidden">
          <Coins size={140} className="absolute -bottom-6 -left-8 text-white/[0.04] -rotate-12 pointer-events-none select-none" />
          <Coins size={140} className="absolute -bottom-8 -right-6 text-white/[0.04] rotate-[18deg] pointer-events-none select-none" />

          {idle && (
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase z-10">
              {idleMessage || 'Los resultados del juego aparecerán aquí'}
            </p>
          )}

          {table}

          <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.35em] text-white/[0.06] uppercase pointer-events-none select-none whitespace-nowrap">
            Casino de Emme
          </p>
        </div>
        {error && <p className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">{error}</p>}
        <div className="glass-card p-4">
          <h4 className="text-sm font-semibold text-slate-400 mb-2">Últimas jugadas</h4>
          {history}
        </div>
      </div>
    </div>
  );
}
