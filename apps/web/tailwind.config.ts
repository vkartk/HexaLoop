import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3B2DDC',
          50: '#EBEAFC',
          100: '#D8D5F8',
          200: '#B1ABF1',
          300: '#8981EA',
          400: '#6257E3',
          500: '#3B2DDC',
          600: '#3327BF',
          700: '#2B21A1',
          800: '#201979',
          900: '#161151',
        },
        ai: {
          DEFAULT: '#534AB7',
          50: '#EFEEF8',
          100: '#D8D5EE',
          500: '#534AB7',
          600: '#423B92',
        },
        ok: '#1D9E75',
        warn: '#BA7517',
        alert: '#E24B4A',
        ink: {
          DEFAULT: '#0F172A',
          muted: '#475569',
          subtle: '#64748B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F8FAFC',
        },
        border: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderWidth: {
        hairline: '0.5px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
