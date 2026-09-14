import React, { useEffect, useState } from 'react';
import { Gamepad2, Trophy, TrendingDown, Coins, Calendar, Ticket, Palette, Check } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import { AVATAR_ICONS, AVATAR_KEYS } from '../components/avatars.js';
import { SkeletonRows } from '../components/Skeleton.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const { accent, setAccent, accents } = useTheme();
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
    <Layout title="Profile" subtitle="Tu perfil de jugador">
      <div className="glass-card p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="rounded-2xl bg-gradient-to-br from-gold-600/30 to-gold-400/10 border border-gold-500/20 shrink-0 p-0.5">
          <UserAvatar avatar={user?.avatar} username={user?.username} size={78} className="!rounded-[14px] border-0" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white font-serif">{user?.username}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
            <Calendar size={13} /> Miembro desde {new Date(user?.created_at).toLocaleDateString('es-ES')}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
          {AVATAR_KEYS.map((a) => {
            const Icon = AVATAR_ICONS[a];
            return (
              <button
                key={a}
                onClick={() => changeAvatar(a)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  user?.avatar === a ? 'bg-gold-500/30 border border-gold-400/50 text-gold-300' : 'bg-white/5 hover:bg-white/10 text-slate-400'
                }`}
              >
                <Icon size={17} strokeWidth={1.75} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Coins} label="Créditos virtuales" value={Number(user?.credits ?? 0).toLocaleString('es-ES')} accent="text-amber-300" />
        <StatCard icon={Gamepad2} label="Total de partidas" value={data?.stats.totalGames ?? 0} loading={!data} />
        <StatCard icon={Trophy} label="Victorias" value={data?.stats.wins ?? 0} accent="text-emerald-400" loading={!data} />
        <StatCard icon={TrendingDown} label="Derrotas" value={data?.stats.losses ?? 0} accent="text-rose-400" loading={!data} />
      </div>

      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Palette size={18} className="text-gold-400" /> Color del neón
      </h3>
      <div className="glass-card p-4 mb-8">
        <p className="text-sm text-slate-500 mb-3">Elige el color de acento de toda la plataforma. Se guarda en este dispositivo.</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(accents).map(([key, a]) => (
            <button
              key={key}
              onClick={() => setAccent(key)}
              title={a.label}
              className="flex flex-col items-center gap-1.5 group"
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all group-hover:scale-110"
                style={{
                  backgroundColor: a.swatch,
                  borderColor: accent === key ? '#fff' : 'transparent',
                  boxShadow: accent === key ? `0 0 16px ${a.swatch}` : 'none',
                }}
              >
                {accent === key && <Check size={16} className="text-base-950" strokeWidth={3} />}
              </span>
              <span className={`text-[10px] font-medium ${accent === key ? 'text-white' : 'text-slate-500'}`}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Ticket size={18} className="text-gold-400" /> Códigos promocionales utilizados
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
