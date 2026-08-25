import { useEffect, useState } from 'react';
import type { CaseRecord, ServiceDefinition, SubmissionData, VehicleRecord } from '@parivahan/shared';

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
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStepIndex(0);
    setValues({});
    setMessage(null);
    setError(null);
  }, [service?.serviceId]);

  if (!service) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <h2 className="text-xl font-semibold text-white">Guided Navigator</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Use the Intent Assistant to select a service. Each journey then collects only the details required for that submission.</p>
      </section>
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
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Guided Navigator</h2>
          <p className="mt-2 text-sm text-slate-400">{activeService.name} · step {currentStepIndex + 1} of {activeService.steps.length}</p>
        </div>
        <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">{activeService.category}</span>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {activeService.steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => index <= currentStepIndex && setCurrentStepIndex(index)}
            className={`min-w-max rounded-full px-3 py-1 text-xs ${index === currentStepIndex ? 'bg-amber-400 text-slate-950' : index < currentStepIndex ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/5 text-slate-500'}`}
          >
            {index + 1}. {step.title}
          </button>
        ))}
      </div>

      {currentStep ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
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
                    <select value={values[field] ?? ''} onChange={(event) => setField(field, event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-amber-300">
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

              return (
                <label key={field} className="block text-sm text-slate-200">
                  {formatField(field)}
                  <input value={values[field] ?? ''} onChange={(event) => setField(field, event.target.value)} placeholder={field === 'attachments' ? 'Comma-separated file names' : `Enter ${formatField(field).toLowerCase()}`} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-amber-300" />
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setCurrentStepIndex((index) => Math.max(0, index - 1))} disabled={currentStepIndex === 0 || isSubmitting} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40">Back</button>
        {isLastStep ? (
          <button type="button" onClick={() => void submit()} disabled={!currentStepComplete || isSubmitting} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Submitting...' : 'Submit case'}</button>
        ) : (
          <button type="button" onClick={() => setCurrentStepIndex((index) => Math.min(activeService.steps.length - 1, index + 1))} disabled={!currentStepComplete || isSubmitting} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">Continue</button>
        )}
      </div>
      {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
    </section>
  );
}
