/**
 * Tailwind CSS Configuration
 * 
 * Design System: Bloomberg Terminal + OKX Tech
 * 
 * Color Philosophy:
 * - Primary (#00ff88): Trust, growth, success - used for positive indicators
 * - Accent (#ffd700): Premium, value - used for highlights and warnings
 * - Surface (#1a1a1a): Card backgrounds - subtle elevation
 * - Background (#0a0a0a): Deep black - professional, minimal
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: '#00ff88',
        accent: '#ffd700',
        
        // Background colors
        background: '#0a0a0a',
        surface: '#1a1a1a',
        
        // Semantic colors
        success: '#00ff88',
        warning: '#ffd700',
        error: '#ff4444',
        
        // Gray scale (custom for dark mode)
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'monospace'],
      },
      
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      
      boxShadow: {
        'glow-sm': '0 0 10px rgba(0, 255, 136, 0.3)',
        'glow': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 255, 136, 0.4)',
        'glow-accent': '0 0 20px rgba(255, 215, 0, 0.3)',
      },
      
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },
      
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 136, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
