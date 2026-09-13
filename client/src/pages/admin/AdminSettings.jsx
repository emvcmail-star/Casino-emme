import React, { useEffect, useState } from 'react';
import { Save, ShieldAlert } from 'lucide-react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminSettings() {
  const toast = useToast();
  const [startingCredits, setStartingCredits] = useState('');

  useEffect(() => {
    api.get('/admin/settings').then((d) => setStartingCredits(d.settings.startingCredits)).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await api.patch('/admin/settings', { startingCredits: Number(startingCredits) });
      toast.success('Configuración guardada');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Layout mode="admin" title="Settings" subtitle="Configuración general de la plataforma demo">
      <div className="glass-card p-4 mb-6 border-amber-400/20 bg-amber-400/5 flex items-start gap-3 max-w-xl">
        <ShieldAlert className="text-amber-300 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-amber-200">
          Esta plataforma es una demostración: no procesa pagos reales ni permite depósitos o retiros. Todos los ajustes afectan
          únicamente a créditos virtuales.
        </p>
      </div>

      <div className="glass-card p-6 max-w-md space-y-4">
        <div>
          <label className="label-field">Créditos iniciales al registrarse</label>
          <input
            type="number"
            className="input-field"
            value={startingCredits}
            onChange={(e) => setStartingCredits(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Cantidad de créditos virtuales que reciben las nuevas cuentas demo automáticamente.
          </p>
        </div>
        <button className="btn-primary" onClick={save}>
          <Save size={18} /> Guardar
        </button>
      </div>
    </Layout>
  );
}
