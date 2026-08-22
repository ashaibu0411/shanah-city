import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#faf8f5",
          100: "#f3efe8",
          200: "#e8dfd2",
          300: "#d9c9b3",
          400: "#c4a882",
          500: "#b08f66",
          600: "#967652",
          700: "#7a6044",
          800: "#644f3a",
          900: "#534233",
        },
        night: {
          50: "#f4f6f9",
          100: "#e8ecf2",
          200: "#cdd6e3",
          300: "#a3b3ca",
          400: "#738aab",
          500: "#526b91",
          600: "#405578",
          700: "#354662",
          800: "#2f3c52",
          900: "#1a2332",
          950: "#111827",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        homeHero: ["var(--font-home-hero)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "fade-in": "fade-in 0.35s ease-out both",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.75" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "app-sm": "0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 0 rgba(255, 255, 255, 0.9) inset",
        "app-md": "0 4px 14px rgba(15, 23, 42, 0.07), 0 1px 0 rgba(255, 255, 255, 0.85) inset",
        "app-lg": "0 12px 32px rgba(15, 23, 42, 0.1), 0 1px 0 rgba(255, 255, 255, 0.8) inset",
        "app-nav": "0 -8px 32px rgba(15, 23, 42, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
