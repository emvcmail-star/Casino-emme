import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Spade } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const AUTH_BG =
  'https://images.unsplash.com/photo-1670659215634-213e8d03fccb?auto=format&fit=crop&w=1800&q=80';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('Demo123!');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Bienvenido de vuelta');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h2 className="text-2xl font-extrabold text-white mb-1">Inicia sesión</h2>
      <p className="text-sm text-slate-500 mb-6">Accede a tu cuenta. Solo créditos virtuales.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label-field">Usuario o email</label>
          <input className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label className="label-field">Contraseña</label>
          <div className="relative">
            <input
              className="input-field pr-11"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-gold-400 hover:text-gold-300">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button className="btn-primary w-full" disabled={loading}>
          <LogIn size={18} /> {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-gold-400 hover:text-gold-300 font-semibold">
          Regístrate gratis
        </Link>
      </p>

      <div className="mt-6 glass-card !bg-white/[0.03] p-3 text-xs text-slate-500">
        Acceso rápido: <span className="text-slate-300 font-mono">demo / Demo123!</span> ·{' '}
        <span className="text-slate-300 font-mono">admin / Admin123!</span>
      </div>
    </AuthShell>
  );
}

export function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${AUTH_BG})` }}
      />
      <div className="absolute inset-0 bg-base-950/85" />
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-500 to-gold-300 flex items-center justify-center shadow-glow-lg animate-pulse-glow text-base-950">
            <Spade size={22} strokeWidth={2} fill="currentColor" />
          </div>
          <div className="text-left">
            <p className="font-extrabold text-white text-lg leading-none font-serif tracking-wide">Casino de Emme</p>
            <p className="text-[11px] text-gold-400 font-bold tracking-wide">CRÉDITOS VIRTUALES</p>
          </div>
        </div>
        <div className="glass-card p-7 sm:p-8 animate-slide-up">{children}</div>
        <p className="text-center text-[11px] text-slate-600 mt-5 leading-relaxed">
          Plataforma de entretenimiento. No se procesan pagos ni apuestas reales.
          <br />
          Todos los créditos son virtuales y no tienen valor monetario.
          <br />
          <span className="text-slate-700">
            Foto:{' '}
            <a
              href="https://unsplash.com/@leo_visions_"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-slate-500"
            >
              Leo_Visions
            </a>{' '}
            / Unsplash
          </span>
        </p>
      </div>
    </div>
  );
}
