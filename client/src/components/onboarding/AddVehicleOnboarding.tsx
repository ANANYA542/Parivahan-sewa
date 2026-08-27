import { useState } from 'react';
import { motion } from 'framer-motion';
import { scaleTap } from '../../lib/motion';
import { registerVehicle } from '../../lib/api';

interface AddVehicleOnboardingProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const vehicleTypes = ['two-wheeler', 'car-jeep-van', 'commercial-vehicle', 'other'];

function vehicleTypeLabel(value: string) {
  return value.replace(/-/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

/**
 * A one-time, skippable onboarding step — not a gate. Shown only when a
 * signed-in citizen has no linked vehicle yet, so the dashboard and guided
 * flows have something real to prefill from. "Skip for now" always works;
 * every other part of the app stays fully usable without completing this.
 */
export function AddVehicleOnboarding({ userId, onComplete, onSkip }: AddVehicleOnboardingProps) {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<string>('two-wheeler');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!registrationNumber.trim()) {
      setError('Enter your vehicle registration number, or skip for now.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await registerVehicle(userId, { registrationNumber: registrationNumber.trim(), vehicleType });
      onComplete();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to add this vehicle right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, transform: 'translateY(-8px)' }}
      animate={{ opacity: 1, transform: 'translateY(0)' }}
      className="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-5"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">One-time setup</p>
      <h3 className="mt-1 text-lg font-semibold text-white">Add your vehicle so guided services can prefill for you.</h3>
      <p className="mt-1 text-sm text-slate-300">Optional — you can browse and use every service without this. Add it any time.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block text-sm text-slate-200">
          Registration number
          <input
            value={registrationNumber}
            onChange={(event) => setRegistrationNumber(event.target.value)}
            placeholder="e.g. MH12AB1234"
            className="mt-1.5 w-48 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-amber-300"
          />
        </label>
        <label className="block text-sm text-slate-200">
          Vehicle type
          <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} className="mt-1.5 w-48 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-amber-300">
            {vehicleTypes.map((type) => (
              <option key={type} value={type}>{vehicleTypeLabel(type)}</option>
            ))}
          </select>
        </label>
        <motion.button {...scaleTap} type="button" disabled={isSubmitting} onClick={() => void submit()} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-300 disabled:opacity-60">
          {isSubmitting ? 'Adding…' : 'Add vehicle'}
        </motion.button>
        <motion.button {...scaleTap} type="button" onClick={onSkip} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:border-white/25 hover:text-white">
          Skip for now
        </motion.button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </motion.section>
  );
}
