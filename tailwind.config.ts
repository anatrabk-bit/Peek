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
          primary: "#0EA5E9",
          "primary-dark": "#0369A1",
          accent: "#F97316",
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
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
