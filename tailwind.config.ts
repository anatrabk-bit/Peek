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
          "primary-dark": "#075985",
          accent: "#EA580C",
          bg: "#FAFAF9",
          card: "#F4F4F5",
          text: "#18181B",
          muted: "#71717A"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 4px 16px 0 rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        glow: "0 0 40px -8px rgb(14 165 233 / 0.45)"
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "float-slow": "float 10s ease-in-out infinite reverse"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-14px) scale(1.03)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
