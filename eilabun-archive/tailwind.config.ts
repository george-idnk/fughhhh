import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        "surface-2": token("surface-2"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        crimson: token("crimson"),
        "crimson-deep": token("crimson-deep"),
        gold: token("gold"),
        "gold-soft": token("gold-soft"),
        ok: token("ok"),
        warn: token("warn"),
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Arabic", "Noto Sans Hebrew", "system-ui", "sans-serif"],
        display: ["Cormorant Garamond", "Amiri", "Noto Sans Hebrew", "Georgia", "serif"],
        arabic: ["Amiri", "Noto Sans Arabic", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(60 20 20 / 0.18)",
        lift: "0 2px 4px rgb(0 0 0 / 0.06), 0 18px 40px -16px rgb(60 20 20 / 0.28)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};

export default config;
