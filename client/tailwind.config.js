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
          300: '#f3dc9a',
          400: '#e9c46a',
          500: '#d4af37',
          600: '#a9841f',
          glow: '#f3d27a',
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
      },
      fontFamily: {
        display: ['"Manrope"', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', '"Georgia"', 'serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(212, 175, 55, 0.30), 0 0 60px rgba(169, 132, 31, 0.12)',
        'glow-lg': '0 0 40px rgba(212, 175, 55, 0.40), 0 0 100px rgba(169, 132, 31, 0.22)',
        card: '0 10px 34px rgba(0, 0, 0, 0.45)',
        'inner-line': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgba(212,175,55,0.14), transparent 60%)',
        'felt-radial': 'radial-gradient(circle at 50% 20%, rgba(20,60,40,0.35), transparent 65%)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212,175,55,0.30)' },
          '50%': { boxShadow: '0 0 40px rgba(212,175,55,0.55)' },
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
