/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f5f7fb',
          100: '#e8ecf7',
          200: '#d1d9ef',
          300: '#aabce7',
          400: '#7f9cdb',
          500: '#6682d0',
          600: '#4d5dbf',
          700: '#3f4ba6',
          800: '#1f2e5c',
          900: '#001f3f',
          950: '#0a1228',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
