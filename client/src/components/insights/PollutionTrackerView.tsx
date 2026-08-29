import type { IdentityBundle, MobilityIntelligenceSnapshot } from '@parivahan/shared';
import { documentStatusStyle } from '../../lib/documentStatus';

interface PollutionTrackerViewProps {
  identity: IdentityBundle | null;
  mobilityIntelligence: MobilityIntelligenceSnapshot | null;
  onRenewPuc: () => void;
}

/**
 * A dedicated PUC-focused view over the same real per-vehicle document
 * status My Vahan already tracks — not a live air-quality/emissions feed
 * (the page's own subtitle already says so), just a fuller read of one
 * field (`documentStatus.puc`) instead of the "still being built" stub.
 */
export function PollutionTrackerView({ identity, mobilityIntelligence, onRenewPuc }: PollutionTrackerViewProps) {
  const vehicles = identity?.vehicles ?? [];
  const pucReasons = (mobilityIntelligence?.score.reasons ?? []).filter((reason) => reason.toLowerCase().includes('puc'));

  if (identity && vehicles.length === 0) {
    return (
      <div className="mt-7 flex flex-col items-center rounded-2xl border border-dashed border-slate-800 px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl" aria-hidden="true">🌫️</span>
        <p className="mt-4 text-sm font-medium text-slate-300">No linked vehicle yet.</p>
        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">Link a vehicle to see its PUC status here.</p>
      </div>
    );
  }

  return (
    <div className="mt-7 space-y-4">
      {pucReasons.length ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-300">
          {pucReasons.map((reason) => <p key={reason}>{reason}</p>)}
        </div>
      ) : null}
      {vehicles.map((vehicle) => {
        const style = documentStatusStyle(vehicle.documentStatus.puc);
        const needsRenewal = style.tone === 'bad' || style.tone === 'warning';
        return (
          <div key={vehicle.vehicleId} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div>
              <p className="text-sm font-semibold text-slate-50">{vehicle.registrationNumber}</p>
              <p className="mt-1 text-xs text-slate-400">{vehicle.vehicleType.replace(/-/g, ' ')}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${style.badge}`}>PUC: {style.label}</span>
              {needsRenewal ? (
                <button type="button" onClick={onRenewPuc} className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-300">
                  Renew PUC
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
