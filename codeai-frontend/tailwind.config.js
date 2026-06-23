/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        slate: {
          850: '#1e293b',
        },
      },
      animation: {
        'glow': 'glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '1' },
          '25%': { opacity: '0.85' },
          '50%': { opacity: '0.7' },
          '75%': { opacity: '0.85' },
        },
      },
    },
  },
  plugins: [],
}