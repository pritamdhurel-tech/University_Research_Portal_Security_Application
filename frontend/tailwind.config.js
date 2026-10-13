/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef6f0',
          100: '#d9e9dd',
          200: '#b5d4bf',
          300: '#89b89a',
          400: '#568f6c',
          500: '#2f6b49',
          600: '#27583d',
          700: '#204832',
          800: '#193a29',
          900: '#122d20',
        },
        stone: {
          50:  '#fafaf9',
          100: '#f5f4f0',
          200: '#e8e6df',
          300: '#d4d1c8',
          400: '#b8b4aa',
          500: '#8a8680',
          600: '#6b6860',
          700: '#514e48',
          800: '#363430',
          900: '#1e1d1a',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'focus': '0 0 0 3px rgba(47,107,73,0.25)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

