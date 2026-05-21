/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Dark SaaS base palette
        'app': {
          DEFAULT: '#080C12',      // deep space background
          card:    '#0E1520',      // elevated card surface
          surface: '#131B27',     // subtle surface
          border:  'rgba(255,255,255,0.07)',
        },
        // Brand – forest green kept, made richer
        'brand': {
          DEFAULT: '#2C7A5C',
          light:   '#3A9970',
          dark:    '#1C5040',
          accent:  '#C8A96A',      // muted gold
        },
        // Text hierarchy
        'text': {
          primary:   '#F1F5F9',
          secondary: '#8B9CB5',
          muted:     '#4A5568',
        },
        // Semantic
        'success': '#10B981',
        'warning': '#F59E0B',
        'danger':  '#EF4444',
      },
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card':   '0 4px 24px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        'glow':   '0 0 40px -8px rgba(44,122,92,0.4)',
        'gold':   '0 0 40px -8px rgba(200,169,106,0.3)',
        'float':  '0 20px 60px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'grid': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'dots': "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
      },
      animation: {
        'fade-in':  'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.6s ease forwards',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
}
