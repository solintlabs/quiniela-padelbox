import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          fg: 'hsl(var(--accent-fg))',
        },
        bg: {
          DEFAULT: 'hsl(var(--bg))',
          elev: 'hsl(var(--bg-elev))',
        },
        ink: 'hsl(var(--ink))',
        muted: 'hsl(var(--muted))',
        line: 'hsl(var(--border))',
        success: 'hsl(var(--success))',
        danger: 'hsl(var(--danger))',
        warning: 'hsl(var(--warning))',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        lg: '10px',
      },
      boxShadow: {
        'glow-accent': '0 0 0 1px hsl(var(--accent) / 0.25), 0 8px 24px -8px hsl(var(--accent) / 0.18)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
