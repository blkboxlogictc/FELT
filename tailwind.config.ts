import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          DEFAULT: '#2d6a4f',
          light: '#3d8a67',
          dark: '#1f4f3a',
          subtle: '#1a3d2e',
          muted: '#244f3a',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#d9bc6a',
          dark: '#a8882e',
          subtle: '#261f0a',
        },
        surface: {
          base: '#0f1117',
          card: '#161b27',
          elevated: '#1e2535',
          border: '#2a3347',
          hover: '#232d42',
        },
        win: '#22c55e',
        loss: '#ef4444',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
