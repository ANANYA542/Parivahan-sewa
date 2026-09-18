import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Mic } from 'lucide-react';
import type { CaseRecord, ServiceDefinition, SubmissionData, VehicleRecord } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';
import { useVoiceCapture } from '../../lib/useVoiceCapture';
import { caseReference } from '../../lib/caseReference';

interface GuidedNavigatorProps {
  service: ServiceDefinition | null;
  vehicles: VehicleRecord[];
  isSubmitting: boolean;
  onSubmit: (input: { serviceId: string; vehicleId?: string; submissionData: SubmissionData }) => Promise<CaseRecord>;
  initialValues?: Record<string, string> | undefined;
  onViewCase?: (caseId: string) => void;
  onAddVehicle?: () => void;
}

function formatField(field: string) {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function fieldIsComplete(field: string, values: Record<string, string>, optionalFields: string[]) {
  if (optionalFields.includes(field)) return true;
  return field === 'acknowledgement' || field === 'declaration' ? values[field] === 'true' : Boolean(values[field]?.trim());
}

export function GuidedNavigator({ service, vehicles, isSubmitting, onSubmit, initialValues, onViewCase, onAddVehicle }: GuidedNavigatorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(initialValues ?? {});
  const [message, setMessage] = useState<string | null>(null);
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);
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
    setValues(initialValues ?? {});
    setMessage(null);
    setSubmittedCaseId(null);
    setError(null);
    // initialValues is only meant to seed the flow when it's (re)opened for a
    // given service, not to overwrite in-progress edits on every keystroke —
    // deliberately excluded from this effect's dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setCurrentStepIndex(index);
  }

  if (!service) {
    return (
      <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-sm md:p-7">
        <p className="font-mono text-[10px] tracking-[0.16em] text-slate-400">NEXT CHECKPOINT</p>
        <h2 className="font-display mt-2 text-3xl text-slate-50">Your guided route will appear here.</h2>
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
        className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-sm md:p-7"
      >
        <p className="font-mono text-[10px] tracking-[0.16em] text-slate-400">OFFICIAL HANDOFF</p>
        <h2 className="font-display mt-2 text-3xl text-slate-50">Continue through the official portal.</h2>
        <p className="mt-2 text-sm text-slate-400">{service.name}</p>
        <p className="mt-5 text-sm leading-6 text-slate-300">{service.description}</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">This service is delivered through the official Parivahan portal. Availability and document requirements can vary by state and RTO.</p>
        {service.officialUrl ? (
          <motion.a
            {...scaleTap}
            href={service.officialUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-xl bg-aurora-blue px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-lift"
          >
            Open official service
          </motion.a>
        ) : null}
      </motion.section>
    );
  }

  const activeService = service;
  const optionalFields = activeService.optionalFields ?? [];
  const currentStep = activeService.steps[currentStepIndex];
  const isLastStep = currentStepIndex === activeService.steps.length - 1;
  const currentStepComplete = currentStep ? currentStep.fields.every((field) => fieldIsComplete(field, values, optionalFields)) : false;

  function setField(field: string, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setError(null);
  }

  async function submit() {
    const allFields = activeService.steps.flatMap((step) => step.fields);
    if (!allFields.every((field) => fieldIsComplete(field, values, optionalFields))) {
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
      setMessage(`Submitted successfully. Case ${caseReference(caseRecord.caseId)} is now being tracked.`);
      setSubmittedCaseId(caseRecord.caseId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit this journey.');
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-sm md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-slate-400">GUIDED CHECKPOINT</p>
          <h2 className="font-display mt-2 text-3xl text-slate-50">{activeService.name}</h2>
          <p className="mt-2 text-sm text-slate-400">{activeService.name} · step {currentStepIndex + 1} of {activeService.steps.length}</p>
        </div>
        <span className="rounded-full bg-aurora-magenta/10 px-3 py-1 text-xs font-medium capitalize text-aurora-magenta">{activeService.category.replace(/-/g, ' ')}</span>
      </div>

      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-1"
        style={{ WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent 100%)', maskImage: 'linear-gradient(to right, black 90%, transparent 100%)' }}
      >
        {activeService.steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isDone = index < currentStepIndex;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => index <= currentStepIndex && goToStep(index)}
              className={`relative min-w-max rounded-full px-3 py-1 text-xs transition-colors duration-200 ${isActive ? 'text-white' : isDone ? 'text-emerald-300' : 'text-slate-300'}`}
            >
              {isActive ? (
                <motion.span layoutId="step-pill-active" className="absolute inset-0 rounded-full bg-aurora-blue" transition={{ duration: DURATION.base, ease: EASE_OUT }} />
              ) : isDone ? (
                <span className="absolute inset-0 rounded-full bg-emerald-500/10" />
              ) : (
                <span className="absolute inset-0 rounded-full bg-slate-500/10" />
              )}
              <span className="relative">{index + 1}. {step.title}</span>
            </button>
          );
        })}
      </div>

      <div className="relative mt-6 overflow-hidden">
        {/* Plain conditional rendering here, not AnimatePresence mode="wait" — the
            same stuck-exit-animation issue confirmed on the outer route transition
            (see App.tsx) reproduced here too: after a few step changes, live
            browser testing showed the step content occasionally failing to swap
            immediately on "Continue". This is the primary journey's own step-by-step
            form, so reliability wins over the slide transition. */}
        {currentStep ? (
            <div
              key={currentStep.id}
              className="rounded-2xl border border-slate-800 bg-slate-800 p-4"
            >
              <h3 className="font-medium text-slate-50">{currentStep.title}</h3>
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
                    if (vehicles.length === 0) {
                      return (
                        <div key={field} className="rounded-xl border border-aurora-blue/30 bg-aurora-blue/10 p-4">
                          <p className="text-sm font-medium text-cyan-300">You don&apos;t have a linked vehicle yet</p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">Add one so this checkpoint can prefill it — it only takes a moment, and this journey will be waiting for you when you're back.</p>
                          {onAddVehicle ? (
                            <button
                              type="button"
                              onClick={onAddVehicle}
                              className="mt-3 rounded-xl bg-aurora-blue px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-lift"
                            >
                              Add a vehicle
                            </button>
                          ) : null}
                        </div>
                      );
                    }
                    return (
                      <label key={field} className="block text-sm text-slate-300">
                        Select vehicle
                        <select value={values[field] ?? ''} onChange={(event) => setField(field, event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 outline-none transition-colors duration-200 focus:border-aurora-blue">
                          <option value="">Choose a linked vehicle</option>
                          {vehicles.map((vehicle) => <option key={vehicle.vehicleId} value={vehicle.vehicleId}>{vehicle.registrationNumber} · {vehicle.vehicleType}</option>)}
                        </select>
                      </label>
                    );
                  }

                  if (isConfirmation) {
                    return (
                      <label key={field} className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
                        <input type="checkbox" checked={values[field] === 'true'} onChange={(event) => setField(field, String(event.target.checked))} className="mt-1 h-4 w-4 accent-aurora-blue" />
                        <span>I confirm that the information provided is accurate.</span>
                      </label>
                    );
                  }

                  const options = activeService.fieldOptions?.[field];
                  if (options) {
                    return (
                      <div key={field} className="block text-sm text-slate-300">
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
                                className={`rounded-full border px-3 py-1.5 text-sm transition-colors duration-150 ${isSelected ? 'border-aurora-blue/30 bg-aurora-blue/10 text-cyan-300' : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-aurora-blue/40'}`}
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
                  const isOptional = optionalFields.includes(field);
                  const isMultiline = activeService.multilineFields?.includes(field) ?? false;
                  const sharedInputClassName = "min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-aurora-blue";
                  const FIELD_PLACEHOLDERS: Record<string, string> = {
                    incidentNarrative: 'Describe what happened, in your own words — you can also use the mic',
                    medicalEmergencyDetails: 'Who was affected, what injuries, any first aid or hospital involved',
                    attachments: 'Comma-separated file names'
                  };
                  return (
                    <div key={field}>
                      {field === 'medicalEmergencyDetails' ? (
                        <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                          If anyone needs immediate medical help, call <strong>108</strong> (ambulance) or <strong>112</strong> now — don&apos;t wait to finish this form.
                        </div>
                      ) : null}
                      <label className="block text-sm text-slate-300">
                        {formatField(field)}
                        {isOptional ? <span className="ml-1.5 text-xs text-slate-500">(optional)</span> : null}
                        <div className="mt-2 flex gap-2">
                          {isMultiline ? (
                            <textarea
                              value={values[field] ?? ''}
                              onChange={(event) => setField(field, event.target.value)}
                              placeholder={FIELD_PLACEHOLDERS[field] ?? `Enter ${formatField(field).toLowerCase()}`}
                              rows={4}
                              className={`${sharedInputClassName} resize-y`}
                            />
                          ) : (
                            <input value={values[field] ?? ''} onChange={(event) => setField(field, event.target.value)} placeholder={FIELD_PLACEHOLDERS[field] ?? `Enter ${formatField(field).toLowerCase()}`} className={sharedInputClassName} />
                          )}
                        {canDictate ? (
                          <motion.button
                            {...scaleTap}
                            type="button"
                            aria-pressed={isVoiceActiveHere && voice.isListening}
                            onClick={() => {
                              setVoiceField(field);
                              void voice.toggle();
                            }}
                            className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition-colors duration-150 ${isVoiceActiveHere && voice.isListening ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-slate-700 text-slate-300 hover:border-aurora-blue/40'}`}
                          >
                            {isVoiceActiveHere && voice.isListening ? 'Stop' : isVoiceActiveHere && voice.isTranscribing ? '…' : <Mic className="h-4 w-4" aria-hidden="true" />}
                          </motion.button>
                        ) : null}
                        {field === 'location' ? (
                          <motion.button
                            {...scaleTap}
                            type="button"
                            disabled={isLocating}
                            onClick={() => useMyLocation(field)}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-aurora-blue/40 disabled:opacity-50"
                          >
                            {isLocating ? '…' : (
                              <>
                                <MapPin className="h-4 w-4" aria-hidden="true" />
                                Use my location
                              </>
                            )}
                          </motion.button>
                        ) : null}
                      </div>
                        {isVoiceActiveHere && voice.isTranscribing ? <p className="mt-1.5 text-xs text-cyan-300">Transcribing what you said…</p> : null}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        {/* Plain buttons, not motion.button + scaleTap, on this critical navigation
            path deliberately — a stuck mid-gesture animation state here would mean
            a citizen taps Continue/Submit and the button visually vanishes with no
            way to proceed. The primary journey completing without dead ends matters
            more than a tap micro-interaction on exactly these three buttons. */}
        <button
          type="button"
          onClick={() => goToStep(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex === 0 || isSubmitting}
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors duration-150 hover:border-aurora-blue/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        {isLastStep ? (
          <button type="button" onClick={() => void submit()} disabled={!currentStepComplete || isSubmitting} className="rounded-xl bg-aurora-blue px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-40">
            {isSubmitting ? 'Submitting...' : 'Submit case'}
          </button>
        ) : (
          <button type="button" onClick={() => goToStep(Math.min(activeService.steps.length - 1, currentStepIndex + 1))} disabled={!currentStepComplete || isSubmitting} className="rounded-xl bg-aurora-blue px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-40">
            Continue
          </button>
        )}
      </div>
      <AnimatePresence>
        {message ? (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-slate-950"
              aria-hidden="true"
            >
              ✓
            </motion.span>
            <div>
              <p className="text-sm text-emerald-300">{message}</p>
              {submittedCaseId && onViewCase ? (
                <button type="button" onClick={() => onViewCase(submittedCaseId)} className="mt-3 rounded-xl bg-aurora-blue px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-lift">
                  View &amp; download this case -&gt;
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
        {error ? <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 text-sm text-rose-300">{error}</motion.p> : null}
        {voice.error ? <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 text-sm text-rose-300">{voice.error}</motion.p> : null}
      </AnimatePresence>
    </section>
  );
}
