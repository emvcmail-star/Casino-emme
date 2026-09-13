import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const SoundContext = createContext(null);
const STORAGE_KEY = 'casino_demo_muted';

const PRESETS = {
  win: [
    { freq: 523, dur: 0.09 },
    { freq: 659, dur: 0.09 },
    { freq: 784, dur: 0.16 },
  ],
  loss: [{ freq: 180, dur: 0.28, type: 'sawtooth' }],
  click: [{ freq: 320, dur: 0.05 }],
  crash: [{ freq: 120, dur: 0.4, type: 'square' }],
  coin: [
    { freq: 880, dur: 0.05 },
    { freq: 1175, dur: 0.08 },
  ],
};

export function SoundProvider({ children }) {
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const ctxRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch {
      // ignore storage errors (private mode, etc.)
    }
  }, [muted]);

  const getCtx = () => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  };

  const play = useCallback(
    (name) => {
      if (muted) return;
      const notes = PRESETS[name];
      if (!notes) return;
      const ctx = getCtx();
      if (!ctx) return;
      let t = ctx.currentTime;
      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = note.type || 'sine';
        osc.frequency.setValueAtTime(note.freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.15, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + note.dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + note.dur + 0.02);
        t += note.dur * 0.85;
      }
    },
    [muted]
  );

  return (
    <SoundContext.Provider value={{ muted, setMuted, play }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound debe usarse dentro de SoundProvider');
  return ctx;
}
