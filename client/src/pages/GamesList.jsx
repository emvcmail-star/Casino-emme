import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import GameCard, { GAME_META } from '../components/GameCard.jsx';
import { SkeletonGrid } from '../components/Skeleton.jsx';
import { api } from '../api/client.js';

export default function GamesList() {
  const [games, setGames] = useState(null);

  useEffect(() => {
    api.get('/games').then((d) => setGames(d.games)).catch(() => {});
  }, []);

  return (
    <Layout title="Games" subtitle="16 juegos de casino con créditos virtuales">
      {!games ? (
        <SkeletonGrid count={15} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map((g) => (
            <GameCard key={g.game_key} game={{ ...g, ...GAME_META[g.game_key] }} />
          ))}
        </div>
      )}
    </Layout>
  );
}
