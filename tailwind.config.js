/** @type {import('tailwindcss').Config} */
const withOpacity = (variable) => ({ opacityValue }) =>
  opacityValue === undefined
    ? `rgb(var(${variable}))`
    : `rgb(var(${variable}) / ${opacityValue})`

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: withOpacity('--c-canvas'),
        surface: withOpacity('--c-surface'),
        elevated: withOpacity('--c-elevated'),
        sunken: withOpacity('--c-sunken'),
        hairline: withOpacity('--c-hairline'),
        ink: withOpacity('--c-ink'),
        muted: withOpacity('--c-muted'),
        faint: withOpacity('--c-faint'),
        brand: {
          DEFAULT: withOpacity('--c-brand'),
          soft: withOpacity('--c-brand-soft'),
          ink: withOpacity('--c-brand-ink'),
        },
        violet: { brand: withOpacity('--c-violet') },
        cyan: { brand: withOpacity('--c-cyan') },
        success: withOpacity('--c-success'),
        warn: withOpacity('--c-warn'),
        danger: withOpacity('--c-danger'),
      },
      fontFamily: {
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 6vw, 4.75rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(2.25rem, 4.4vw, 3.5rem)', { lineHeight: '1.06', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.12', letterSpacing: '-0.025em' }],
        'display-sm': ['clamp(1.35rem, 2vw, 1.75rem)', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.18)',
        lift: '0 2px 4px rgb(0 0 0 / 0.05), 0 18px 44px -18px rgb(0 0 0 / 0.35)',
        glow: '0 0 0 1px rgb(var(--c-brand) / 0.35), 0 12px 48px -12px rgb(var(--c-brand) / 0.45)',
        inset: 'inset 0 1px 0 0 rgb(255 255 255 / 0.06)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(120deg, rgb(var(--c-brand)) 0%, rgb(var(--c-violet)) 45%, rgb(var(--c-cyan)) 100%)',
        'brand-gradient-soft':
          'linear-gradient(120deg, rgb(var(--c-brand) / 0.18) 0%, rgb(var(--c-violet) / 0.14) 50%, rgb(var(--c-cyan) / 0.12) 100%)',
        'hairline-gradient':
          'linear-gradient(180deg, rgb(var(--c-ink) / 0.12), rgb(var(--c-ink) / 0.02))',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-160% 0' }, '100%': { backgroundPosition: '260% 0' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'gradient-pan': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.75' },
          '100%': { transform: 'scale(2.1)', opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        marquee: 'marquee 38s linear infinite',
        'gradient-pan': 'gradient-pan 7s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.22,1,0.36,1) infinite',
      },
    },
  },
  plugins: [],
}
