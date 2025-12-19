/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0c10',
        surface: '#14161d',
        border: '#2a2f3a',
        text: '#f5f5f5',
        muted: '#8892b0',
        accent: '#66fcf1',
        accentHover: '#45a29e',
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}