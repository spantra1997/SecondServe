/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3A5A40',
          foreground: '#FFFFFF',
          hover: '#2F4A33',
          active: '#243B28',
        },
        secondary: {
          DEFAULT: '#D97757',
          foreground: '#FFFFFF',
          hover: '#C66545',
          active: '#B35434',
        },
        background: {
          DEFAULT: '#F9F7F2',
          paper: '#FFFFFF',
          subtle: '#F2EFE9',
        },
        foreground: {
          DEFAULT: '#1A1A1A',
          muted: '#5C5C5C',
          inverse: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#EAD2AC',
          foreground: '#3A5A40',
        },
        border: {
          DEFAULT: '#E5E0D6',
          focus: '#3A5A40',
        },
        muted: {
          DEFAULT: '#F2EFE9',
          foreground: '#5C5C5C',
        },
        status: {
          success: '#3A5A40',
          warning: '#E9C46A',
          error: '#D97757',
          info: '#588157',
        },
      },
      fontFamily: {
        heading: ['DM Serif Display', 'serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(58, 90, 64, 0.05)',
        'card-hover': '0 10px 40px -10px rgba(58, 90, 64, 0.1)',
        float: '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}