import { useState, useCallback } from 'react';

export function useLastPlays(max = 10) {
  const [plays, setPlays] = useState([]);
  const push = useCallback(
    (entry) => {
      setPlays((p) => [entry, ...p].slice(0, max));
    },
    [max]
  );
  return [plays, push];
}

export function LastPlaysList({ plays, render }) {
  if (plays.length === 0) return <p className="text-sm text-slate-600">Aún no hay jugadas en esta sesión.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {plays.map((p, i) => (
        <div
          key={i}
          className={`pill ${
            p.outcome === 'win' ? 'bg-emerald-400/10 text-emerald-300' : p.outcome === 'push' ? 'bg-slate-400/10 text-slate-300' : 'bg-rose-400/10 text-rose-300'
          }`}
        >
          {render ? render(p) : `x${Number(p.multiplier).toFixed(2)}`}
        </div>
      ))}
    </div>
  );
}
