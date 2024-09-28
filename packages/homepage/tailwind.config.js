/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Zen Kaku Gothic New", "sans-serif"],
      },
      screens: {
        xs: "350px",
      },
      borderWidth: {
        1: "1px",
      },
    },
  },
  plugins: [],
}
