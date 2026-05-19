/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Urbanist',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans JP',
          'Hiragino Sans',
          'Yu Gothic UI',
          'sans-serif',
        ],
      },
      colors: {
        gatame: {
          /** 画面ベースの深いミッドナイト（#050a14 / #0a1128 系） */
          navy: '#0a1128',
          midnight: '#050a14',
          /** ブラスゴールド（細枠・ラベル用。べた塗の主CTAは避ける） */
          gold: '#c5a059',
          goldHi: '#d4af37',
          red: '#C0392B',
        },
      },
    },
  },
  plugins: [],
}
