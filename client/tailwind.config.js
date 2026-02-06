/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10B981', // Emerald 500
        secondary: '#3B82F6', // Blue 500
        danger: '#EF4444', // Red 500
      }
    },
  },
  plugins: [],
}
