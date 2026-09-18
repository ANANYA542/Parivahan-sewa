import type { Config } from 'tailwindcss';

// Design system: Aurora UI (designmd.app/library/aurora-ui) — see DESIGN.md at
// the repo root. Dark charcoal surfaces (never pure black), a three-stop
// electric-blue/magenta/cyan aurora accent used for gradients and focus
// states, semantic emerald/rose kept from Tailwind's own palette for
// success/danger. Motion, spacing and component radii follow the same file.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aurora: {
          blue: '#0080FF',
          magenta: '#FF1493',
          cyan: '#00FFFF'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      backgroundImage: {
        'aurora-mesh': 'radial-gradient(at 15% 20%, rgba(0,128,255,0.35) 0, transparent 55%), radial-gradient(at 85% 15%, rgba(255,20,147,0.28) 0, transparent 50%), radial-gradient(at 50% 90%, rgba(0,255,255,0.22) 0, transparent 55%)',
        'aurora-text': 'linear-gradient(90deg, #0080FF 0%, #FF1493 50%, #00FFFF 100%)',
        'aurora-button': 'linear-gradient(135deg, #0080FF 0%, #7A3BFF 55%, #FF1493 100%)'
      },
      boxShadow: {
        lift: '0 8px 30px -8px rgba(0, 128, 255, 0.35)',
        card: '0 2px 12px rgba(0,0,0,0.24)'
      },
      keyframes: {
        'aurora-drift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        'aurora-drift': 'aurora-drift 10s ease-in-out infinite',
        shimmer: 'shimmer 1.8s ease-in-out infinite'
      }
    }
  },
  plugins: []
} satisfies Config;

