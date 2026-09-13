import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { SkeletonRows } from '../../components/Skeleton.jsx';
import { api } from '../../api/client.js';

const TYPE_LABEL = {
  bet: 'Apuesta',
  win: 'Pago',
  promo: 'Código promo',
  admin_credit: 'Admin +créditos',
  admin_debit: 'Admin -créditos',
  signup_bonus: 'Bono bienvenida',
  reset: 'Restablecimiento',
};

export default function AdminTransactions() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.get('/admin/transactions?limit=200').then((d) => setRows(d.transactions)).catch(() => {});
  }, []);

  return (
    <Layout mode="admin" title="Transactions" subtitle="Historial de movimientos de créditos virtuales">
      {!rows ? (
        <SkeletonRows count={8} height="h-12" />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Saldo resultante</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium">{t.username}</td>
                  <td className="px-4 py-3">
                    <span className="pill bg-white/5 text-slate-300">{TYPE_LABEL[t.type] || t.type}</span>
                  </td>
                  <td className={`px-4 py-3 tabular-nums font-semibold ${t.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.amount >= 0 ? '+' : ''}
                    {t.amount}
                  </td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">{t.balance_after}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{t.description}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(t.created_at).toLocaleString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
