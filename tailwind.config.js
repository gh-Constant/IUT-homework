/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'

export default {
  plugins: [
    typography,
  ],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};