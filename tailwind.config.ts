import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'], // Configura a Inter
      },
      colors: {
        nordic: {
          primary: '#2563EB', // blue-600
          light: '#EFF6FF',   // blue-50
          dark: '#1E3A8A',    // blue-900
        },
        admin: {
          DEFAULT: '#6B21A8', // purple-800
          bg: '#F3E8FF',      // purple-100
        }
      }
    },
  },
  plugins: [],
};
export default config;