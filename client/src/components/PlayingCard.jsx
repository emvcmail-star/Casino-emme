import React from 'react';
import { Heart, Diamond, Club, Spade } from 'lucide-react';

const SUIT_ICON = { '♥': Heart, '♦': Diamond, '♣': Club, '♠': Spade };

export default function PlayingCard({ rank, suit, hidden, className = 'w-16 h-24' }) {
  if (hidden || !rank) {
    return <div className={`card-back ${className}`} />;
  }
  const isRed = suit === '♥' || suit === '♦';
  const Icon = SUIT_ICON[suit];
  return (
    <div className={`card-face ${className} ${isRed ? 'text-crimson-600' : 'text-base-900'}`}>
      <span className="absolute top-1 left-1.5 text-[10px] font-extrabold leading-none flex flex-col items-center gap-0.5">
        <span>{rank}</span>
        {Icon && <Icon size={8} fill="currentColor" strokeWidth={0} />}
      </span>
      {Icon ? (
        <Icon size={Math.max(20, Math.round(parseInt(className.match(/h-(\d+)/)?.[1] || '16', 10) * 1.6))} fill="currentColor" strokeWidth={0} />
      ) : (
        <span className="text-xl font-extrabold">
          {rank}
          {suit}
        </span>
      )}
    </div>
  );
}
