import React from 'react';

export default function GameShell({ controls, table, history, error }) {
  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-6">
      <div className="glass-card p-5 h-fit space-y-4">{controls}</div>
      <div className="space-y-4">
        <div className="glass-card p-6 min-h-[320px] flex flex-col items-center justify-center relative overflow-hidden">
          {table}
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
