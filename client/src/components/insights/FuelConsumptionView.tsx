import type { IdentityBundle } from '@parivahan/shared';

interface FuelConsumptionViewProps {
  identity: IdentityBundle | null;
}

/** Illustrative-only figures by broad vehicle type — never presented as a real reading; there is no odometer/fuel-log data anywhere in this app to derive one from. */
const ILLUSTRATIVE_KMPL: Record<string, number> = {
  'two-wheeler': 45,
  'three-wheeler': 25,
  'private-car': 16,
  'electric-car': 0,
  'transport-goods-carrier': 6,
  'passenger-bus': 5
};

function illustrativeFigureFor(vehicleType: string): string {
  if (vehicleType === 'electric-car') return '~4.5 km/kWh';
  const value = ILLUSTRATIVE_KMPL[vehicleType] ?? 18;
  return `~${value} km/l`;
}

/**
 * There is no fuel/odometer data model anywhere in this app (unlike
 * document status, which is real seeded data) — so unlike Vehicle Health
 * and Pollution Tracker, this stays an explicitly-labeled illustrative
 * example rather than something dressed up as real. The page's own
 * subtitle already says "coming soon"; this view just gives that state a
 * finished look instead of a bare "still being built" box.
 */
export function FuelConsumptionView({ identity }: FuelConsumptionViewProps) {
  const vehicles = identity?.vehicles ?? [];

  return (
    <div className="mt-7 space-y-4">
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/60 px-5 py-4 text-sm text-slate-400">
        Illustrative example only — not derived from any real reading. This app has no odometer or fuel-log data source yet.
      </div>
      {vehicles.length ? (
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <div key={vehicle.vehicleId} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div>
                <p className="text-sm font-semibold text-slate-50">{vehicle.registrationNumber}</p>
                <p className="mt-1 text-xs text-slate-400">{vehicle.vehicleType.replace(/-/g, ' ')}</p>
              </div>
              <p className="text-lg font-semibold text-slate-300">{illustrativeFigureFor(vehicle.vehicleType)} <span className="text-xs font-normal text-slate-500">(illustrative)</span></p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">Link a vehicle to see an illustrative estimate here.</p>
      )}
    </div>
  );
}
