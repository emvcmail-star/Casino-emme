import React from 'react';
import { AVATAR_ICONS, initialOf } from './avatars.js';

export default function UserAvatar({ avatar, username, size = 36, className = '' }) {
  const Icon = AVATAR_ICONS[avatar];
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-gold-500/25 to-gold-400/5 border border-gold-500/25 flex items-center justify-center text-gold-300 shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {Icon ? (
        <Icon size={Math.round(size * 0.52)} strokeWidth={1.75} />
      ) : (
        <span className="font-bold font-serif" style={{ fontSize: size * 0.42 }}>
          {initialOf(username)}
        </span>
      )}
    </div>
  );
}
