import type { Config } from 'tailwindcss'

/**
 * Bảng màu: xanh mực học thuật chuyển sang xanh công nghệ, điểm nhấn vàng đồng
 * cho nút hành động. Mỗi nhóm khóa học có một sắc độ riêng để phân biệt nhanh
 * trong lưới 08 thẻ.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f7fb', 100: '#e6edf6', 200: '#c7d8ea', 300: '#97b6d8',
          400: '#608fc1', 500: '#3d6fa8', 600: '#2b568b', 700: '#254671',
          800: '#0b3b75', 900: '#082a54',
        },
        brand: {
          50: '#eff8ff', 100: '#dbeefe', 200: '#bfe3fe', 300: '#93d3fd',
          400: '#60bcfa', 500: '#00a6ed', 600: '#0284c7', 700: '#0369a1',
          800: '#075985', 900: '#0c4a6e',
        },
        accent: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f5a524', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f',
        },
      },
      fontFamily: {
        sans: ['var(--font-be-vietnam)', 'system-ui', 'sans-serif'],
        display: ['var(--font-be-vietnam)', 'Georgia', 'serif'],
      },
      maxWidth: { prose: '68ch' },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s ease-out both',
        'slide-up': 'slide-up .25s ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
