import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0c1826',
        'ink-2': '#12233b',
        'ink-3': '#18314f',
        amber: '#e8a33d',
        'amber-dim': '#a97a34',
        teal: '#2c8a84',
        paper: '#f2efe6',
        slate: '#8592a3',
        danger: '#c96a4f',
        line: 'rgba(242, 239, 230, 0.14)',
        cream: '#f4efe4',
        'page-deep': '#08111c',
      },
      fontFamily: {
        cairo: ['var(--font-cairo)', 'sans-serif'],
        tajawal: ['var(--font-tajawal)', 'sans-serif'],
      },
      boxShadow: {
        mark: '0 0 0 3px #f4efe4, 0 0 0 5px rgba(232, 163, 61, 0.55), 0 16px 32px -14px rgba(0, 0, 0, 0.6)',
        'mark-sm': '0 0 0 2px #f4efe4, 0 0 0 3px rgba(232, 163, 61, 0.5)',
        dock: '0 18px 40px -18px rgba(0, 0, 0, 0.8)',
        sheet: '0 40px 90px -24px rgba(0, 0, 0, 0.8)',
        modal: '0 40px 80px -20px rgba(0, 0, 0, 0.75)',
        ticket: '0 24px 50px -32px rgba(0, 0, 0, 0.7)',
      },
      backgroundImage: {
        page: 'radial-gradient(circle at 20% -10%, #16304f 0%, #0c1826 55%)',
        shimmer: 'linear-gradient(90deg, #12233b 0%, #18314f 50%, #12233b 100%)',
        'amber-fade': 'linear-gradient(180deg, rgba(232, 163, 61, 0.08), transparent)',
        'amber-wash': 'linear-gradient(180deg, rgba(232, 163, 61, 0.12), rgba(232, 163, 61, 0.04))',
        'amber-metric': 'linear-gradient(180deg, rgba(232, 163, 61, 0.12), #18314f 70%)',
        'tile-name':
          'linear-gradient(180deg, rgba(8, 16, 28, 0) 0%, rgba(8, 16, 28, 0.08) 22%, rgba(8, 16, 28, 0.42) 52%, rgba(8, 16, 28, 0.78) 78%, rgba(8, 16, 28, 0.94) 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.2s ease infinite',
        'spin-slow': 'spin 0.7s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
