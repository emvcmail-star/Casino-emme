import React from 'react';

export default function StatCard({ icon: Icon, label, value, accent = 'text-gold-400', loading }) {
  return (
    <div className="glass-card glass-card-hover p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-medium text-slate-400">{label}</span>
        {Icon && <Icon size={18} className={accent} />}
      </div>
      {loading ? (
        <div className="skeleton h-7 w-24" />
      ) : (
        <p className="text-xl sm:text-2xl font-extrabold text-white tabular-nums">{value}</p>
      )}
    </div>
  );
}
