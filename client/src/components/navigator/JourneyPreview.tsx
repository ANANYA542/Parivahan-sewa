import { motion } from 'framer-motion';
import { FileText, Link2 } from 'lucide-react';
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
          <p className="font-mono text-[10px] tracking-[0.16em] text-aurora-magenta">ESTIMATED TIME</p>
          <p className="mt-2 text-sm text-slate-300">{service.estimatedTime ?? (service.delivery === 'official_portal' ? 'Handled on the official portal' : 'A few minutes')}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-800 p-4">
          <p className="font-mono text-[10px] tracking-[0.16em] text-aurora-magenta">WHAT YOU'LL NEED</p>
          {service.requiredDocuments.length ? (
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {service.requiredDocuments.map((document) => <li key={document}>{document}</li>)}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-400">No documents needed to get started.</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-800 p-4">
          <p className="font-mono text-[10px] tracking-[0.16em] text-aurora-magenta">WHAT TO EXPECT</p>
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

      {service.officialForm?.fillable ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-aurora-blue/30 bg-aurora-blue/5 p-4 text-sm text-slate-200">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
          <span>
            <span className="block font-medium text-cyan-300">Your answers fill the real {service.officialForm.formNumber}</span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-400">
              {service.officialForm.title} — what you enter below is drawn directly onto this real government form; the completed copy becomes downloadable once you submit.{' '}
              <a href={service.officialForm.path} target="_blank" rel="noreferrer" className="underline hover:text-cyan-200">View the blank form</a>.
            </span>
          </span>
        </div>
      ) : service.officialForm ? (
        <a
          href={service.officialForm.path}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-aurora-blue/30 bg-aurora-blue/5 p-4 text-sm text-slate-200 transition-colors duration-150 hover:border-aurora-blue/50"
        >
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
          <span>
            <span className="block font-medium text-cyan-300">Official government form on file: {service.officialForm.formNumber}</span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-400">{service.officialForm.title} — opens the real government PDF in a new tab.</span>
          </span>
        </a>
      ) : service.officialUrl ? (
        <a
          href={service.officialUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-aurora-blue/30 bg-aurora-blue/5 p-4 text-sm text-slate-200 transition-colors duration-150 hover:border-aurora-blue/50"
        >
          <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
          <span>
            <span className="block font-medium text-cyan-300">No matching official form on file yet</span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-400">Opens the official Parivahan portal for this service in a new tab — the authoritative source until a local form is added here.</span>
          </span>
        </a>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <motion.button
          {...scaleTap}
          type="button"
          onClick={onStart}
          className="rounded-xl bg-aurora-blue px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-lift"
        >
          Start this journey
        </motion.button>
        <button
          type="button"
          onClick={onChooseAnother}
          className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition-colors duration-150 hover:border-aurora-blue/40"
        >
          Choose a different service
        </button>
      </div>
    </motion.section>
  );
}
