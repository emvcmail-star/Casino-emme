import React, { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import Layout from '../../components/Layout.jsx';
import { SkeletonRows } from '../../components/Skeleton.jsx';
import { api } from '../../api/client.js';

export default function AdminActivityLog() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.get('/admin/activity-log?limit=200').then((d) => setRows(d.activityLog)).catch(() => {});
  }, []);

  return (
    <Layout mode="admin" title="Activity Log" subtitle="Registro de todas las acciones administrativas">
      {!rows ? (
        <SkeletonRows count={8} height="h-14" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500 glass-card p-6 text-center">Sin actividad registrada todavía.</p>
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {rows.map((a) => (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3.5">
              <ClipboardList size={16} className="text-electric-400 mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">
                  <span className="font-semibold">{a.admin_username}</span> ejecutó{' '}
                  <span className="font-mono text-electric-300">{a.action}</span>
                  {a.target && <> sobre <span className="text-slate-300">{a.target}</span></>}
                </p>
                {a.details && (
                  <pre className="text-[11px] text-slate-500 mt-1 whitespace-pre-wrap break-all">{JSON.stringify(a.details)}</pre>
                )}
                <p className="text-xs text-slate-600 mt-1">{new Date(a.created_at).toLocaleString('es-ES')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
