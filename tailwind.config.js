import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  content: ['index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          soft: '#f9ecd0',
          rich: '#d4af37',
          deep: '#a37823',
        },
        ivory: '#f8f6f2',
        marble: '#f3efe9',
      },
      fontFamily: {
        serif: ['"Playfair Display"', ...fontFamily.serif],
        display: ['"Cinzel"', ...fontFamily.serif],
        arabic: ['"Scheherazade New"', ...fontFamily.serif],
        sans: ['Inter', ...fontFamily.sans],
      },
      boxShadow: {
        luxury: '0 24px 60px rgba(120, 96, 64, 0.18)',
      },
    },
  },
  plugins: [],
};
