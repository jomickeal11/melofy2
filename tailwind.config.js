/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef0ff',
          100: '#dde1ff',
          200: '#c0c7ff',
          400: '#8b93ff',
          500: '#6C63FF',
          600: '#5046e5',
          700: '#3d35c2',
          800: '#2d279e',
          900: '#1e1a7a',
        },
        dark: {
          bg:      '#0d0d14',
          surface: '#13131f',
          card:    '#1a1a2e',
          border:  '#2a2a40',
        }
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease forwards',
        'pulse-slow':'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
