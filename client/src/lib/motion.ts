import type { Variants } from 'framer-motion';

/**
 * One small, shared motion vocabulary so every section in the app moves the
 * same way — entrances ease out on the same curve, at the same couple of
 * durations, instead of every component inventing its own timing.
 */

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const DURATION = {
  fast: 0.16,
  base: 0.24,
  slow: 0.6
} as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, transform: 'translateY(14px)' },
  show: { opacity: 1, transform: 'translateY(0)', transition: { duration: DURATION.base, ease: EASE_OUT } }
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 }
  }
};

export const scaleTap = {
  whileHover: { transform: 'scale(1.015)' },
  whileTap: { transform: 'scale(0.985)' },
  transition: { duration: DURATION.fast, ease: EASE_OUT }
} as const;
