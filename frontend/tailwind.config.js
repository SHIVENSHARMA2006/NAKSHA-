/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cadastre: {
          bg: "#0B0F19",
          surface: "#111827",
          card: "#1F2937",
          border: "#374151",
          text: "#F3F4F6",
          muted: "#9CA3AF",
          critical: "#EF4444",   // Severe dispute
          high: "#F97316",       // High review
          moderate: "#F59E0B",   // Moderate variance
          low: "#10B981",        // Verified / Low conflict
          ai: "#06B6D4",         // Electric cyan for AI polygon
          legacy: "#A855F7",     // Purple dashed for legacy
          gnss: "#3B82F6",       // Blue for CORS anchor
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      }
    },
  },
  plugins: [],
}
