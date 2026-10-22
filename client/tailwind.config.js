/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        indigo: {
          50: '#fbf3f8', 100: '#f4e5ef', 200: '#e9c9de', 300: '#d6a2c4',
          400: '#bd73a4', 500: '#9e4e83', 600: '#803563', 700: '#67264f',
          800: '#4d1c3b', 900: '#36152b', 950: '#210d1b',
        },
        purple: {
          50: '#faf2f8', 100: '#f1e1ed', 200: '#e3c4dc', 300: '#cf9ec4',
          400: '#b879a7', 500: '#965586', 600: '#783d6b', 700: '#602d55',
          800: '#492243', 900: '#32182f', 950: '#1e0e1c',
        },
        pink: {
          50: '#fff4f0', 100: '#ffe5dc', 200: '#ffc7b5', 300: '#ffa185',
          400: '#ff7658', 500: '#d13a28', 600: '#b92f22', 700: '#9d281f',
          800: '#9e2a22', 900: '#78251f', 950: '#451511',
        },
        rose: {
          50: '#fff4f0', 100: '#ffe5dc', 200: '#ffc7b5', 300: '#ffa185',
          400: '#ff7658', 500: '#d13a28', 600: '#b92f22', 700: '#9d281f',
          800: '#9e2a22', 900: '#78251f', 950: '#451511',
        },
        brand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'bounce-dot': 'bounceDot 1.4s infinite ease-in-out both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1.0)' },
        }
      }
    },
  },
  plugins: [],
}
