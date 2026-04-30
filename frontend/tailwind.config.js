/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          950: "#070a12",
          900: "#0c1020",
          800: "#12182c",
        },
        /* Semantic design system — values come from CSS variables in index.css */
        ds: {
          bg: "var(--color-bg)",
          card: "var(--color-card)",
          surface: "var(--color-surface-muted)",
          line: "var(--color-border)",
          "line-hover": "var(--color-border-hover)",
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          accent: "var(--color-accent)",
          "accent-hover": "var(--color-accent-hover)",
          "accent-glow": "var(--color-accent-glow)",
          secondaryAccent: "var(--color-accent-secondary)",
          "on-accent": "var(--color-on-accent)",
          danger: "var(--color-danger)",
          "danger-bg": "var(--color-danger-bg)",
          "danger-border": "var(--color-danger-border)",
          "warn-text": "var(--color-warn-text)",
          "warn-bg": "var(--color-warn-bg)",
          "code-text": "var(--color-code-text)",
          "code-bg": "var(--color-code-bg)",
          scrim: "var(--color-overlay-scrim)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          dim: "var(--color-accent-hover)",
          glow: "var(--color-accent-glow)",
        },
        cyan: {
          glow: "var(--color-accent-secondary)",
        },
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.45)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.35s ease-out forwards",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
