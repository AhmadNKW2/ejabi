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
      backgroundImage: {
        page: 'radial-gradient(circle at 20% -10%, #16304f 0%, #0c1826 55%)',
      },
    },
  },
  plugins: [],
};

export default config;
