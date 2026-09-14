import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, TrendingDown, TrendingUp, Coins, ShieldCheck, Ticket, Gamepad } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import GameCard, { GAME_META } from '../components/GameCard.jsx';
import { SkeletonGrid } from '../components/Skeleton.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const HERO_BG = 'https://images.unsplash.com/photo-1670659215634-213e8d03fccb?auto=format&fit=crop&w=1800&q=80';

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
      <div className="mb-8 rounded-3xl relative overflow-hidden border border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_BG}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-base-950/95 via-base-950/85 to-base-950/50" />
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-neon-400/20 blur-3xl pointer-events-none" />

        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          <span className="pill bg-neon-400/10 text-neon-400 border border-neon-400/30 mb-5">
            <ShieldCheck size={14} /> Créditos 100% virtuales · sin dinero real
          </span>

          <h1 className="font-serif font-extrabold text-3xl sm:text-5xl text-white leading-tight max-w-xl">
            La plataforma líder de casino social
          </h1>
          <p className="text-slate-400 mt-3 max-w-md">
            Hola {user?.username}, bienvenido de nuevo a Casino de Emme. Juega, sube de nivel y compite sin arriesgar un solo peso real.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <div className="glass-card !bg-white/[0.04] flex items-center gap-2.5 px-5 py-3">
              <Coins className="text-neon-300" size={22} />
              <div>
                <p className="text-lg font-extrabold text-white leading-none tabular-nums">
                  {Number(user?.credits ?? 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">créditos virtuales</p>
              </div>
            </div>
            <Link to="/promo-codes" className="btn-primary">
              <Ticket size={17} /> Canjear código promocional
            </Link>
            <Link to="/games" className="btn-secondary">
              <Gamepad size={17} /> Ver todos los juegos →
            </Link>
          </div>
        </div>
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
        <h2 className="text-lg font-bold text-white">Juegos destacados</h2>
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
