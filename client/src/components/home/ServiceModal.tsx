import { AnimatePresence, motion } from 'framer-motion';
import type { ServiceDefinition } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';

interface ServiceModalProps {
  service: ServiceDefinition | null;
  onClose: () => void;
  onStartProcess: (serviceId: string) => void;
}

export function ServiceModal({ service, onClose, onStartProcess }: ServiceModalProps) {
  const open = Boolean(service);

  return (
    <AnimatePresence>
      {open && service ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.base, ease: EASE_OUT }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/72 px-4 py-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className="relative w-[min(92vw,42rem)] overflow-hidden rounded-[2rem] border border-slate-900/10 bg-white text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.35)]"
          >
            <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
              <div className="p-6 md:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{service.delivery === 'guided' ? 'Guided service' : 'Official handoff'}</p>
                <h2 id="service-modal-title" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{service.name}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-700">{service.description}</p>

                {service.delivery === 'guided' ? (
                  <>
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workflow</p>
                      <ol className="mt-3 space-y-3">
                        {service.steps.map((step, index) => (
                          <li key={step.id} className="flex gap-3 text-sm text-slate-700">
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">{index + 1}</span>
                            <span>
                              <span className="font-medium text-slate-950">{step.title}</span>
                              <span className="block text-slate-600">{step.fields.join(' · ')}</span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Optional video explainer</p>
                      <div className="mt-3 aspect-video rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
                        <div className="flex h-full flex-col justify-between">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg">▶</div>
                          <p className="text-sm leading-6 text-slate-200">Video section reserved for service walkthroughs, official guidance, or a recorded explainer.</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Redirect</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">This service continues on the official portal. We keep the checkpoint in context, then hand off cleanly.</p>
                    {service.officialUrl ? (
                      <a href={service.officialUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                        Open official portal
                      </a>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-slate-50 p-6 md:border-l md:border-t-0 md:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Required documents</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {service.requiredDocuments.map((item) => (
                    <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What happens next</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                    <li>1. Review the checkpoint details.</li>
                    <li>2. Continue into the guided workflow or portal handoff.</li>
                    <li>3. Track the resulting case in the dashboard.</li>
                  </ul>
                </div>
                <div className="mt-6 flex gap-3">
                  <motion.button {...scaleTap} type="button" onClick={() => onStartProcess(service.serviceId)} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-300">
                    Start process
                  </motion.button>
                  <motion.button {...scaleTap} type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
                    Close
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
          <button type="button" className="absolute inset-0 -z-10 cursor-default" aria-label="Close service modal overlay" onClick={onClose} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

