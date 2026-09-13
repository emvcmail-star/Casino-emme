import React, { useEffect, useState } from 'react';
import { Gamepad2, Trophy, TrendingDown, Coins, Calendar, Ticket } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import { SkeletonRows } from '../components/Skeleton.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const AVATARS = ['🎰', '🍀', '👑', '🎲', '🃏', '💎', '🔥', '⭐', '🚀', '🦊'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/users/profile').then(setData).catch(() => {});
  }, []);

  const changeAvatar = async (avatar) => {
    try {
      const res = await api.patch('/users/profile', { avatar });
      updateUser({ avatar: res.user.avatar });
      toast.success('Avatar actualizado');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Layout title="Profile" subtitle="Tu perfil de jugador demo">
      <div className="glass-card p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-electric-600/30 to-electric-400/10 border border-electric-500/20 flex items-center justify-center text-4xl shrink-0">
          {user?.avatar}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{user?.username}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
            <Calendar size={13} /> Miembro desde {new Date(user?.created_at).toLocaleDateString('es-ES')}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => changeAvatar(a)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                user?.avatar === a ? 'bg-electric-500/30 border border-electric-400/50' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Coins} label="Créditos virtuales" value={Number(user?.credits ?? 0).toLocaleString('es-ES')} accent="text-amber-300" />
        <StatCard icon={Gamepad2} label="Total de partidas" value={data?.stats.totalGames ?? 0} loading={!data} />
        <StatCard icon={Trophy} label="Victorias" value={data?.stats.wins ?? 0} accent="text-emerald-400" loading={!data} />
        <StatCard icon={TrendingDown} label="Derrotas" value={data?.stats.losses ?? 0} accent="text-rose-400" loading={!data} />
      </div>

      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Ticket size={18} className="text-electric-400" /> Códigos promocionales utilizados
      </h3>
      {!data ? (
        <SkeletonRows count={3} />
      ) : data.promoUses.length === 0 ? (
        <p className="text-sm text-slate-500 glass-card p-4">Todavía no has usado ningún código.</p>
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {data.promoUses.map((p, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <span className="font-mono text-sm text-white">{p.code}</span>
              <span className="text-sm text-emerald-400 font-semibold">+{p.credits} créditos</span>
              <span className="text-xs text-slate-500">{new Date(p.redeemed_at).toLocaleString('es-ES')}</span>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
