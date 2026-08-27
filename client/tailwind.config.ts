import type { Config } from 'tailwindcss';

// Design system: brand = amber (saffron), success = green, danger = rose,
// neutral = slate. These are Tailwind's own palettes, used directly rather
// than aliased — see the Design System plan for why.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {}
  },
  plugins: []
} satisfies Config;

