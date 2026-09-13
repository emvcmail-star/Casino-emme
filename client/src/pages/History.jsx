import React, { useEffect, useState } from 'react';
import { GAME_META } from '../components/GameCard.jsx';
import Layout from '../components/Layout.jsx';
import { SkeletonRows } from '../components/Skeleton.jsx';
import { api } from '../api/client.js';

export default function History() {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    api.get('/users/history?limit=100').then((d) => setHistory(d.history)).catch(() => {});
  }, []);

  return (
    <Layout title="History" subtitle="Historial de tus últimas partidas">
      {!history ? (
        <SkeletonRows count={8} height="h-14" />
      ) : history.length === 0 ? (
        <p className="text-sm text-slate-500 glass-card p-6 text-center">
          Todavía no has jugado ninguna partida. ¡Ve a Games y prueba suerte!
        </p>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="px-4 py-3 font-medium">Juego</th>
                <th className="px-4 py-3 font-medium">Apuesta</th>
                <th className="px-4 py-3 font-medium">Multiplicador</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Resultado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                    {GAME_META[h.game_key]?.icon
                      ? React.createElement(GAME_META[h.game_key].icon, { size: 15, className: 'text-gold-400 shrink-0' })
                      : null}
                    {GAME_META[h.game_key]?.name || h.game_key}
                  </td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">{h.bet_amount}</td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">x{Number(h.multiplier).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">{h.payout}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`pill ${
                        h.outcome === 'win'
                          ? 'bg-emerald-400/10 text-emerald-300'
                          : h.outcome === 'push'
                          ? 'bg-slate-400/10 text-slate-300'
                          : 'bg-rose-400/10 text-rose-300'
                      }`}
                    >
                      {h.outcome === 'win' ? 'Ganada' : h.outcome === 'push' ? 'Empate' : 'Perdida'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(h.created_at).toLocaleString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
