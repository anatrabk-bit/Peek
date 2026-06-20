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
          primary: "#FF6B9D",
          "primary-dark": "#E84D86",
          coral: "#FF8C69",
          sunny: "#FFC857",
          mint: "#7EE8A8",
          lavender: "#C4B5FD",
          sky: "#7DD3FC",
          accent: "#FF7A45",
          bg: "#FFF9F5",
          cream: "#FFF4EC",
          peach: "#FFE8DC",
          card: "#FFFFFF",
          text: "#4A3728",
          muted: "#9C8B7A"
        }
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 4px 20px -4px rgb(255 107 157 / 0.12), 0 2px 8px -2px rgb(74 55 40 / 0.06)",
        "card-hover":
          "0 12px 32px -8px rgb(255 107 157 / 0.2), 0 4px 12px -4px rgb(74 55 40 / 0.08)",
        bubbly: "0 8px 0 0 rgb(255 140 105 / 0.35)",
        "bubbly-sm": "0 4px 0 0 rgb(255 107 157 / 0.25)",
        glow: "0 0 48px -6px rgb(255 200 87 / 0.55)"
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "float-slow": "float 10s ease-in-out infinite reverse",
        wiggle: "wiggle 3s ease-in-out infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-14px) scale(1.03)" }
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
