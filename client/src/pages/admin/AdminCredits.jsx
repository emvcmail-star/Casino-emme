import React, { useEffect, useState } from 'react';
import { Coins, Plus, Minus } from 'lucide-react';
import Layout from '../../components/Layout.jsx';
import { SkeletonRows } from '../../components/Skeleton.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminCredits() {
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [amounts, setAmounts] = useState({});

  const load = () => api.get('/admin/users').then((d) => setUsers(d.users.filter((u) => u.role === 'player')));

  useEffect(() => {
    load();
  }, []);

  const adjust = async (id, mode) => {
    const amount = Number(amounts[id]);
    if (!amount || amount <= 0) return toast.error('Introduce una cantidad válida');
    try {
      await api.patch(`/admin/users/${id}/credits`, { amount, mode });
      toast.success('Créditos actualizados');
      setAmounts((a) => ({ ...a, [id]: '' }));
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Layout mode="admin" title="Credits" subtitle="Gestión rápida de créditos virtuales por usuario">
      {!users ? (
        <SkeletonRows count={6} height="h-16" />
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {users.map((u) => (
            <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xl">{u.avatar}</span>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{u.username}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Coins size={12} className="text-amber-300" /> {Number(u.credits).toLocaleString('es-ES')} créditos
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  placeholder="Cantidad"
                  className="input-field !py-1.5 w-28 text-sm"
                  value={amounts[u.id] || ''}
                  onChange={(e) => setAmounts((a) => ({ ...a, [u.id]: e.target.value }))}
                />
                <button className="btn-secondary !py-1.5 !px-3 text-emerald-300" onClick={() => adjust(u.id, 'add')}>
                  <Plus size={14} />
                </button>
                <button className="btn-secondary !py-1.5 !px-3 text-rose-300" onClick={() => adjust(u.id, 'remove')}>
                  <Minus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
