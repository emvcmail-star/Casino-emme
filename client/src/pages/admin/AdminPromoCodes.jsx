import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Layout from '../../components/Layout.jsx';
import Modal from '../../components/Modal.jsx';
import { SkeletonRows } from '../../components/Skeleton.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminPromoCodes() {
  const toast = useToast();
  const [codes, setCodes] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', credits: 100, maxUses: 100, expiresAt: '' });

  const load = () => api.get('/admin/promo-codes').then((d) => setCodes(d.promoCodes));

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/promo-codes', {
        ...form,
        credits: Number(form.credits),
        maxUses: Number(form.maxUses),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      toast.success('Código creado');
      setOpen(false);
      setForm({ code: '', credits: 100, maxUses: 100, expiresAt: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (c) => {
    try {
      await api.patch(`/admin/promo-codes/${c.id}`, { active: c.active ? 0 : 1 });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (c) => {
    try {
      await api.delete(`/admin/promo-codes/${c.id}`);
      toast.success('Código eliminado');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Layout mode="admin" title="Promo Codes" subtitle="Crea y administra códigos promocionales de créditos virtuales">
      <button className="btn-primary mb-6" onClick={() => setOpen(true)}>
        <Plus size={18} /> Nuevo código
      </button>

      {!codes ? (
        <SkeletonRows count={5} height="h-16" />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Créditos</th>
                <th className="px-4 py-3">Usos</th>
                <th className="px-4 py-3">Expira</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono font-bold text-gold-300">{c.code}</td>
                  <td className="px-4 py-3 text-slate-300">{c.credits}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {c.uses_count}/{c.max_uses}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-ES') : 'Sin expiración'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`pill ${c.active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>
                      {c.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button className="btn-secondary !p-2" onClick={() => toggleActive(c)}>
                        {c.active ? <ToggleRight size={15} className="text-emerald-400" /> : <ToggleLeft size={15} />}
                      </button>
                      <button className="btn-secondary !p-2 text-rose-400" onClick={() => remove(c)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo código promocional">
        <form onSubmit={create} className="space-y-3">
          <input
            className="input-field font-mono uppercase"
            placeholder="CODIGO2026"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
          <input
            className="input-field"
            type="number"
            placeholder="Créditos otorgados"
            value={form.credits}
            onChange={(e) => setForm({ ...form, credits: e.target.value })}
            required
          />
          <input
            className="input-field"
            type="number"
            placeholder="Usos máximos"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
            required
          />
          <div>
            <label className="label-field">Fecha de expiración (opcional)</label>
            <input className="input-field" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <button className="btn-primary w-full">Crear código</button>
        </form>
      </Modal>
    </Layout>
  );
}
