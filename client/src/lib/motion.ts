import type { Variants } from 'framer-motion';

/**
 * One small, shared motion vocabulary so every section in the app moves the
 * same way — entrances ease out on the same curve, at the same couple of
 * durations, instead of every component inventing its own timing.
 *
 * Timings/physics follow DESIGN.md (Aurora UI, see repo-root DESIGN.md):
 * spring stiffness 120 / damping 20, 480ms fade+translateY entries staggered
 * 100ms apart, 200ms hover lift, 300ms page transitions.
 */

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const DURATION = {
  fast: 0.2,
  base: 0.48,
  slow: 0.6,
  page: 0.3
} as const;

export const AURORA_SPRING = { type: 'spring', stiffness: 120, damping: 20 } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, transform: 'translateY(16px)' },
  show: { opacity: 1, transform: 'translateY(0)', transition: { duration: DURATION.base, ease: EASE_OUT } }
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.04 }
  }
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, transform: 'translateX(8px)' },
  show: { opacity: 1, transform: 'translateX(0)', transition: { duration: DURATION.page, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: DURATION.page, ease: EASE_OUT } }
};

/**
 * `scale` (Framer Motion's structured transform value), not a raw
 * `transform: 'scale(...)'` string — this is the fix for a real, reproduced
 * bug: animating the raw CSS `transform` string forces Framer Motion to
 * interpolate between transform strings (e.g. "none" and "scale(1.03)"),
 * and under instrumented testing this occasionally resolved to a degenerate
 * `matrix(0,0,0,0,0,0)` for a frame right as a hover/tap gesture began —
 * i.e. the button was actually, verifiably scaled to zero and unclickable
 * for an instant. `scale` lets Framer Motion animate a plain number with no
 * string-interpolation step, which removes that failure mode at the source
 * for every button that spreads {...scaleTap}.
 */
export const scaleTap = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: { duration: DURATION.fast, ease: EASE_OUT }
} as const;
