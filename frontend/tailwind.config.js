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
          50: '#172536',   // Headings and primary text
          100: '#172536',  // Headings and primary text
          200: '#172536',  // Headings and primary text
          300: '#334155',  // Body text
          400: '#687587',  // Existing secondary text
          500: '#687587',  // Existing secondary text
          600: '#838F9F',  // Secondary / subtle text
          700: '#E5E1DA',  // Existing borders and dividers
          800: '#E5E1DA',  // Existing borders and dividers
          850: '#FFF9F1',  // Existing secondary surfaces
          900: '#FFFFFF',  // Existing cards and panels
          950: '#F7F5F0',  // Page backgrounds
        },
        cyan: {
          50: '#FFF0E2',   // Existing subtle highlights
          100: '#FFF0E2',  // Existing subtle highlights
          200: '#FFD7B2',
          300: '#D4620B',  // High contrast active text
          400: '#FF8A24',  // Existing primary buttons and active navigation
          450: '#FF8A24',
          500: '#FF8A24',  // Existing primary buttons and active navigation
          550: '#F47716',  // Existing button hover states
          600: '#F47716',  // Existing button hover states
          700: '#D96509',
          800: '#B45309',
          900: '#78350F',
          950: '#FFF9F1',
        },
        indigo: {
          50: '#FFF0E2',   // Existing subtle highlights
          100: '#FFF0E2',  // Existing subtle highlights
          200: '#FFD7B2',
          300: '#D4620B',  // High contrast active text
          400: '#FF8A24',
          500: '#FF8A24',  // Existing primary buttons and active navigation
          600: '#F47716',  // Existing button hover states
          700: '#D96509',
          800: '#B45309',
          900: '#78350F',
          950: '#FFF9F1',
        },
        purple: {
          50: '#FFF0E2',
          100: '#FFF0E2',
          200: '#FFD7B2',
          300: '#D4620B',
          400: '#FF8A24',
          500: '#FF8A24',
          600: '#F47716',
          700: '#D96509',
          800: '#B45309',
          900: '#78350F',
        },
        sky: {
          50: '#FFF0E2',
          100: '#FFF0E2',
          200: '#FFD7B2',
          300: '#D4620B',
          400: '#FF8A24',
          500: '#FF8A24',
          600: '#F47716',
          700: '#D96509',
        },
        amber: {
          50: '#FFF9F1',   // Existing secondary surfaces
          100: '#FFF0E2',  // Existing subtle highlights
          200: '#78350F',  // Accessible amber text on light surfaces
          300: '#92400E',  // Accessible amber text
          400: '#D97706',  // Amber warning icon
          500: '#FF8A24',  // Warm orange accent
          600: '#F47716',  // Button hover states
          700: '#B45309',
          800: '#78350F',
          900: '#451A03',
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#047857',  // Accessible green text on light surfaces
          400: '#059669',  // Success icon
          450: '#059669',
          500: '#10B981',  // Success badge
          600: '#047857',
          700: '#065F46',
          800: '#064E3B',
        },
        teal: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#047857',
          400: '#059669',
          500: '#10B981',
          600: '#047857',
          700: '#065F46',
        },
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#BE123C',  // Accessible red text on light surfaces
          400: '#E11D48',  // Alert icon
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
          950: '#FFF9F1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 4px 20px -2px rgba(255, 138, 36, 0.25)',
        'glow-indigo': '0 4px 20px -2px rgba(244, 119, 22, 0.25)',
        'glow-emerald': '0 4px 20px -2px rgba(16, 185, 129, 0.2)',
      }
    },
  },
  plugins: [],
}
