/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f4f1ff', 100: '#e9e3ff', 200: '#d3c8ff', 300: '#b5a1ff', 500: '#8257f5', 600: '#6d3df0', 700: '#5a2fd1', 800: '#4524a8', 900: '#2b1a6b' },
        ink: { DEFAULT: '#1b1636', 700: '#3a3360', 500: '#6b6689', 400: '#9490ad', 300: '#c9c6da' },
        surface: '#f6f5fb',
        royal: { DEFAULT: '#1f5fe0', 50: '#eef4ff', 100: '#dce9ff', 200: '#bcd4ff', 600: '#1b54c9', 700: '#1749b8', 800: '#123a94' },
        navy: '#0b1f44',
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 2px rgba(27,22,54,.04), 0 8px 24px -12px rgba(60,40,140,.14)',
        pop: '0 20px 50px -12px rgba(43,26,107,.35)',
        glow: '0 8px 20px -6px rgba(109,61,240,.55)',
      },
    },
  },
  plugins: [],
};
