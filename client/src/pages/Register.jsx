import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, PartyPopper } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { AuthShell } from './Login.jsx';
import Modal from '../components/Modal.jsx';
import { bigWinConfetti } from '../components/confetti.js';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [welcome, setWelcome] = useState(null);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register(form.username, form.email, form.password);
      setWelcome(data.welcomeBonus);
      setTimeout(() => bigWinConfetti(), 200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h2 className="text-2xl font-extrabold text-white mb-1">Crea tu cuenta</h2>
      <p className="text-sm text-slate-500 mb-6">
        Datos ficticios, sin verificación real. Juega con créditos virtuales sin valor monetario.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label-field">Nombre de usuario</label>
          <input className="input-field" value={form.username} onChange={update('username')} required minLength={3} />
        </div>
        <div>
          <label className="label-field">Email (puede ser ficticio)</label>
          <input type="email" className="input-field" value={form.email} onChange={update('email')} required />
        </div>
        <div>
          <label className="label-field">Contraseña</label>
          <input
            type="password"
            className="input-field"
            value={form.password}
            onChange={update('password')}
            required
            minLength={4}
          />
        </div>

        {error && <p className="text-sm text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">{error}</p>}

        <button className="btn-primary w-full" disabled={loading}>
          <UserPlus size={18} /> {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-gold-400 hover:text-gold-300 font-semibold">
          Inicia sesión
        </Link>
      </p>

      <Modal open={!!welcome} onClose={() => navigate('/dashboard')} title="¡Cuenta creada!">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gold-500/20 flex items-center justify-center mb-4 animate-pulse-glow">
            <PartyPopper className="text-gold-300" size={30} />
          </div>
          <p className="text-slate-300 mb-1">Bono de bienvenida acreditado</p>
          <p className="text-4xl font-extrabold text-white mb-1">+{welcome?.toLocaleString('es-ES')}</p>
          <p className="text-xs text-slate-500 mb-6">créditos virtuales · sin valor monetario real</p>
          <button className="btn-primary w-full" onClick={() => navigate('/dashboard')}>
            Ir al casino
          </button>
        </div>
      </Modal>
    </AuthShell>
  );
}
