import React from 'react';

export default function PlaneIcon({ size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="currentColor">
      <path d="M42 24 L48 24 L42 20 Z" opacity="0.85" />
      <ellipse cx="24" cy="24" rx="18" ry="5" />
      <path d="M20 24 L8 11 L15 12 L27 21 Z" opacity="0.85" />
      <path d="M20 24 L8 37 L15 36 L27 27 Z" opacity="0.85" />
      <path d="M8 24 L2 17 L3 24 Z" opacity="0.7" />
      <path d="M8 24 L2 31 L3 24 Z" opacity="0.7" />
      <path d="M9 22 L5 12 L11 17 Z" opacity="0.7" />
      <circle cx="31" cy="23.5" r="2.2" fill="#1e293b" />
    </svg>
  );
}
