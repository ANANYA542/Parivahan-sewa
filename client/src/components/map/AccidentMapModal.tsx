import { useState } from 'react';
import { motion } from 'framer-motion';
import type { MobilityMapLayer } from '@parivahan/shared';
import { scaleTap } from '../../lib/motion';
import { SmartMobilityMap } from './SmartMobilityMap';

interface AccidentReportingPanelProps {
  layers: MobilityMapLayer[];
  onStartGuidedReport: () => void;
}

/**
 * Embedded (not modal) panel on the Map page — the map plus a quick
 * location-lock and a direct route into the voice/tap-driven accident
 * guided flow, where the structured capture actually happens.
 */
export function AccidentMapModal({ layers, onStartGuidedReport }: AccidentReportingPanelProps) {
  const [locatedAt, setLocatedAt] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationError('Location is not available in this browser.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocatedAt(`${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
        setIsLocating(false);
      },
      () => {
        setLocationError('Could not detect your location — you can enter it in the next step.');
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  }

  return (
    <div className="grid min-h-0 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="min-h-[22rem] rounded-[1.8rem] border border-white/10 bg-white p-3">
        <SmartMobilityMap layers={layers} />
      </div>
      <div className="space-y-4 rounded-[1.8rem] border border-white/10 bg-white/5 p-5 text-white">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">Report from here</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">Was there an accident nearby?</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">Lock your location here, then the guided report walks you through the rest — by voice or by tap, one question at a time.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Location</p>
          <p className="mt-2 text-sm text-slate-300">{locatedAt ?? 'Not detected yet.'}</p>
          {locationError ? <p className="mt-2 text-xs text-rose-300">{locationError}</p> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <motion.button {...scaleTap} type="button" disabled={isLocating} onClick={detectLocation} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-300 disabled:opacity-60">
            {isLocating ? 'Detecting…' : '📍 Auto-detect location'}
          </motion.button>
          <motion.button {...scaleTap} type="button" onClick={onStartGuidedReport} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:border-amber-200/35">
            Start guided reporting
          </motion.button>
        </div>
        <div className="rounded-2xl border border-dashed border-green-300/30 bg-green-400/10 p-4 text-sm text-green-100">
          The guided report stays inside the app, start to finish — you'll get a downloadable record shaped for filing an FIR or an insurance claim.
        </div>
      </div>
    </div>
  );
}
