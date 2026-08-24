import { AnimatePresence, motion } from 'framer-motion';
import type { MobilityNudge } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';

interface MobilityNudgesProps {
  nudges: MobilityNudge[];
  onAction: (serviceId: string) => void;
}

const severityBadge: Record<string, string> = {
  critical: 'bg-rose-400/15 text-rose-200',
  warning: 'bg-amber-400/15 text-amber-200',
  info: 'bg-sky-400/15 text-sky-200'
};

export function MobilityNudges({ nudges, onAction }: MobilityNudgesProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <h2 className="text-xl font-semibold text-white">Mobility Nudges</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">Read-side recommendations generated from your document status and open cases.</p>
      <div className="mt-5 space-y-3">
        <AnimatePresence initial={false}>
          {nudges.map((nudge, index) => (
            <motion.div
              key={nudge.nudgeId}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT, delay: index * 0.05 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-white">{nudge.title}</h3>
                <span className={`rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${severityBadge[nudge.severity]}`}>{nudge.severity}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{nudge.message}</p>
              {nudge.actionServiceId ? (
                <motion.button {...scaleTap} type="button" onClick={() => onAction(nudge.actionServiceId!)} className="mt-3 text-sm font-medium text-amber-200 hover:text-amber-100">
                  Review recommended service
                </motion.button>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
