import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'casino_demo_accent';

export const ACCENTS = {
  gold: { label: 'Dorado', swatch: '#d4af37', vars: { 300: '243 220 154', 400: '233 196 106', 500: '212 175 55', 600: '169 132 31', glow: '243 210 122' } },
  green: { label: 'Verde neón', swatch: '#10b981', vars: { 300: '167 243 208', 400: '52 211 153', 500: '16 185 129', 600: '4 120 87', glow: '110 231 183' } },
  blue: { label: 'Azul eléctrico', swatch: '#3b82f6', vars: { 300: '147 197 253', 400: '96 165 250', 500: '59 130 246', 600: '29 78 216', glow: '125 211 252' } },
  cyan: { label: 'Cian', swatch: '#06b6d4', vars: { 300: '103 232 249', 400: '34 211 238', 500: '6 182 212', 600: '14 116 144', glow: '103 232 249' } },
  pink: { label: 'Rosa', swatch: '#ec4899', vars: { 300: '249 168 212', 400: '244 114 182', 500: '236 72 153', 600: '190 24 93', glow: '249 168 212' } },
  red: { label: 'Rojo', swatch: '#ef4444', vars: { 300: '252 165 165', 400: '248 113 113', 500: '239 68 68', 600: '185 28 28', glow: '252 165 165' } },
  purple: { label: 'Púrpura', swatch: '#a855f7', vars: { 300: '216 180 254', 400: '192 132 252', 500: '168 85 247', 600: '126 34 206', glow: '233 213 255' } },
};

const DEFAULT_ACCENT = 'gold';

function applyAccent(key) {
  const accent = ACCENTS[key] || ACCENTS[DEFAULT_ACCENT];
  const root = document.documentElement;
  Object.entries(accent.vars).forEach(([tone, rgb]) => {
    root.style.setProperty(`--gold-${tone}`, rgb);
  });
}

export function ThemeProvider({ children }) {
  const [accent, setAccentState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && ACCENTS[saved] ? saved : DEFAULT_ACCENT;
    } catch {
      return DEFAULT_ACCENT;
    }
  });

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  const setAccent = (key) => {
    if (!ACCENTS[key]) return;
    setAccentState(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // ignore storage errors (private mode, etc.)
    }
  };

  return <ThemeContext.Provider value={{ accent, setAccent, accents: ACCENTS }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
