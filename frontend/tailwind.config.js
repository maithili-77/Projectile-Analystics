/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#111827',
          950: '#0b0f19',
        },
        cyan: {
          450: '#22d3ee',
          550: '#0891b2',
        },
        emerald: {
          450: '#34d399',
        },
        indigo: {
          950: '#1e1b4b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(34, 211, 238, 0.3)',
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(52, 211, 153, 0.3)',
      }
    },
  },
  plugins: [],
}
