import { motion } from 'framer-motion';
import type { ServiceDefinition } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';

interface JourneyPreviewProps {
  service: ServiceDefinition;
  onStart: () => void;
  onChooseAnother: () => void;
}

/**
 * Shown once a service is chosen, before the guided form (or official-portal
 * handoff) actually begins — what the service involves, what's needed, and
 * how long it takes, so a citizen can back out before anything is "started".
 */
export function JourneyPreview({ service, onStart, onChooseAnother }: JourneyPreviewProps) {
  const journeySteps = service.steps.filter((step) => step.id !== 'preview');

  return (
    <motion.section
      key={service.serviceId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
      className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-sm md:p-7"
    >
      <p className="font-mono text-[10px] tracking-[0.16em] text-slate-400">JOURNEY PREVIEW</p>
      <h2 className="font-display mt-2 text-3xl text-slate-50">{service.name}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{service.description}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-800 p-4">
          <p className="font-mono text-[10px] tracking-[0.16em] text-amber-300">ESTIMATED TIME</p>
          <p className="mt-2 text-sm text-slate-300">{service.estimatedTime ?? (service.delivery === 'official_portal' ? 'Handled on the official portal' : 'A few minutes')}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-800 p-4">
          <p className="font-mono text-[10px] tracking-[0.16em] text-amber-300">WHAT YOU'LL NEED</p>
          {service.requiredDocuments.length ? (
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {service.requiredDocuments.map((document) => <li key={document}>{document}</li>)}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-400">No documents needed to get started.</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-800 p-4">
          <p className="font-mono text-[10px] tracking-[0.16em] text-amber-300">WHAT TO EXPECT</p>
          {journeySteps.length ? (
            <ol className="mt-2 space-y-1 text-sm text-slate-300">
              {journeySteps.map((step, index) => <li key={step.id}>{index + 1}. {step.title}</li>)}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-slate-400">You'll continue through the official portal from here.</p>
          )}
        </div>
      </div>

      {service.delivery === 'official_portal' ? (
        <p className="mt-5 text-sm leading-6 text-slate-400">This service is delivered through the official Parivahan portal. Availability and document requirements can vary by state and RTO.</p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <motion.button
          {...scaleTap}
          type="button"
          onClick={onStart}
          className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-300"
        >
          Start this journey
        </motion.button>
        <button
          type="button"
          onClick={onChooseAnother}
          className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition-colors duration-150 hover:border-slate-600"
        >
          Choose a different service
        </button>
      </div>
    </motion.section>
  );
}
