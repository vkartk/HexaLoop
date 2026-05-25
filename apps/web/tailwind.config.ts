import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#185FA5',
          50: '#EEF5FC',
          100: '#D6E6F5',
          200: '#A8C7E8',
          300: '#79A8DB',
          400: '#4B89CE',
          500: '#185FA5',
          600: '#134B83',
          700: '#0F3962',
          800: '#0A2641',
          900: '#051321',
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
