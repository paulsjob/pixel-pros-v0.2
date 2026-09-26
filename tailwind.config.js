/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        retro: ['"Silkscreen"', 'monospace'],
        number: ['"VT323"', 'monospace'],
      },
      borderWidth: {
        '3': '3px',
      },
      colors: {
        retroNavy: '#0b1021',
        retroCream: '#fae5b8',
        retroGold: '#facc15',
        retroBlue: '#12579b',
      },
      boxShadow: {
        arcade: '4px 4px 0px #000000',
        'arcade-sm': '2px 2px 0px #000000',
      },
    },
  },
  plugins: [],
}
