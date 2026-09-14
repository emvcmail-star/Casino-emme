/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          950: '#08070a',
          900: '#0f0d11',
          800: '#17141a',
          700: '#211d25',
          600: '#2c2732',
        },
        gold: {
          300: 'rgb(var(--gold-300) / <alpha-value>)',
          400: 'rgb(var(--gold-400) / <alpha-value>)',
          500: 'rgb(var(--gold-500) / <alpha-value>)',
          600: 'rgb(var(--gold-600) / <alpha-value>)',
          glow: 'rgb(var(--gold-glow) / <alpha-value>)',
        },
        crimson: {
          400: '#e35d6a',
          500: '#b3273a',
          600: '#7f1a29',
        },
        felt: {
          900: '#0c1a14',
          800: '#12261d',
        },
        neon: {
          300: '#7dffc0',
          400: '#01FF81',
          500: '#00e673',
          600: '#00b85c',
        },
      },
      fontFamily: {
        display: ['"Manrope"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', '"Georgia"', 'serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgb(var(--gold-500) / 0.30), 0 0 60px rgb(var(--gold-600) / 0.12)',
        'glow-lg': '0 0 40px rgb(var(--gold-500) / 0.40), 0 0 100px rgb(var(--gold-600) / 0.22)',
        card: '0 10px 34px rgba(0, 0, 0, 0.45)',
        'inner-line': 'inset 0 1px 0 rgba(255,255,255,0.06)',
        'glow-neon': '0 0 20px rgba(1,255,129,0.35), 0 0 60px rgba(1,255,129,0.15)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgb(var(--gold-500) / 0.14), transparent 60%)',
        'felt-radial': 'radial-gradient(circle at 50% 20%, rgba(20,60,40,0.35), transparent 65%)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgb(var(--gold-500) / 0.30)' },
          '50%': { boxShadow: '0 0 40px rgb(var(--gold-500) / 0.55)' },
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.2s ease-in-out infinite',
        'slide-up': 'slide-up 0.35s ease-out',
        shimmer: 'shimmer 1.6s infinite linear',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
    },
  },
  plugins: [],
};
