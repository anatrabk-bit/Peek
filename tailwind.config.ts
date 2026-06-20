import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        peek: {
          primary: "#0284C7",
          "primary-dark": "#0369A1",
          accent: "#EA580C",
          "accent-soft": "#FFF7ED",
          warm: "#FAFAF9",
          surface: "#FFFFFF",
          text: "#1C1917",
          muted: "#57534E",
          border: "#E7E5E4",
          success: "#059669"
        }
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(28 25 23 / 0.06), 0 1px 2px -1px rgb(28 25 23 / 0.06)",
        "card-hover": "0 8px 24px -6px rgb(28 25 23 / 0.1)"
      },
      animation: {
        float: "float 8s ease-in-out infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
