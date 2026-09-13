import React, { useEffect, useState } from 'react';
import { Ticket, Sparkles } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { bigWinConfetti } from '../components/confetti.js';

export default function PromoCodes() {
  const { updateCredits } = useAuth();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(null);

  useEffect(() => {
    api.get('/promo/available').then((d) => setAvailable(d.promoCodes)).catch(() => {});
  }, []);

  const redeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const data = await api.post('/promo/redeem', { code });
      updateCredits(data.newBalance);
      toast.bonus(data.message);
      bigWinConfetti();
      setCode('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Promo Codes" subtitle="Canjea códigos por créditos virtuales adicionales">
      <div className="glass-card p-6 mb-8 max-w-lg">
        <h3 className="font-bold text-white mb-1 flex items-center gap-2">
          <Ticket className="text-electric-400" size={20} /> Canjear código
        </h3>
        <p className="text-sm text-slate-500 mb-4">Introduce un código promocional para recibir créditos virtuales.</p>
        <form onSubmit={redeem} className="flex gap-2">
          <input
            className="input-field font-mono uppercase"
            placeholder="WELCOME100"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn-primary shrink-0" disabled={loading}>
            {loading ? 'Canjeando…' : 'Canjear'}
          </button>
        </form>
      </div>

      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Sparkles className="text-amber-300" size={18} /> Códigos activos de ejemplo
      </h3>
      {!available ? (
        <div className="skeleton h-24 max-w-lg" />
      ) : available.length === 0 ? (
        <p className="text-sm text-slate-500">No hay códigos activos por ahora.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
          {available.map((p) => (
            <div key={p.code} className="glass-card glass-card-hover p-4">
              <p className="font-mono font-bold text-electric-300 text-lg">{p.code}</p>
              <p className="text-sm text-slate-400 mt-1">+{p.credits} créditos virtuales</p>
              <p className="text-xs text-slate-600 mt-2">
                {p.uses_count}/{p.max_uses} usados
                {p.expires_at ? ` · expira ${new Date(p.expires_at).toLocaleDateString('es-ES')}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
