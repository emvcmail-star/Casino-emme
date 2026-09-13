/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          950: '#050a1a',
          900: '#0a1128',
          800: '#0f1a3a',
          700: '#152449',
        },
        electric: {
          400: '#5eb1ff',
          500: '#2f7dff',
          600: '#155ee0',
          glow: '#3fa9ff',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(63, 169, 255, 0.35), 0 0 60px rgba(47, 125, 255, 0.15)',
        'glow-lg': '0 0 40px rgba(63, 169, 255, 0.45), 0 0 100px rgba(47, 125, 255, 0.25)',
        card: '0 8px 32px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgba(47,125,255,0.18), transparent 60%)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(63,169,255,0.35)' },
          '50%': { boxShadow: '0 0 40px rgba(63,169,255,0.65)' },
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
