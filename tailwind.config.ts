import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#fbf4f1",
        blush: "#f3dbe0",
        rose: "#d89aa3",
        mauve: "#a8626b",
        burgundy: "#7e3e48",
        gold: "#b98a5e",
        ink: "#2e1f24",
      },
      boxShadow: {
        soft: "0 12px 30px rgba(126, 62, 72, 0.18)",
        glow: "0 0 40px rgba(216, 154, 163, 0.35)",
      },
      borderRadius: {
        card: "1.5rem",
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'Heebo'", "sans-serif"],
      },
      backgroundImage: {
        "rose-sheen":
          "radial-gradient(ellipse at top, rgba(216,154,163,0.35), transparent 60%), radial-gradient(ellipse at bottom, rgba(168,98,107,0.25), transparent 60%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
