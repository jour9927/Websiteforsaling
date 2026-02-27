import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          900: "#0a0a0f",
          700: "#111122"
        }
      },
      backdropBlur: {
        xs: "2px"
      },
      boxShadow: {
        glass: "0 20px 45px -15px rgba(15, 23, 42, 0.35)"
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      }
    }
  },
  plugins: []
};

export default config;
