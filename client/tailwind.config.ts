import type { Config } from 'tailwindcss';

// Design system: white background, primary/brand accent = orange, secondary
// accent/success = green, danger = rose, neutral = slate. These are
// Tailwind's own palettes, used directly rather than aliased.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {}
  },
  plugins: []
} satisfies Config;

