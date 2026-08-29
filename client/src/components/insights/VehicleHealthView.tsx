import type { IdentityBundle, MobilityIntelligenceSnapshot, VehicleRecord } from '@parivahan/shared';
import { documentStatusStyle } from '../../lib/documentStatus';

interface VehicleHealthViewProps {
  identity: IdentityBundle | null;
  mobilityIntelligence: MobilityIntelligenceSnapshot | null;
  onAddVehicle: () => void;
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function scoreTone(score: number): string {
  if (score >= 85) return 'text-emerald-300';
  if (score >= 65) return 'text-amber-300';
  return 'text-rose-300';
}

function VehicleHealthCard({ vehicle }: { vehicle: VehicleRecord }) {
  const entries = Object.entries(vehicle.documentStatus);
  const atRisk = entries.filter(([, value]) => documentStatusStyle(value).tone !== 'good' && documentStatusStyle(value).tone !== 'neutral').length;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-50">{vehicle.registrationNumber}</p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${atRisk ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
          {atRisk ? `${atRisk} document${atRisk === 1 ? '' : 's'} need attention` : 'All documents in order'}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {entries.map(([field, value]) => {
          const style = documentStatusStyle(value);
          return (
            <div key={field} className="rounded-xl border border-slate-800 bg-slate-800 p-3">
              <div className="font-mono text-[10px] tracking-[0.13em] text-slate-400">{formatLabel(field).toUpperCase()}</div>
              <div className={`mt-1 text-sm font-medium ${style.text}`}>{style.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * A real breakdown of the same document-status data My Vahan already
 * tracks — this page just gives it a dedicated, fuller view (the overall
 * score and its reasons, per-vehicle document grids) instead of the "still
 * being built" placeholder. No new data source, nothing fabricated.
 */
export function VehicleHealthView({ identity, mobilityIntelligence, onAddVehicle }: VehicleHealthViewProps) {
  const vehicles = identity?.vehicles ?? [];

  if (identity && vehicles.length === 0) {
    return (
      <div className="mt-7 flex flex-col items-center rounded-2xl border border-dashed border-slate-800 px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl" aria-hidden="true">🩺</span>
        <p className="mt-4 text-sm font-medium text-slate-300">No linked vehicle yet.</p>
        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">Link a vehicle to see its document health here.</p>
        <button type="button" onClick={onAddVehicle} className="mt-5 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors duration-150 hover:border-slate-600 hover:text-slate-50">
          Link a vehicle
        </button>
      </div>
    );
  }

  return (
    <div className="mt-7 space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="font-mono text-[10px] tracking-[0.16em] text-slate-400">OVERALL SCORE</p>
        <p className={`mt-2 text-5xl font-semibold ${mobilityIntelligence ? scoreTone(mobilityIntelligence.score.score) : 'text-slate-500'}`}>
          {mobilityIntelligence ? mobilityIntelligence.score.score : '—'}
        </p>
        <p className="mt-1 text-sm text-slate-400">Out of 100 — rule-based, computed from your own vehicles' document status and open cases.</p>
        {mobilityIntelligence && mobilityIntelligence.score.reasons.length ? (
          <ul className="mt-4 space-y-1.5 text-sm text-amber-300">
            {mobilityIntelligence.score.reasons.map((reason) => <li key={reason}>· {reason}</li>)}
          </ul>
        ) : mobilityIntelligence ? (
          <p className="mt-4 text-sm text-emerald-300">No issues pulling your score down right now.</p>
        ) : null}
      </div>
      <div className="space-y-4">
        {vehicles.map((vehicle) => <VehicleHealthCard key={vehicle.vehicleId} vehicle={vehicle} />)}
      </div>
    </div>
  );
}
