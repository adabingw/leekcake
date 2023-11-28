/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    fontFamily: {
      'Code': ['"JetBrains Mono"', 'sans-serif'] // Ensure fonts with spaces have " " surrounding it.
    }
  },
  plugins: [],
}

