import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import Layout from '../../components/Layout.jsx';
import { SkeletonRows } from '../../components/Skeleton.jsx';
import { GAME_META } from '../../components/GameCard.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminGames() {
  const toast = useToast();
  const [games, setGames] = useState(null);

  const load = () => api.get('/admin/games').then((d) => setGames(d.games));

  useEffect(() => {
    load();
  }, []);

  const toggle = async (g) => {
    try {
      await api.patch(`/admin/games/${g.game_key}`, { enabled: g.enabled ? 0 : 1 });
      toast.success(g.enabled ? `${g.name} desactivado` : `${g.name} activado`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Layout mode="admin" title="Games" subtitle="Activa o desactiva juegos para pruebas">
      {!games ? (
        <SkeletonRows count={6} height="h-16" />
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {games.map((g) => (
            <div key={g.game_key} className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">{GAME_META[g.game_key]?.emoji}</span>
                <div className="min-w-0">
                  <p className="text-white font-medium">{g.name}</p>
                  <p className="text-xs text-slate-500">
                    RTP {g.rtp}% · Apuesta {g.min_bet}-{g.max_bet}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/admin/game-configuration" className="btn-secondary !py-1.5 !px-3 text-xs">
                  <SlidersHorizontal size={13} /> Configurar
                </Link>
                <button
                  onClick={() => toggle(g)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${g.enabled ? 'bg-electric-500' : 'bg-white/10'}`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${g.enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
