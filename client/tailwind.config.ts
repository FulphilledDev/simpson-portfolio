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
        background: "#0b1220",
        surface: "#0e1a30",
        "surface-2": "#152040",
        "neon-cyan": "#5bc8f5",
        "neon-purple": "#2468cc",
        "neon-pink": "#4ab8e8",
        "glass-border": "rgba(255,255,255,0.10)",
        "glass-bg": "rgba(255,255,255,0.05)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-hero":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(91,200,245,0.14), transparent), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(36,104,204,0.12), transparent)",
        "glow-cyan": "linear-gradient(135deg, #5bc8f5, #2468cc)",
        "glow-purple": "linear-gradient(135deg, #2468cc, #5bc8f5)",
      },
      boxShadow: {
        "glow-sm": "0 0 12px rgba(91,200,245,0.20)",
        "glow-md": "0 0 24px rgba(91,200,245,0.28)",
        "glow-lg": "0 0 48px rgba(91,200,245,0.32)",
        "glow-purple": "0 0 24px rgba(36,104,204,0.28)",
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "orb-1": "orbFloat1 20s ease-in-out infinite",
        "orb-2": "orbFloat2 25s ease-in-out infinite",
        "orb-3": "orbFloat3 30s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        orbFloat1: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(60px, -80px) scale(1.1)" },
          "66%": { transform: "translate(-40px, 40px) scale(0.9)" },
        },
        orbFloat2: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(-80px, 60px) scale(1.15)" },
          "66%": { transform: "translate(50px, -50px) scale(0.85)" },
        },
        orbFloat3: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(40px, 80px) scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
