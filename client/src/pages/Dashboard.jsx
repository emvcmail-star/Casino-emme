import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, TrendingDown, TrendingUp, Coins } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import GameCard, { GAME_META } from '../components/GameCard.jsx';
import { SkeletonGrid } from '../components/Skeleton.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState(null);

  useEffect(() => {
    api.get('/users/profile').then((d) => setStats(d.stats)).catch(() => {});
    api.get('/games').then((d) => setGames(d.games)).catch(() => {});
  }, []);

  return (
    <Layout title={`Welcome back, ${user?.username}`} subtitle="Panel principal de tu cuenta">
      <div className="mb-6 glass-card p-5 sm:p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1708919166614-60f3d21b4284?auto=format&fit=crop&w=1400&q=70')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-base-900/95 via-base-900/70 to-transparent" />
        <div className="relative">
          <p className="text-sm text-slate-400 mb-1">Saldo de créditos virtuales</p>
          <p className="text-4xl font-extrabold text-white flex items-center gap-2 font-serif">
            <Coins className="text-gold-300" size={30} />
            {Number(user?.credits ?? 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <Link to="/promo-codes" className="btn-primary relative">
          Canjear código promocional
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Gamepad2} label="Total de partidas" value={stats?.totalGames ?? 0} loading={!stats} />
        <StatCard icon={Trophy} label="Victorias" value={stats?.wins ?? 0} accent="text-emerald-400" loading={!stats} />
        <StatCard icon={TrendingDown} label="Derrotas" value={stats?.losses ?? 0} accent="text-rose-400" loading={!stats} />
        <StatCard
          icon={TrendingUp}
          label="Créditos ganados"
          value={(stats?.creditsWon ?? 0).toLocaleString('es-ES')}
          accent="text-amber-300"
          loading={!stats}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Juegos disponibles</h2>
        <Link to="/games" className="text-sm text-gold-400 hover:text-gold-300 font-medium">
          Ver todos →
        </Link>
      </div>

      {!games ? (
        <SkeletonGrid count={8} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.slice(0, 8).map((g) => (
            <GameCard key={g.game_key} game={{ ...g, ...GAME_META[g.game_key] }} />
          ))}
        </div>
      )}
    </Layout>
  );
}
