/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: '#1A2235',
        surfaceHighlight: '#252F48',
        primary: '#6366F1', // Indigo
        primaryHover: '#818CF8',
        textMain: '#F8FAFC',
        textMuted: '#94A3B8',
        danger: '#EF4444'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
