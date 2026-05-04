/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        credit: '#10b981',
        debit: '#fb7185',
      },
    },
  },
  plugins: [],
};
