import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Ticket, Sparkles, Trophy } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Bonuses() {
  const { user } = useAuth();
  const bonuses = [
    {
      icon: Gift,
      title: 'Bono de bienvenida',
      desc: 'Créditos virtuales otorgados automáticamente al registrarte.',
      status: 'Reclamado al crear tu cuenta',
      color: 'text-electric-300',
    },
    {
      icon: Ticket,
      title: 'Códigos promocionales',
      desc: 'Canjea códigos como WELCOME100, DEMO500 o LUCKY1000 por más créditos.',
      status: 'Disponible',
      cta: { to: '/promo-codes', label: 'Ver códigos' },
      color: 'text-amber-300',
    },
    {
      icon: Sparkles,
      title: 'Rachas de suerte',
      desc: 'Juegos como Mines, Towers e Hi-Lo permiten multiplicar tus créditos virtuales por racha.',
      status: 'Prueba tu suerte',
      cta: { to: '/games', label: 'Ir a juegos' },
      color: 'text-fuchsia-300',
    },
    {
      icon: Trophy,
      title: 'Grandes premios',
      desc: 'Los multiplicadores más altos aparecen en Slots, Crash y Plinko en modo riesgo alto.',
      status: 'Solo demostración',
      color: 'text-emerald-300',
    },
  ];

  return (
    <Layout title="Bonuses" subtitle="Formas de conseguir más créditos virtuales (demo)">
      <div className="glass-card p-4 mb-6 border-amber-400/20 bg-amber-400/5 text-sm text-amber-200">
        Todos los bonos son créditos virtuales sin valor monetario, pensados solo para pruebas.
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {bonuses.map((b, i) => (
          <div key={i} className="glass-card glass-card-hover p-5 flex flex-col">
            <div className={`w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center mb-3 ${b.color}`}>
              <b.icon size={22} />
            </div>
            <h3 className="font-bold text-white mb-1">{b.title}</h3>
            <p className="text-sm text-slate-500 flex-1">{b.desc}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="pill bg-white/5 text-slate-400">{b.status}</span>
              {b.cta && (
                <Link to={b.cta.to} className="text-sm text-electric-400 hover:text-electric-300 font-semibold">
                  {b.cta.label} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
