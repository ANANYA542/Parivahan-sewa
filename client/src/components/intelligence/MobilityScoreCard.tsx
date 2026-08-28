import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { MobilityIntelligenceSnapshot } from '@parivahan/shared';
import { DURATION, EASE_OUT } from '../../lib/motion';

interface MobilityScoreCardProps {
  snapshot: MobilityIntelligenceSnapshot | null;
}

function ScoreValue({ score }: { score: number }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 20, mass: 0.6 });
  const rounded = useTransform(spring, (value) => Math.round(value));

  useEffect(() => {
    motionValue.set(score);
  }, [score, motionValue]);

  return <motion.span>{rounded}</motion.span>;
}

const severityDot: Record<string, string> = {
  critical: 'bg-rose-500',
  warning: 'bg-orange-400',
  info: 'bg-slate-400'
};

export function MobilityScoreCard({ snapshot }: MobilityScoreCardProps) {
  const score = snapshot?.score.score;
  const circumference = 2 * Math.PI * 42;
  const progress = useMotionValue(0);
  const springProgress = useSpring(progress, { stiffness: 90, damping: 22, mass: 0.6 });
  const dashOffset = useTransform(springProgress, (value) => circumference * (1 - value / 100));

  useEffect(() => {
    progress.set(score ?? 0);
  }, [score, progress]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Mobility Health Score</h2>
      <div className="mt-6 flex items-center gap-6">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="8" />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#f97316"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              style={{ strokeDashoffset: score !== undefined ? dashOffset : circumference }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-semibold text-orange-600">{score !== undefined ? <ScoreValue score={score} /> : '--'}</div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">/ 100</div>
          </div>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-600">{snapshot ? snapshot.score.reasons.join(' · ') : 'Calculating from your linked vehicle and case records.'}</p>
      </div>
      {/* Plain conditional rendering, not AnimatePresence mode="wait" — same
          stuck-exit-animation bug confirmed elsewhere (see App.tsx /
          GuidedNavigator.tsx): under real click timing the exit animation can
          stall and this section never re-mounts for the new snapshot. */}
        {snapshot ? (
          <motion.div
            key={snapshot.computedAt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            className="mt-5 space-y-2 border-t border-slate-200 pt-4"
          >
            {snapshot.complianceAlerts.slice(0, 2).map((alert, index) => (
              <motion.div
                key={alert.alertId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: DURATION.base, ease: EASE_OUT, delay: index * 0.06 }}
                className="flex items-start gap-2 text-sm text-slate-600"
              >
                <span className={`mt-1.5 h-2 w-2 rounded-full ${severityDot[alert.severity]}`} />
                <span>{alert.detail}</span>
              </motion.div>
            ))}
            {!snapshot.complianceAlerts.length ? <p className="text-sm text-green-700">No compliance actions are currently due.</p> : null}
          </motion.div>
        ) : null}
    </section>
  );
}
