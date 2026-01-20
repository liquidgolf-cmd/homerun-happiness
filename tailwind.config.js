/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Loam Strategy Brand Colors
        'loam-brown': '#4A3728',      // Deep Earth Brown - Primary
        'loam-clay': '#8B6F47',       // Rich Clay - Secondary
        'loam-neutral': '#E8DCC4',     // Warm Neutral - Backgrounds
        'loam-green': '#5A7247',      // Strategic Green - CTAs
        'loam-base': '#D4A574',       // Base Color - Progress indicators
        'loam-highlight': '#94B49F',  // Highlight Green - Success states
        'loam-charcoal': '#2C2C2C',   // Charcoal - Body text
        // Legacy colors for backward compatibility (will update components)
        'homerun-blue': '#4A3728',    // Map to Deep Earth Brown
        'homerun-green': '#5A7247',   // Map to Strategic Green
      },
      fontFamily: {
        'heading': ['Montserrat', 'sans-serif'],
        'body': ['Open Sans', 'sans-serif'],
        'accent': ['Lora', 'serif'],
      },
      borderRadius: {
        'loam': '6px',  // Subtle rounded corners (4-8px range)
      },
    },
  },
  plugins: [],
}