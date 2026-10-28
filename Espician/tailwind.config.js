/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        game: {
          bg: '#0b0f19',        // Deep Obsidian Midnight
          surface: '#121826',   // Card container
          card: '#182032',      // Elevated card
          hover: '#1e2942',     // Hover state
          border: '#23304c',    // Clean subtle border
          primary: '#6366f1',   // Royal Indigo
          primaryHover: '#4f46e5',
          gold: '#f59e0b',      // Esports Tournament Gold
          blueTeam: '#2563eb',  // LCK/World Championship Blue
          redTeam: '#e11d48',   // LCK/World Championship Red
          success: '#10b981',   // Clean emerald
          warning: '#f97316',   // Clean amber
          danger: '#ef4444',    // Clean crimson
        }
      }
    },
  },
  plugins: [],
}
