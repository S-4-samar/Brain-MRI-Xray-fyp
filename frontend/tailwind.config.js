/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "Times New Roman", "serif"],
      },
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        border: "rgba(255, 255, 255, 0.08)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        accent: {
          sky: "rgb(var(--accent-sky) / <alpha-value>)",
          emerald: "rgb(var(--accent-emerald) / <alpha-value>)",
          red: "rgb(var(--accent-red) / <alpha-value>)",
        },
      },
      backgroundImage: {
        /** Used by aceternity-style lamp (conic beam + Tailwind from/via/to stops) */
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
}
