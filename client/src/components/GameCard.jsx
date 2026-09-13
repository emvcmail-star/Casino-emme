import React from 'react';
import { Link } from 'react-router-dom';
import {
  Play, Ban, Sparkles, Disc, Spade, Layers, Dice5, Bomb, CircleDot,
  Rocket, Disc3, Coins, Grid3x3, ArrowUpDown, TrendingUp, Building2, Club,
} from 'lucide-react';

export default function GameCard({ game }) {
  const disabled = game.enabled === 0 || game.enabled === false;
  const Icon = game.icon || Sparkles;
  const content = (
    <div
      className={`glass-card p-5 h-full flex flex-col justify-between relative overflow-hidden group ${
        disabled ? 'opacity-50' : 'glass-card-hover cursor-pointer'
      }`}
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gold-500/15 blur-2xl group-hover:bg-gold-500/25 transition-all" />
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/25 to-gold-400/5 border border-gold-500/20 flex items-center justify-center mb-3 text-gold-300">
          <Icon size={22} strokeWidth={1.75} />
        </div>
        <h3 className="font-bold text-white text-lg font-serif">{game.name}</h3>
        <p className="text-xs text-slate-500 mt-1">RTP {game.rtp}%</p>
      </div>
      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {game.min_bet}–{game.max_bet} créditos
        </span>
        <span
          className={`pill ${disabled ? 'bg-rose-400/10 text-rose-300' : 'bg-gold-500/15 text-gold-300'}`}
        >
          {disabled ? (
            <>
              <Ban size={12} /> Desactivado
            </>
          ) : (
            <>
              <Play size={12} /> Jugar
            </>
          )}
        </span>
      </div>
    </div>
  );

  if (disabled) return content;
  return (
    <Link to={`/games/${game.game_key}`} className="block h-full">
      {content}
    </Link>
  );
}

export const GAME_META = {
  slots: { name: 'Slots', icon: Sparkles },
  roulette: { name: 'Roulette', icon: Disc },
  blackjack: { name: 'Blackjack', icon: Spade },
  baccarat: { name: 'Baccarat', icon: Layers },
  dice: { name: 'Dice', icon: Dice5 },
  mines: { name: 'Mines', icon: Bomb },
  plinko: { name: 'Plinko', icon: CircleDot },
  crash: { name: 'Crash', icon: Rocket },
  wheel: { name: 'Wheel', icon: Disc3 },
  coinflip: { name: 'Coin Flip', icon: Coins },
  keno: { name: 'Keno', icon: Grid3x3 },
  hilo: { name: 'Hi-Lo', icon: ArrowUpDown },
  limbo: { name: 'Limbo', icon: TrendingUp },
  towers: { name: 'Towers', icon: Building2 },
  videopoker: { name: 'Video Poker', icon: Club },
};
