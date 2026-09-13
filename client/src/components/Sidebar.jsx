import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, Gamepad2, Gift, Ticket, History, LogOut, ShieldCheck,
  Users, Coins, Settings2, ClipboardList, ReceiptText, SlidersHorizontal, X, Spade, Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import UserAvatar from './UserAvatar.jsx';

const USER_LINKS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/bonuses', label: 'Bonuses', icon: Gift },
  { to: '/promo-codes', label: 'Promo Codes', icon: Ticket },
  { to: '/history', label: 'History', icon: History },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/credits', label: 'Credits', icon: Coins },
  { to: '/admin/games', label: 'Games', icon: Gamepad2 },
  { to: '/admin/game-configuration', label: 'Game Configuration', icon: SlidersHorizontal },
  { to: '/admin/promo-codes', label: 'Promo Codes', icon: Ticket },
  { to: '/admin/transactions', label: 'Transactions', icon: ReceiptText },
  { to: '/admin/activity-log', label: 'Activity Log', icon: ClipboardList },
  { to: '/admin/settings', label: 'Settings', icon: Settings2 },
];

export default function Sidebar({ mode = 'user', open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = mode === 'admin' ? ADMIN_LINKS : USER_LINKS;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 shrink-0 z-40 transition-transform duration-300 lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'} bg-base-900/95 lg:bg-white/[0.02] backdrop-blur-xl border-r border-white/10 flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500 to-gold-300 flex items-center justify-center shadow-glow text-base-950">
              <Spade size={18} strokeWidth={2} fill="currentColor" />
            </div>
            <div>
              <p className="font-bold text-white leading-none font-serif tracking-wide">Casino de Emme</p>
              <p className="text-[11px] text-gold-400 font-semibold tracking-wide">CRÉDITOS VIRTUALES</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {mode === 'admin' && (
          <div className="mx-4 mb-2 pill bg-amber-400/10 text-amber-300 border border-amber-400/20">
            <ShieldCheck size={14} /> Panel de administrador
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-gold-600/30 to-gold-500/10 text-white border border-gold-500/30 shadow-glow'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          {mode === 'user' && user?.role === 'admin' && (
            <NavLink to="/admin" className="btn-secondary w-full mb-3 !py-2 text-xs">
              <ShieldCheck size={15} /> Ir al panel admin
            </NavLink>
          )}
          {mode === 'admin' && (
            <NavLink to="/dashboard" className="btn-secondary w-full mb-3 !py-2 text-xs">
              <Gamepad2 size={15} /> Volver al casino
            </NavLink>
          )}
          <div className="flex items-center gap-3 mb-3">
            <UserAvatar avatar={user?.avatar} username={user?.username} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary w-full !py-2 text-sm text-rose-300 hover:text-rose-200">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
