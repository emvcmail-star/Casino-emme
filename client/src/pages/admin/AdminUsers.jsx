import React, { useEffect, useState } from 'react';
import { Search, UserPlus, Ban, CheckCircle, RotateCcw, Coins, History } from 'lucide-react';
import Layout from '../../components/Layout.jsx';
import Modal from '../../components/Modal.jsx';
import UserAvatar from '../../components/UserAvatar.jsx';
import { SkeletonRows } from '../../components/Skeleton.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creditsModal, setCreditsModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [history, setHistory] = useState(null);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', credits: 5000 });
  const [creditForm, setCreditForm] = useState({ amount: '', mode: 'add' });

  const load = async (query = '') => {
    const data = await api.get(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    setUsers(data.users);
  };

  useEffect(() => {
    load();
  }, []);

  const search = (e) => {
    e.preventDefault();
    load(q);
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', newUser);
      toast.success('Usuario de prueba creado');
      setCreateOpen(false);
      setNewUser({ username: '', email: '', password: '', credits: 5000 });
      load(q);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleStatus = async (u) => {
    try {
      await api.patch(`/admin/users/${u.id}/status`, { status: u.status === 'active' ? 'blocked' : 'active' });
      toast.success(u.status === 'active' ? 'Usuario bloqueado' : 'Usuario desbloqueado');
      load(q);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const resetAccount = async (u) => {
    try {
      await api.post(`/admin/users/${u.id}/reset`);
      toast.success('Cuenta restablecida');
      load(q);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitCredits = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/admin/users/${creditsModal.id}/credits`, { amount: Number(creditForm.amount), mode: creditForm.mode });
      toast.success('Créditos actualizados');
      setCreditsModal(null);
      setCreditForm({ amount: '', mode: 'add' });
      load(q);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openHistory = async (u) => {
    setHistoryModal(u);
    const data = await api.get(`/admin/users/${u.id}/history`);
    setHistory(data.history);
  };

  return (
    <Layout mode="admin" title="Users" subtitle="Gestión de usuarios">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={search} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input-field pl-9" placeholder="Buscar por usuario o email" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn-secondary">Buscar</button>
        </form>
        <button className="btn-primary shrink-0" onClick={() => setCreateOpen(true)}>
          <UserPlus size={18} /> Crear usuario de prueba
        </button>
      </div>

      {!users ? (
        <SkeletonRows count={6} height="h-16" />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Créditos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                    <UserAvatar avatar={u.avatar} username={u.username} size={26} /> {u.username}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`pill ${u.role === 'admin' ? 'bg-amber-400/10 text-amber-300' : 'bg-white/5 text-slate-400'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">{Number(u.credits).toLocaleString('es-ES')}</td>
                  <td className="px-4 py-3">
                    <span className={`pill ${u.status === 'active' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>
                      {u.status === 'active' ? 'Activo' : 'Bloqueado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button title="Créditos" className="btn-secondary !p-2" onClick={() => setCreditsModal(u)}>
                        <Coins size={15} />
                      </button>
                      <button title="Historial" className="btn-secondary !p-2" onClick={() => openHistory(u)}>
                        <History size={15} />
                      </button>
                      <button title="Restablecer" className="btn-secondary !p-2" onClick={() => resetAccount(u)}>
                        <RotateCcw size={15} />
                      </button>
                      <button
                        title={u.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                        className="btn-secondary !p-2"
                        onClick={() => toggleStatus(u)}
                      >
                        {u.status === 'active' ? <Ban size={15} className="text-rose-400" /> : <CheckCircle size={15} className="text-emerald-400" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Crear usuario de prueba">
        <form onSubmit={createUser} className="space-y-3">
          <input className="input-field" placeholder="Usuario" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
          <input className="input-field" placeholder="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
          <input className="input-field" placeholder="Contraseña" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
          <input className="input-field" placeholder="Créditos iniciales" type="number" value={newUser.credits} onChange={(e) => setNewUser({ ...newUser, credits: Number(e.target.value) })} />
          <button className="btn-primary w-full">Crear</button>
        </form>
      </Modal>

      <Modal open={!!creditsModal} onClose={() => setCreditsModal(null)} title={`Ajustar créditos: ${creditsModal?.username}`}>
        <form onSubmit={submitCredits} className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { v: 'add', l: 'Añadir' },
              { v: 'remove', l: 'Quitar' },
              { v: 'set', l: 'Fijar' },
            ].map((o) => (
              <button
                type="button"
                key={o.v}
                onClick={() => setCreditForm((f) => ({ ...f, mode: o.v }))}
                className={`rounded-lg py-2 text-sm font-semibold border ${
                  creditForm.mode === o.v ? 'bg-gold-500/20 border-gold-400/50 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
          <input
            className="input-field"
            type="number"
            placeholder="Cantidad"
            value={creditForm.amount}
            onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
            required
          />
          <button className="btn-primary w-full">Aplicar</button>
        </form>
      </Modal>

      <Modal open={!!historyModal} onClose={() => setHistoryModal(null)} title={`Historial: ${historyModal?.username}`} maxWidth="max-w-2xl">
        {!history ? (
          <SkeletonRows count={4} />
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500">Sin partidas registradas.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-1.5">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm bg-white/[0.03] rounded-lg px-3 py-2">
                <span className="text-white font-medium">{h.game_key}</span>
                <span className="text-slate-400">apuesta {h.bet_amount}</span>
                <span className={h.outcome === 'win' ? 'text-emerald-400' : 'text-rose-400'}>{h.outcome}</span>
                <span className="text-slate-500 text-xs">{new Date(h.created_at).toLocaleString('es-ES')}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Layout>
  );
}
