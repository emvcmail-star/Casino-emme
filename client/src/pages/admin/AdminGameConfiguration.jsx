import React, { useEffect, useState } from 'react';
import { FlaskConical, Save, AlertTriangle } from 'lucide-react';
import Layout from '../../components/Layout.jsx';
import { GAME_META } from '../../components/GameCard.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminGameConfiguration() {
  const toast = useToast();
  const [games, setGames] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [paramsText, setParamsText] = useState('');
  const [paramsError, setParamsError] = useState('');

  const load = async () => {
    const data = await api.get('/admin/games');
    setGames(data.games);
    if (!selected && data.games.length) select(data.games[0]);
  };

  useEffect(() => {
    load();
  }, []);

  const select = (g) => {
    setSelected(g.game_key);
    setForm({ rtp: g.rtp, min_bet: g.min_bet, max_bet: g.max_bet, enabled: !!g.enabled });
    setParamsText(JSON.stringify(g.params, null, 2));
    setParamsError('');
  };

  const save = async () => {
    let params;
    try {
      params = JSON.parse(paramsText);
      setParamsError('');
    } catch {
      setParamsError('El JSON de parámetros no es válido');
      return;
    }
    try {
      await api.patch(`/admin/games/${selected}`, {
        rtp: Number(form.rtp),
        min_bet: Number(form.min_bet),
        max_bet: Number(form.max_bet),
        enabled: form.enabled,
        params,
      });
      toast.success('Configuración de prueba actualizada');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const current = games?.find((g) => g.game_key === selected);

  return (
    <Layout mode="admin" title="Game Configuration" subtitle="Parámetros matemáticos de los juegos DE DEMOSTRACIÓN">
      <div className="glass-card p-4 mb-6 border-amber-400/20 bg-amber-400/5 flex items-start gap-3">
        <AlertTriangle className="text-amber-300 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-amber-200">
          Estas opciones son exclusivamente para <strong>testing</strong> de la demo. Los resultados siempre se calculan con la
          configuración vigente en el momento de la apuesta y quedan registrados; nunca se modifican después de jugar.
        </p>
      </div>

      {!games ? (
        <div className="skeleton h-64" />
      ) : (
        <div className="grid lg:grid-cols-[220px_1fr] gap-6">
          <div className="glass-card p-2 h-fit space-y-1">
            {games.map((g) => (
              <button
                key={g.game_key}
                onClick={() => select(g)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left ${
                  selected === g.game_key ? 'bg-electric-500/20 text-white' : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                {GAME_META[g.game_key]?.emoji} {g.name}
              </button>
            ))}
          </div>

          {form && current && (
            <div className="glass-card p-6 space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FlaskConical className="text-electric-400" size={20} /> {current.name}
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-field">RTP de prueba (%)</label>
                  <input className="input-field" type="number" step="0.1" value={form.rtp} onChange={(e) => setForm({ ...form, rtp: e.target.value })} />
                </div>
                <div>
                  <label className="label-field">Apuesta mínima</label>
                  <input className="input-field" type="number" value={form.min_bet} onChange={(e) => setForm({ ...form, min_bet: e.target.value })} />
                </div>
                <div>
                  <label className="label-field">Apuesta máxima</label>
                  <input className="input-field" type="number" value={form.max_bet} onChange={(e) => setForm({ ...form, max_bet: e.target.value })} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="accent-electric-500 w-4 h-4" />
                Juego activado
              </label>

              <div>
                <label className="label-field">
                  Parámetros del motor (probabilidades, multiplicadores, frecuencia de premios, house edge…)
                </label>
                <textarea
                  className="input-field font-mono text-xs h-52"
                  value={paramsText}
                  onChange={(e) => setParamsText(e.target.value)}
                  spellCheck={false}
                />
                {paramsError && <p className="text-xs text-rose-400 mt-1">{paramsError}</p>}
              </div>

              <button className="btn-primary" onClick={save}>
                <Save size={18} /> Guardar configuración de prueba
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
