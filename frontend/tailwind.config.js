/**
 * Tailwind CSS Configuration for KarmaTrust
 * 
 * Design System: Bloomberg Professional + OKX Tech
 * 
 * Colors:
 * - Primary: #00ff88 (neon green) - positive/user
 * - Accent: #ffd700 (gold) - premium/bank
 * - Background: #050505 (deep black) - terminal feel
 * 
 * Fonts:
 * - Mono: JetBrains Mono - for data/numbers
 * - Display: Space Grotesk - for headings
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary palette
        primary: {
          DEFAULT: '#00ff88',
          dim: 'rgba(0, 255, 136, 0.2)',
          glow: 'rgba(0, 255, 136, 0.4)',
        },
        // Accent (financial/gold)
        accent: {
          DEFAULT: '#ffd700',
          dim: 'rgba(255, 215, 0, 0.2)',
          glow: 'rgba(255, 215, 0, 0.4)',
        },
        // Tech blue (OKX style)
        tech: {
          blue: '#00d4ff',
          purple: '#a855f7',
        },
        // Background layers
        background: {
          DEFAULT: '#050505',
          secondary: '#0a0a0a',
          tertiary: '#111111',
        },
        // Surface (cards)
        surface: {
          DEFAULT: '#0a0a0a',
          hover: '#111111',
          border: '#1a1a1a',
        },
        // Risk colors
        risk: {
          low: '#00ff88',
          medium: '#ffd700',
          high: '#ff4444',
        },
        // Text
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          muted: '#505050',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.4)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.4)',
        'glow-blue': '0 0 20px rgba(0, 212, 255, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 255, 136, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.6)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
