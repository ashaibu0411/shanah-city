import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#faf7f2",
          100: "#f5f1ea",
          200: "#ece1cc",
          300: "#e8e2d9",
          400: "#d4c4ad",
          500: "#b8a48a",
          600: "#9a856c",
          700: "#7a6854",
          800: "#5c4f40",
          900: "#4a3d2e",
        },
        night: {
          50: "#fffdfb",
          100: "#f5f1ea",
          200: "#ece1cc",
          300: "#e8e2d9",
          400: "#a89882",
          500: "#8b7355",
          600: "#6b5a45",
          700: "#4a3d2e",
          800: "#3d3226",
          900: "#2d2418",
          950: "#1b1409",
        },
        clay: {
          50: "#fff7ed",
          100: "#f3ead9",
          200: "#f5d4c8",
          300: "#e8a88a",
          400: "#d4765a",
          500: "#c45d3e",
          600: "#a84d32",
          700: "#8b3f28",
          800: "#6b2a0f",
          900: "#5c2410",
        },
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#e4c17a",
          400: "#d4a853",
          500: "#b8923f",
          600: "#96762f",
          700: "#785d25",
          800: "#5c471c",
          900: "#3d3012",
        },
        sage: {
          50: "#f4f6f2",
          100: "#e8ede4",
          200: "#d1dcc8",
          300: "#a8b9a0",
          400: "#8b9f82",
          500: "#6f8266",
          600: "#586952",
          700: "#465340",
          800: "#384233",
          900: "#2d3529",
        },
        teal: {
          50: "#fff7ed",
          100: "#f3ead9",
          200: "#f5d4c8",
          300: "#e8a88a",
          400: "#d4765a",
          500: "#c45d3e",
          600: "#a84d32",
          700: "#8b3f28",
          800: "#6b2a0f",
          900: "#5c2410",
          950: "#3d1810",
        },
        cyan: {
          50: "#f4f6f2",
          100: "#e8ede4",
          200: "#d1dcc8",
          300: "#a8b9a0",
          400: "#8b9f82",
          500: "#6f8266",
          600: "#586952",
          700: "#465340",
          800: "#384233",
          900: "#2d3529",
          950: "#1a2018",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        "home-hero": ["var(--font-home-hero)", "Georgia", "serif"],
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
        "app-sm":
          "0 1px 2px rgba(45, 36, 24, 0.05), 0 1px 0 rgba(255, 253, 251, 0.9) inset",
        "app-md":
          "0 4px 14px rgba(45, 36, 24, 0.07), 0 1px 0 rgba(255, 253, 251, 0.85) inset",
        "app-lg":
          "0 12px 32px rgba(45, 36, 24, 0.1), 0 1px 0 rgba(255, 253, 251, 0.8) inset",
        "app-nav": "0 -8px 32px rgba(27, 20, 9, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
