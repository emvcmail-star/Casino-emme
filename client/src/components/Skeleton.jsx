import React from 'react';

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-40" />
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5, height = 'h-12' }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton ${height}`} />
      ))}
    </div>
  );
}
