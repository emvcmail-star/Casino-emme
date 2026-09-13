import React, { useEffect, useState } from 'react';
import { Users, Ban, Gamepad2, Coins, TrendingUp, TrendingDown } from 'lucide-react';
import Layout from '../../components/Layout.jsx';
import StatCard from '../../components/StatCard.jsx';
import { SkeletonRows } from '../../components/Skeleton.jsx';
import { GAME_META } from '../../components/GameCard.jsx';
import { api } from '../../api/client.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(setStats).catch(() => {});
  }, []);

  return (
    <Layout mode="admin" title="Admin Dashboard" subtitle="Visión general de la plataforma">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Jugadores totales" value={stats?.totals.totalPlayers ?? 0} loading={!stats} />
        <StatCard icon={Ban} label="Jugadores bloqueados" value={stats?.totals.blockedPlayers ?? 0} accent="text-rose-400" loading={!stats} />
        <StatCard icon={Gamepad2} label="Partidas jugadas" value={stats?.totals.totalGamesPlayed ?? 0} loading={!stats} />
        <StatCard
          icon={Coins}
          label="Créditos en circulación"
          value={Number(stats?.totals.creditsInCirculation ?? 0).toLocaleString('es-ES')}
          accent="text-amber-300"
          loading={!stats}
        />
        <StatCard
          icon={TrendingUp}
          label="Total apostado"
          value={Number(stats?.totals.totalWagered ?? 0).toLocaleString('es-ES')}
          loading={!stats}
        />
        <StatCard
          icon={TrendingDown}
          label="Total pagado"
          value={Number(stats?.totals.totalPaidOut ?? 0).toLocaleString('es-ES')}
          accent="text-emerald-400"
          loading={!stats}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Rendimiento por juego</h3>
          {!stats ? (
            <SkeletonRows count={6} />
          ) : (
            <div className="glass-card divide-y divide-white/5">
              {stats.byGame.map((g) => (
                <div key={g.game_key} className="flex items-center justify-between px-4 py-3">
                  <span className="text-white font-medium flex items-center gap-2">
                    {GAME_META[g.game_key]?.icon
                      ? React.createElement(GAME_META[g.game_key].icon, { size: 15, className: 'text-gold-400 shrink-0' })
                      : null}
                    {GAME_META[g.game_key]?.name || g.game_key}
                  </span>
                  <span className="text-xs text-slate-500">{g.plays} partidas</span>
                  <span className="text-sm text-slate-300 tabular-nums">{g.wagered} apostado</span>
                  <span className="text-sm text-emerald-400 tabular-nums">{g.paidOut} pagado</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Actividad reciente del admin</h3>
          {!stats ? (
            <SkeletonRows count={6} />
          ) : stats.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 glass-card p-4">Sin actividad registrada todavía.</p>
          ) : (
            <div className="glass-card divide-y divide-white/5">
              {stats.recentActivity.map((a) => (
                <div key={a.id} className="px-4 py-3">
                  <p className="text-sm text-white">
                    <span className="font-semibold">{a.admin_username}</span> — {a.action} {a.target ? `→ ${a.target}` : ''}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString('es-ES')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
