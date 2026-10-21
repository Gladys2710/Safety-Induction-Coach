/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        safety: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc071',
          400: '#ff9a32',
          500: '#ff7d0a',
          600: '#f05e00',
          700: '#c74400',
          800: '#9e3607',
          900: '#7f2f0a',
          950: '#451603',
        },
        steel: {
          50: '#f6f8fa',
          100: '#eceff4',
          200: '#d5dbe4',
          300: '#b0bac9',
          400: '#8696ac',
          500: '#657791',
          600: '#506078',
          700: '#424e61',
          800: '#394252',
          900: '#333a47',
          950: '#222732',
        },
        hazard: {
          500: '#facc15',
          600: '#ca8a04',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Archivo Narrow"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px -8px rgba(34, 39, 50, 0.18), 0 2px 6px -2px rgba(34, 39, 50, 0.08)',
        lift: '0 18px 40px -16px rgba(34, 39, 50, 0.35), 0 6px 14px -6px rgba(34, 39, 50, 0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'pop-in': 'pop-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'shake': 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
};
