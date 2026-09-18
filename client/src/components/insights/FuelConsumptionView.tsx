import { motion } from 'framer-motion';
import type { IdentityBundle, VehicleRecord } from '@parivahan/shared';
import { fadeUp, staggerContainer } from '../../lib/motion';

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

/** A reasonable illustrative ceiling per vehicle type, so the meter fill reads as "how efficient for its class" rather than an arbitrary fraction of one fixed scale. */
const ILLUSTRATIVE_MAX: Record<string, number> = {
  'two-wheeler': 60,
  'three-wheeler': 35,
  'private-car': 25,
  'electric-car': 8,
  'transport-goods-carrier': 12,
  'passenger-bus': 10
};

export interface IllustrativeFuelFigure {
  label: string;
  value: number;
  max: number;
  unit: string;
}

export function illustrativeFuelFigure(vehicleType: string): IllustrativeFuelFigure {
  if (vehicleType === 'electric-car') {
    return { label: '~4.5 km/kWh', value: 4.5, max: ILLUSTRATIVE_MAX[vehicleType] ?? 8, unit: 'km/kWh' };
  }
  const value = ILLUSTRATIVE_KMPL[vehicleType] ?? 18;
  const max = ILLUSTRATIVE_MAX[vehicleType] ?? 30;
  return { label: `~${value} km/l`, value, max, unit: 'km/l' };
}

function FuelMeter({ vehicle }: { vehicle: VehicleRecord }) {
  const figure = illustrativeFuelFigure(vehicle.vehicleType);
  const fillPercent = Math.min(100, Math.round((figure.value / figure.max) * 100));

  return (
    <motion.div variants={fadeUp} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-colors duration-200 hover:border-aurora-blue/30">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-50">{vehicle.registrationNumber}</p>
          <p className="mt-1 text-xs text-slate-400">{vehicle.vehicleType.replace(/-/g, ' ')}</p>
        </div>
        <p className="text-lg font-semibold text-slate-300">{figure.label} <span className="text-xs font-normal text-slate-500">(illustrative)</span></p>
      </div>
      {/* Meter: fill carries the magnitude in one hue, unfilled track is a lighter step of the same hue — never a second color, since this isn't a status/severity read. */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-aurora-blue/15">
        <motion.div
          className="h-full rounded-full bg-aurora-blue"
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
    </motion.div>
  );
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
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
          {vehicles.map((vehicle) => <FuelMeter key={vehicle.vehicleId} vehicle={vehicle} />)}
        </motion.div>
      ) : (
        <p className="text-sm text-slate-400">Link a vehicle to see an illustrative estimate here.</p>
      )}
    </div>
  );
}
