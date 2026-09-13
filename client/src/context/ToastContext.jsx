import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, Gift, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  bonus: Gift,
};

const STYLES = {
  success: 'border-emerald-400/30 text-emerald-300',
  error: 'border-rose-400/30 text-rose-300',
  info: 'border-gold-400/30 text-gold-300',
  bonus: 'border-amber-400/30 text-amber-300',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info', duration = 3800) => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => remove(id), duration);
      return id;
    },
    [remove]
  );

  const toast = {
    success: (msg) => push(msg, 'success'),
    error: (msg) => push(msg, 'error'),
    info: (msg) => push(msg, 'info'),
    bonus: (msg) => push(msg, 'bonus', 5000),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`glass-card animate-slide-up flex items-start gap-3 border p-3.5 pr-9 relative ${STYLES[t.type]}`}
            >
              <Icon size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm text-slate-200 leading-snug">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="absolute top-2.5 right-2.5 text-slate-500 hover:text-slate-300"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
