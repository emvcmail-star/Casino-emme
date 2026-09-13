import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { GAME_META } from '../components/GameCard.jsx';

import Slots from '../games/Slots.jsx';
import Roulette from '../games/Roulette.jsx';
import Blackjack from '../games/Blackjack.jsx';
import Baccarat from '../games/Baccarat.jsx';
import Dice from '../games/Dice.jsx';
import Mines from '../games/Mines.jsx';
import Plinko from '../games/Plinko.jsx';
import Crash from '../games/Crash.jsx';
import Wheel from '../games/Wheel.jsx';
import CoinFlip from '../games/CoinFlip.jsx';
import Keno from '../games/Keno.jsx';
import HiLo from '../games/HiLo.jsx';
import Limbo from '../games/Limbo.jsx';
import Towers from '../games/Towers.jsx';
import VideoPoker from '../games/VideoPoker.jsx';

const REGISTRY = {
  slots: Slots,
  roulette: Roulette,
  blackjack: Blackjack,
  baccarat: Baccarat,
  dice: Dice,
  mines: Mines,
  plinko: Plinko,
  crash: Crash,
  wheel: Wheel,
  coinflip: CoinFlip,
  keno: Keno,
  hilo: HiLo,
  limbo: Limbo,
  towers: Towers,
  videopoker: VideoPoker,
};

export default function GamePage() {
  const { key } = useParams();
  const Game = REGISTRY[key];
  const meta = GAME_META[key];

  if (!Game) return <Navigate to="/games" replace />;

  return (
    <Layout title={meta?.name || key} subtitle="Créditos virtuales, sin valor monetario">
      <Game gameKey={key} />
    </Layout>
  );
}
