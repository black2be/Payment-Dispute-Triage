/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sb: {
          blue: '#0033A1',
          'blue-dark': '#002366',
          'blue-light': '#E6EDF8',
          gold: '#C8A415',
          'gray-50': '#F7F8FA',
          'gray-100': '#EBEEF2',
          'gray-200': '#D4D9E0',
          'gray-500': '#6B7280',
          'gray-700': '#374151',
          'gray-900': '#1A1F2B',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
