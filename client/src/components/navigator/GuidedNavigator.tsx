import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CaseRecord, ServiceDefinition, SubmissionData, VehicleRecord } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';
import { useVoiceCapture } from '../../lib/useVoiceCapture';

interface GuidedNavigatorProps {
  service: ServiceDefinition | null;
  vehicles: VehicleRecord[];
  isSubmitting: boolean;
  onSubmit: (input: { serviceId: string; vehicleId?: string; submissionData: SubmissionData }) => Promise<CaseRecord>;
}

function formatField(field: string) {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function fieldIsComplete(field: string, values: Record<string, string>) {
  return field === 'acknowledgement' || field === 'declaration' ? values[field] === 'true' : Boolean(values[field]?.trim());
}

export function GuidedNavigator({ service, vehicles, isSubmitting, onSubmit }: GuidedNavigatorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceField, setVoiceField] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const voice = useVoiceCapture({
    onTranscript: (text) => {
      if (voiceField) setField(voiceField, text);
    }
  });

  useEffect(() => {
    setCurrentStepIndex(0);
    setValues({});
    setMessage(null);
    setError(null);
  }, [service?.serviceId]);

  function useMyLocation(field: string) {
    if (!navigator.geolocation) {
      setError('Location is not available in this browser — enter it manually.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setField(field, `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)} (auto-detected)`);
        setIsLocating(false);
      },
      () => {
        setError('Could not detect your location — enter it manually.');
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  }

  function goToStep(index: number) {
    setDirection(index > currentStepIndex ? 1 : -1);
    setCurrentStepIndex(index);
  }

  if (!service) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 md:p-7">
        <p className="font-mono text-[10px] tracking-[0.16em] text-slate-400">NEXT CHECKPOINT</p>
        <h2 className="font-display mt-2 text-3xl text-white">Your guided route will appear here.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">Ask the journey guide above or choose a service below. We only request the details needed for that checkpoint.</p>
      </section>
    );
  }

  if (service.delivery === 'official_portal') {
    return (
      <motion.section
        key={service.serviceId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.base, ease: EASE_OUT }}
        className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 md:p-7"
      >
        <p className="font-mono text-[10px] tracking-[0.16em] text-slate-400">OFFICIAL HANDOFF</p>
        <h2 className="font-display mt-2 text-3xl text-white">Continue through the official portal.</h2>
        <p className="mt-2 text-sm text-slate-400">{service.name}</p>
        <p className="mt-5 text-sm leading-6 text-slate-300">{service.description}</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">This service is delivered through the official Parivahan portal. Availability and document requirements can vary by state and RTO.</p>
        {service.officialUrl ? (
          <motion.a
            {...scaleTap}
            href={service.officialUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-300"
          >
            Open official service
          </motion.a>
        ) : null}
      </motion.section>
    );
  }

  const activeService = service;
  const currentStep = activeService.steps[currentStepIndex];
  const isLastStep = currentStepIndex === activeService.steps.length - 1;
  const currentStepComplete = currentStep ? currentStep.fields.every((field) => fieldIsComplete(field, values)) : false;

  function setField(field: string, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setError(null);
  }

  async function submit() {
    const allFields = activeService.steps.flatMap((step) => step.fields);
    if (!allFields.every((field) => fieldIsComplete(field, values))) {
      setError('Please complete the required fields before submitting.');
      return;
    }

    const submissionData: SubmissionData = {};
    for (const [field, value] of Object.entries(values)) {
      if (field === 'acknowledgement' || field === 'declaration') {
        submissionData[field] = value === 'true';
      } else if (field === 'attachments') {
        submissionData[field] = value.split(',').map((item) => item.trim()).filter(Boolean);
      } else {
        submissionData[field] = value.trim();
      }
    }

    setError(null);
    try {
      const input = { serviceId: activeService.serviceId, submissionData };
      const caseRecord = await onSubmit(values.vehicleId ? { ...input, vehicleId: values.vehicleId } : input);
      setMessage(`Submitted successfully. Case ${caseRecord.caseId} is now being tracked.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit this journey.');
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-slate-400">GUIDED CHECKPOINT</p>
          <h2 className="font-display mt-2 text-3xl text-white">{activeService.name}</h2>
          <p className="mt-2 text-sm text-slate-400">{activeService.name} · step {currentStepIndex + 1} of {activeService.steps.length}</p>
        </div>
        <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">{activeService.category}</span>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {activeService.steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isDone = index < currentStepIndex;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => index <= currentStepIndex && goToStep(index)}
              className={`relative min-w-max rounded-full px-3 py-1 text-xs transition-colors duration-200 ${isActive ? 'text-slate-950' : isDone ? 'text-green-200' : 'text-slate-500'}`}
            >
              {isActive ? (
                <motion.span layoutId="step-pill-active" className="absolute inset-0 rounded-full bg-amber-400" transition={{ duration: DURATION.base, ease: EASE_OUT }} />
              ) : isDone ? (
                <span className="absolute inset-0 rounded-full bg-green-400/15" />
              ) : (
                <span className="absolute inset-0 rounded-full bg-white/5" />
              )}
              <span className="relative">{index + 1}. {step.title}</span>
            </button>
          );
        })}
      </div>

      <div className="relative mt-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {currentStep ? (
            <motion.div
              key={currentStep.id}
              custom={direction}
              initial={{ opacity: 0, x: 24 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 * direction }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <h3 className="font-medium text-white">{currentStep.title}</h3>
              {currentStep.id === 'preview' ? (
                <div className="mt-4">
                  <p className="text-sm text-slate-300">Keep these ready before you begin:</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-400">
                    {activeService.requiredDocuments.map((document) => <li key={document}>{document}</li>)}
                  </ul>
                </div>
              ) : null}
              <div className="mt-4 space-y-4">
                {currentStep.fields.map((field) => {
                  const isConfirmation = field === 'acknowledgement' || field === 'declaration';
                  if (field === 'vehicleId') {
                    return (
                      <label key={field} className="block text-sm text-slate-200">
                        Select vehicle
                        <select value={values[field] ?? ''} onChange={(event) => setField(field, event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition-colors duration-200 focus:border-amber-300">
                          <option value="">Choose a linked vehicle</option>
                          {vehicles.map((vehicle) => <option key={vehicle.vehicleId} value={vehicle.vehicleId}>{vehicle.registrationNumber} · {vehicle.vehicleType}</option>)}
                        </select>
                      </label>
                    );
                  }

                  if (isConfirmation) {
                    return (
                      <label key={field} className="flex cursor-pointer items-start gap-3 text-sm text-slate-200">
                        <input type="checkbox" checked={values[field] === 'true'} onChange={(event) => setField(field, String(event.target.checked))} className="mt-1 h-4 w-4 accent-amber-400" />
                        <span>I confirm that the information provided is accurate.</span>
                      </label>
                    );
                  }

                  const options = activeService.fieldOptions?.[field];
                  if (options) {
                    return (
                      <div key={field} className="block text-sm text-slate-200">
                        {formatField(field)}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {options.map((option) => {
                            const isSelected = values[field] === option;
                            return (
                              <motion.button
                                key={option}
                                {...scaleTap}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => setField(field, option)}
                                className={`rounded-full border px-3 py-1.5 text-sm transition-colors duration-150 ${isSelected ? 'border-amber-300/70 bg-amber-400/15 text-amber-100' : 'border-white/10 bg-white/5 text-slate-300 hover:border-amber-200/35'}`}
                              >
                                {option}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  const isVoiceActiveHere = voiceField === field;
                  const canDictate = field !== 'attachments';
                  return (
                    <label key={field} className="block text-sm text-slate-200">
                      {formatField(field)}
                      <div className="mt-2 flex gap-2">
                        <input value={values[field] ?? ''} onChange={(event) => setField(field, event.target.value)} placeholder={field === 'attachments' ? 'Comma-separated file names' : `Enter ${formatField(field).toLowerCase()}`} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-amber-300" />
                        {canDictate ? (
                          <motion.button
                            {...scaleTap}
                            type="button"
                            aria-pressed={isVoiceActiveHere && voice.isListening}
                            onClick={() => {
                              setVoiceField(field);
                              void voice.toggle();
                            }}
                            className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition-colors duration-150 ${isVoiceActiveHere && voice.isListening ? 'border-rose-300/60 bg-rose-400/10 text-rose-200' : 'border-white/10 text-slate-300 hover:border-amber-300'}`}
                          >
                            {isVoiceActiveHere && voice.isListening ? 'Stop' : isVoiceActiveHere && voice.isTranscribing ? '…' : '🎙'}
                          </motion.button>
                        ) : null}
                        {field === 'location' ? (
                          <motion.button
                            {...scaleTap}
                            type="button"
                            disabled={isLocating}
                            onClick={() => useMyLocation(field)}
                            className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 hover:border-amber-300 disabled:opacity-50"
                          >
                            {isLocating ? '…' : '📍 Use my location'}
                          </motion.button>
                        ) : null}
                      </div>
                      {isVoiceActiveHere && voice.isTranscribing ? <p className="mt-1.5 text-xs text-amber-200">Transcribing what you said…</p> : null}
                    </label>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <motion.button
          {...scaleTap}
          type="button"
          onClick={() => goToStep(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex === 0 || isSubmitting}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </motion.button>
        {isLastStep ? (
          <motion.button {...scaleTap} type="button" onClick={() => void submit()} disabled={!currentStepComplete || isSubmitting} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Submitting...' : 'Submit case'}
          </motion.button>
        ) : (
          <motion.button {...scaleTap} type="button" onClick={() => goToStep(Math.min(activeService.steps.length - 1, currentStepIndex + 1))} disabled={!currentStepComplete || isSubmitting} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60">
            Continue
          </motion.button>
        )}
      </div>
      <AnimatePresence>
        {message ? <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 text-sm text-green-300">{message}</motion.p> : null}
        {error ? <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 text-sm text-rose-300">{error}</motion.p> : null}
        {voice.error ? <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 text-sm text-rose-300">{voice.error}</motion.p> : null}
      </AnimatePresence>
    </section>
  );
}
