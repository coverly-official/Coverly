import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          start: "var(--canvas-start)",
          end: "var(--canvas-end)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
          pink: "var(--surface-pink)",
        },
        ink: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
        navy: "var(--btn-primary)",
        coral: "var(--accent)",
        verified: "var(--verified)",
        whatsapp: "var(--whatsapp)",
      },
      fontFamily: {
        heading: ["var(--font-raleway)", "sans-serif"],
        body: ["var(--font-raleway)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        card: "var(--radius-lg)",
        "card-lg": "var(--radius-xl)",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(45,50,80,0.04), 0 0 1px rgba(45,50,80,0.06)",
        card: "0 4px 16px rgba(45,50,80,0.06), 0 0 1px rgba(45,50,80,0.08)",
        "card-hover":
          "0 8px 24px rgba(45,50,80,0.08), 0 0 1px rgba(45,50,80,0.1)",
      },
      keyframes: {
        "scan-line": {
          "0%": { top: "0%", opacity: "1" },
          "100%": { top: "100%", opacity: "0" },
        },
      },
      animation: {
        "scan-line": "scan-line 1.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
