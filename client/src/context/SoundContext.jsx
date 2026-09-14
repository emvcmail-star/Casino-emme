import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const SoundContext = createContext(null);
const STORAGE_KEY = 'casino_demo_muted';
const MUSIC_KEY = 'casino_demo_music_track';
const MUSIC_VOLUME_KEY = 'casino_demo_music_volume';

export const MUSIC_TRACKS = {
  off: { label: 'Sin música' },
  lounge: { label: 'Casino Lounge', src: '/audio/lounge.mp3', credit: '"Bossa Antigua" — Kevin MacLeod (incompetech.com)' },
  upbeat: { label: 'Arcade', src: '/audio/upbeat.mp3', credit: '"Cool Vibes" — Kevin MacLeod (incompetech.com)' },
  elevator: { label: 'Elevador VIP', src: '/audio/elevator.mp3', credit: '"Local Forecast - Elevator" — Kevin MacLeod (incompetech.com)' },
};

const PRESETS = {
  win: [
    { freq: 523, dur: 0.09 },
    { freq: 659, dur: 0.09 },
    { freq: 784, dur: 0.16 },
  ],
  jackpot: [
    { freq: 523, dur: 0.08 },
    { freq: 659, dur: 0.08 },
    { freq: 784, dur: 0.08 },
    { freq: 1047, dur: 0.08 },
    { freq: 1319, dur: 0.24 },
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

  const [musicTrack, setMusicTrackState] = useState(() => {
    try {
      const saved = localStorage.getItem(MUSIC_KEY);
      return saved && MUSIC_TRACKS[saved] ? saved : 'off';
    } catch {
      return 'off';
    }
  });
  const [musicVolume, setMusicVolumeState] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(MUSIC_VOLUME_KEY));
      return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : 0.35;
    } catch {
      return 0.35;
    }
  });
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) {
      const el = new Audio();
      el.loop = true;
      audioRef.current = el;
    }
    const el = audioRef.current;
    const track = MUSIC_TRACKS[musicTrack];
    if (!track?.src) {
      el.pause();
      el.removeAttribute('src');
      return;
    }
    if (!el.src.endsWith(track.src)) {
      el.src = track.src;
    }
    el.volume = musicVolume;
    if (!muted) {
      el.play().catch(() => {
        // el navegador puede bloquear el autoplay hasta la primera interacción del usuario
      });
    } else {
      el.pause();
    }
  }, [musicTrack, muted]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    try {
      localStorage.setItem(MUSIC_KEY, musicTrack);
    } catch {
      // ignore
    }
  }, [musicTrack]);

  useEffect(() => {
    try {
      localStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume));
    } catch {
      // ignore
    }
  }, [musicVolume]);

  const setMusicTrack = (key) => {
    if (MUSIC_TRACKS[key]) setMusicTrackState(key);
  };
  const setMusicVolume = (v) => setMusicVolumeState(Math.min(1, Math.max(0, v)));

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
    <SoundContext.Provider
      value={{ muted, setMuted, play, musicTrack, setMusicTrack, musicVolume, setMusicVolume, tracks: MUSIC_TRACKS }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound debe usarse dentro de SoundProvider');
  return ctx;
}
