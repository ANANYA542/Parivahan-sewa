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
      className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 py-7 shadow-sm md:px-9 md:py-9"
    >
      <div className="relative grid grid-cols-1 gap-7 xl:grid-cols-[1fr_0.9fr] xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-orange-700">Your mobility companion</span>
            <span className="font-mono text-[11px] text-slate-500">MOCK DATA PROTOTYPE</span>
          </div>
          <p className="mt-7 text-sm font-medium text-orange-600">Welcome back, {firstName}</p>
          <h1 className="font-display mt-2 max-w-3xl text-4xl leading-[1.02] tracking-tight text-slate-900 md:text-6xl">One clear route for every road task.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">{subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={onStartJourney} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-orange-600">Ask the journey guide</button>
            <button type="button" onClick={onBrowseServices} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50">Browse all services</button>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-3 pt-3 md:px-5">
          <div className="flex items-center justify-between gap-3 px-2 pt-1">
            <span className="font-mono text-[10px] tracking-[0.16em] text-slate-500">YOUR ROUTE</span>
            <span className="text-xs text-slate-600">{activeCaseCount ? `${activeCaseCount} case${activeCaseCount === 1 ? '' : 's'} in progress` : 'Ready when you are'}</span>
          </div>
          <RoadJourney />
          {/* mt-8, not mt-2/mt-3 — the route-stop labels below the curve's lowest
              points (e.g. "Challans", "PUC & pollution") sit at a fixed pixel height
              below their anchor point, while this card's height only scales with the
              SVG's own aspect ratio. Without this clearance the label pills overlap
              this caption text at every viewport width tested. */}
          <p className="mt-8 pb-3 text-center text-xs leading-5 text-slate-500">Choose a checkpoint and the platform guides the next step, not the portal maze.</p>
        </div>
      </div>
      <span className="sr-only">{title}</span>
    </motion.section>
  );
}
