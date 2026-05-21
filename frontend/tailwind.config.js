/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          primary: '#00B5A0',
          light: '#00D4BC',
          dark: '#008F7E',
          glow: '#00B5A033',
        },
        dark: {
          900: '#050A09',
          800: '#0D1614',
          700: '#111F1C',
          600: '#162B27',
          500: '#1E3A35',
        },
        bone: '#F4FFFE',
        ash: '#8BA8A4',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px #00B5A033' },
          '100%': { boxShadow: '0 0 40px #00B5A066' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(to right, #00B5A008 1px, transparent 1px), linear-gradient(to bottom, #00B5A008 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
};
