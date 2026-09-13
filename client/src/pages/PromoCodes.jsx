import React, { useState } from 'react';
import { Ticket, Gift } from 'lucide-react';
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
          <Ticket className="text-gold-400" size={20} /> Canjear código
        </h3>
        <p className="text-sm text-slate-500 mb-4">Introduce un código promocional para recibir créditos virtuales.</p>
        <form onSubmit={redeem} className="flex gap-2">
          <input
            className="input-field font-mono uppercase"
            placeholder="Ingresa tu código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn-primary shrink-0" disabled={loading}>
            {loading ? 'Canjeando…' : 'Canjear'}
          </button>
        </form>
      </div>

      <div className="glass-card p-5 max-w-lg flex items-start gap-3 text-sm text-slate-400">
        <Gift className="text-gold-400 shrink-0" size={20} />
        <p>
          Los códigos promocionales son secretos y se reparten por tiempo limitado en promociones,
          redes sociales y eventos especiales. Si tienes uno, canjéalo arriba antes de que expire.
        </p>
      </div>
    </Layout>
  );
}
