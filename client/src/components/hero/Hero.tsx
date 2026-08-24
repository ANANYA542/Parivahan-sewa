import { motion } from 'framer-motion';
import { DURATION, EASE_OUT } from '../../lib/motion';
import { RoadJourney } from './RoadJourney';

interface HeroProps {
  title: string;
  subtitle: string;
}

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT }}
      className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur"
    >
      <p className="mb-3 text-sm uppercase tracking-[0.3em] text-amber-300">Phase 1 + Phase 2 · core loop &amp; mobility intelligence</p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">{subtitle}</p>
      <RoadJourney />
      <p className="mt-1 text-center text-xs text-slate-500">One route, five services — the same journey this app guides you through.</p>
    </motion.section>
  );
}
