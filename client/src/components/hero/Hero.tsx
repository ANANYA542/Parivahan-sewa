import { motion } from 'framer-motion';
import { DURATION, EASE_OUT } from '../../lib/motion';
import { RoadJourney } from './RoadJourney';

interface HeroProps {
  title: string;
  subtitle: string;
  userName: string;
  activeCaseCount: number;
  onStartJourney: () => void;
  onBrowseServices: () => void;
}

export function Hero({ title, subtitle, userName, activeCaseCount, onStartJourney, onBrowseServices }: HeroProps) {
  const firstName = userName.split(' ')[0] || userName;

  return (
    <motion.section
      initial={{ opacity: 0, transform: 'translateY(16px)' }}
      animate={{ opacity: 1, transform: 'translateY(0)' }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT }}
      className="relative overflow-hidden rounded-[2rem] border border-amber-100/10 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-green-950/40 px-6 py-7 shadow-2xl shadow-black/20 md:px-9 md:py-9"
    >
      <div className="absolute right-[-4rem] top-[-5rem] h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" aria-hidden="true" />
      <div className="relative grid gap-7 xl:grid-cols-[1fr_0.9fr] xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-100">Your mobility companion</span>
            <span className="font-mono text-[11px] text-slate-400">MOCK DATA PROTOTYPE</span>
          </div>
          <p className="mt-7 text-sm font-medium text-amber-200">Welcome back, {firstName}</p>
          <h1 className="font-display mt-2 max-w-3xl text-4xl leading-[1.02] tracking-tight text-white md:text-6xl">One clear route for every road task.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={onStartJourney} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors duration-150 hover:bg-amber-300">Ask the journey guide</button>
            <button type="button" onClick={onBrowseServices} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors duration-150 hover:bg-white/10">Browse all services</button>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/30 px-3 pt-3 backdrop-blur-sm md:px-5">
          <div className="flex items-center justify-between gap-3 px-2 pt-1">
            <span className="font-mono text-[10px] tracking-[0.16em] text-slate-500">YOUR ROUTE</span>
            <span className="text-xs text-slate-300">{activeCaseCount ? `${activeCaseCount} case${activeCaseCount === 1 ? '' : 's'} in progress` : 'Ready when you are'}</span>
          </div>
          <RoadJourney />
          <p className="pb-3 text-center text-xs leading-5 text-slate-400">Choose a checkpoint and the platform guides the next step, not the portal maze.</p>
        </div>
      </div>
      <span className="sr-only">{title}</span>
    </motion.section>
  );
}
