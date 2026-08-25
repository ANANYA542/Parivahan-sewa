import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        panel: '#111827',
        accent: '#f59e0b',
        accentSoft: '#fef3c7',
        text: '#e5e7eb',
        muted: '#94a3b8'
      }
    }
  },
  plugins: []
} satisfies Config;

