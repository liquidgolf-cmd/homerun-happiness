/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'homerun-blue': '#2563eb',
        'homerun-green': '#10b981',
      },
    },
  },
  plugins: [],
}