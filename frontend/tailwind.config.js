/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: '#59FFB4', soft: '#59FFB41f', dim: '#2fbf86' },
        ink: { 950: '#05080a', 900: '#080c0f', 800: '#0d1317', 700: '#141c21' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      keyframes: {
        rise: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
        pop: { from: { opacity: 0, transform: 'scale(.96)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { rise: 'rise .5s ease-out both', pop: 'pop .18s ease-out both' },
    },
  },
  plugins: [],
}
