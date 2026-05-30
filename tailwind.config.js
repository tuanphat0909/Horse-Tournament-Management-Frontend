/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "var(--navy)",
        surface: "var(--surface)",
        'surface-2': "var(--surface-2)",
        sidebar: "var(--sidebar)",
        gold: "var(--gold)",
        champagne: "var(--champagne)",
        body: "var(--body)",
        muted: "var(--muted)",
        border: "var(--border)",
        'border-hover': "var(--border-hover)",
        success: "var(--success)",
        danger: "var(--danger)",
        warning: "var(--warning)",
        info: "var(--info)",
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
