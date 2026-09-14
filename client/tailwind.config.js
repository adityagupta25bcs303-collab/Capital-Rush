/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0a0f1d',
          card: '#111827',
          surface: '#1e293b',
          border: '#334155',
          gold: '#f59e0b',
          goldHover: '#d97706',
          emerald: '#10b981',
          rose: '#f43f5e',
          blue: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
