import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Ban } from 'lucide-react';

export default function GameCard({ game }) {
  const disabled = game.enabled === 0 || game.enabled === false;
  const content = (
    <div
      className={`glass-card p-5 h-full flex flex-col justify-between relative overflow-hidden group ${
        disabled ? 'opacity-50' : 'glass-card-hover cursor-pointer'
      }`}
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-electric-500/20 blur-2xl group-hover:bg-electric-500/30 transition-all" />
      <div className="relative">
        <div className="text-4xl mb-3">{game.emoji}</div>
        <h3 className="font-bold text-white text-lg">{game.name}</h3>
        <p className="text-xs text-slate-500 mt-1">RTP demo {game.rtp}%</p>
      </div>
      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {game.min_bet}–{game.max_bet} créditos
        </span>
        <span
          className={`pill ${disabled ? 'bg-rose-400/10 text-rose-300' : 'bg-electric-500/15 text-electric-300'}`}
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
  slots: { name: 'Slots', emoji: '🎰' },
  roulette: { name: 'Roulette', emoji: '🎡' },
  blackjack: { name: 'Blackjack', emoji: '🃏' },
  baccarat: { name: 'Baccarat', emoji: '💎' },
  dice: { name: 'Dice', emoji: '🎲' },
  mines: { name: 'Mines', emoji: '💣' },
  plinko: { name: 'Plinko', emoji: '⚪' },
  crash: { name: 'Crash', emoji: '🚀' },
  wheel: { name: 'Wheel', emoji: '🎡' },
  coinflip: { name: 'Coin Flip', emoji: '🪙' },
  keno: { name: 'Keno', emoji: '🔢' },
  hilo: { name: 'Hi-Lo', emoji: '🂡' },
  limbo: { name: 'Limbo', emoji: '📈' },
  towers: { name: 'Towers', emoji: '🗼' },
  videopoker: { name: 'Video Poker', emoji: '🂱' },
};
