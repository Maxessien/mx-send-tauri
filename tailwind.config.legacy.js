/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./dist/**/*.{html,js}"
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // You can convert and place any oklch colors to hex here
      }
    },
  },
  plugins: [],
};