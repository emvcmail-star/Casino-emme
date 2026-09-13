import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound } from 'lucide-react';
import { api } from '../api/client.js';
import { AuthShell } from './Login.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ForgotPassword() {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');

  const requestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/auth/forgot-password', { email });
      setInfo(data.message);
      if (data.simulatedResetCode) {
        setCode(data.simulatedResetCode);
        setStep(2);
        toast.info('Código de recuperación simulado generado');
      } else {
        toast.info(data.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, simulatedResetCode: code, newPassword });
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.');
      setStep(3);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h2 className="text-2xl font-extrabold text-white mb-1">Recuperar contraseña</h2>
      <p className="text-sm text-slate-500 mb-6">
        Flujo simulado: no se envía ningún correo real.
      </p>

      {step === 1 && (
        <form onSubmit={requestReset} className="space-y-4">
          <div>
            <label className="label-field">Email de tu cuenta</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            <Mail size={18} /> {loading ? 'Enviando…' : 'Generar código simulado'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={resetPassword} className="space-y-4">
          <div className="glass-card !bg-gold-500/5 border-gold-500/20 p-3 text-xs text-slate-300 font-mono break-all">
            Código simulado: {code}
          </div>
          <div>
            <label className="label-field">Nueva contraseña</label>
            <input
              type="password"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={4}
            />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            <KeyRound size={18} /> {loading ? 'Actualizando…' : 'Restablecer contraseña'}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center py-4">
          <p className="text-slate-300 mb-4">Tu contraseña se actualizó correctamente.</p>
          <Link to="/login" className="btn-primary w-full">
            Ir a iniciar sesión
          </Link>
        </div>
      )}

      {info && step === 1 && <p className="text-xs text-slate-500 mt-4">{info}</p>}

      <p className="text-center text-sm text-slate-500 mt-6">
        <Link to="/login" className="text-gold-400 hover:text-gold-300 font-semibold">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
