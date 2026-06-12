/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080b12",
        panel: "#0e131d",
        cyan: "#64d8ff",
        acid: "#c8ff62",
        violet: "#9c8cff"
      },
      fontFamily: {
        sans: ["Inter", "\"PingFang SC\"", "\"Microsoft YaHei\"", "sans-serif"],
        display: ["\"Avenir Next\"", "Inter", "\"PingFang SC\"", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(100,216,255,.28), 0 22px 80px rgba(20,108,180,.16)",
        acid: "0 0 36px rgba(200,255,98,.18)"
      }
    }
  },
  plugins: [],
};
