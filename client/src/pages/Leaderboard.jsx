import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { GAME_META } from '../components/GameCard.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import Layout from '../components/Layout.jsx';
import { SkeletonRows } from '../components/Skeleton.jsx';
import { api } from '../api/client.js';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.get('/games/leaderboard?limit=50').then((d) => setRows(d.leaderboard)).catch(() => {});
  }, []);

  return (
    <Layout title="Leaderboard" subtitle="Los multiplicadores más grandes de todo el casino">
      {!rows ? (
        <SkeletonRows count={8} height="h-14" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500 glass-card p-6 text-center">
          Todavía no hay ganadores registrados. ¡Sé el primero en aparecer aquí!
        </p>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="px-4 py-3 font-medium w-12">#</th>
                <th className="px-4 py-3 font-medium">Jugador</th>
                <th className="px-4 py-3 font-medium">Juego</th>
                <th className="px-4 py-3 font-medium">Apuesta</th>
                <th className="px-4 py-3 font-medium">Multiplicador</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-slate-400 font-bold">{MEDAL[i] || i + 1}</td>
                  <td className="px-4 py-3 text-white font-medium">
                    <div className="flex items-center gap-2">
                      <UserAvatar avatar={r.avatar} username={r.username} size={24} />
                      {r.username}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      {GAME_META[r.game_key]?.icon
                        ? React.createElement(GAME_META[r.game_key].icon, { size: 14, className: 'text-gold-400 shrink-0' })
                        : null}
                      {GAME_META[r.game_key]?.name || r.game_key}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">{r.bet_amount}</td>
                  <td className="px-4 py-3 text-emerald-300 font-bold tabular-nums">
                    <div className="flex items-center gap-1">
                      <Trophy size={13} /> x{Number(r.multiplier).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">{Number(r.payout).toLocaleString('es-ES')}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString('es-ES')}
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
