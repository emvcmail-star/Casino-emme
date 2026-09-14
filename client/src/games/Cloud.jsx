import React from 'react';

export default function Cloud({ className = '', style }) {
  return (
    <div className={`relative ${className}`} style={style}>
      <div className="absolute inset-0 bg-white/70 rounded-full" />
      <div className="absolute -top-2 left-3 w-1/2 h-full bg-white/70 rounded-full" />
      <div className="absolute -top-1 right-2 w-2/5 h-4/5 bg-white/70 rounded-full" />
    </div>
  );
}
