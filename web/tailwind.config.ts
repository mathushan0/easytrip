import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── Color Palette ───────────────────────────────────────────────────────
      colors: {
        // Bubbly Theme Colors
        bubbly: {
          yellow: '#FFD93D',
          red: '#FF6B6B',
          blue: '#4DABF7',
          teal: '#63E6BE',
          purple: '#DA77F2',
          orange: '#FFA94D',
        },
        // Aurora Theme
        aurora: {
          primary: '#667eea',
          secondary: '#764ba2',
          accent: '#f093fb',
        },
        // Warm Sand Theme
        sand: {
          primary: '#D4A574',
          secondary: '#8B7355',
          accent: '#F4D9B8',
        },
        // Electric Theme
        electric: {
          primary: '#00D9FF',
          secondary: '#FF006E',
          accent: '#FFBE0B',
        },
      },

      // ─── Typography ──────────────────────────────────────────────────────────
      fontFamily: {
        fredoka: ['Fredoka', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
      fontSize: {
        // Display sizes (Fredoka 500/600/700)
        'display-2xl': ['48px', { lineHeight: '56px', fontWeight: '700' }],
        'display-xl': ['40px', { lineHeight: '48px', fontWeight: '600' }],
        'display-lg': ['32px', { lineHeight: '40px', fontWeight: '600' }],
        'display-md': ['28px', { lineHeight: '36px', fontWeight: '600' }],
        'display-sm': ['24px', { lineHeight: '32px', fontWeight: '500' }],

        // Body sizes (Nunito 600/700/800/900)
        'body-xl': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'body-xs': ['12px', { lineHeight: '16px', fontWeight: '600' }],
      },

      // ─── Shadows ──────────────────────────────────────────────────────────────
      boxShadow: {
        // Flat 3px shadow
        'flat-sm': '0 3px 8px rgba(0, 0, 0, 0.12)',
        'flat-md': '0 3px 12px rgba(0, 0, 0, 0.15)',
        'flat-lg': '0 3px 16px rgba(0, 0, 0, 0.18)',

        // Lift 4px shadow
        'lift-sm': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lift-md': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'lift-lg': '0 4px 20px rgba(0, 0, 0, 0.16)',

        // Custom scrollbar shadow
        'card-hover': '0 4px 24px rgba(0, 0, 0, 0.1)',
      },

      // ─── Border Radius ────────────────────────────────────────────────────────
      borderRadius: {
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
      },

      // ─── Spacing ──────────────────────────────────────────────────────────────
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },

      // ─── Animations ───────────────────────────────────────────────────────────
      keyframes: {
        // Spring bounce for tabs
        'tab-bounce': {
          '0%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-6px) scale(1.1)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        // Card lift on hover
        'card-lift': {
          '0%': { transform: 'translateY(0)', boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12)' },
          '100%': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)' },
        },
        // Pulse animation
        'pulse-soft': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        // Confetti burst
        'confetti-burst': {
          '0%': { transform: 'scale(0) translateY(0)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(-100px)', opacity: '0' },
        },
        // Wobble for errors
        'wobble': {
          '0%': { transform: 'translateX(0deg)' },
          '15%': { transform: 'translateX(-5px) rotate(-5deg)' },
          '30%': { transform: 'translateX(5px) rotate(5deg)' },
          '45%': { transform: 'translateX(-4px) rotate(-4deg)' },
          '60%': { transform: 'translateX(4px) rotate(4deg)' },
          '100%': { transform: 'translateX(0deg) rotate(0deg)' },
        },
      },

      animation: {
        'tab-bounce': 'tab-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'card-lift': 'card-lift 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'confetti': 'confetti-burst 0.8s ease-out forwards',
        'wobble': 'wobble 0.6s ease-in-out',
      },

      // ─── Transitions ──────────────────────────────────────────────────────────
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
        '350': '350ms',
      },

      // ─── Customization ────────────────────────────────────────────────────────
      maxWidth: {
        'content': '1200px',
        'form': '500px',
      },

      width: {
        'sidebar': '200px',
      },

      height: {
        'header': '64px',
        'tab': '44px',
      },

      // ─── Z-Index ──────────────────────────────────────────────────────────────
      zIndex: {
        'sticky': '40',
        'overlay': '45',
        'modal': '50',
      },
    },
  },

  // ─── Dark Mode ─────────────────────────────────────────────────────────────
  darkMode: ['class', '[data-theme="dark"]'],

  plugins: [],
};

export default config;
