import { motion } from 'framer-motion';
import { Fuel } from 'lucide-react';
import type { IdentityBundle } from '@parivahan/shared';
import { fadeUp, staggerContainer } from '../../lib/motion';
import { illustrativeFuelFigure } from '../insights/FuelConsumptionView';

interface FuelWidgetProps {
  identity: IdentityBundle | null;
}

/**
 * A dashboard-sized version of FuelConsumptionView's meters — same
 * illustrative-figure source (no separate data model to keep in sync), just
 * scoped to a card instead of a full page. Capped at 3 vehicles so a citizen
 * with a large fleet doesn't push the rest of the dashboard off-screen; the
 * full page (via "More") has no such cap.
 */
export function FuelWidget({ identity }: FuelWidgetProps) {
  const vehicles = (identity?.vehicles ?? []).slice(0, 3);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Fuel className="h-4 w-4 text-aurora-blue" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-slate-50">Fuel efficiency</h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">Illustrative estimate, not a measured reading.</p>
      {vehicles.length ? (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-5 space-y-4">
          {vehicles.map((vehicle) => {
            const figure = illustrativeFuelFigure(vehicle.vehicleType);
            const fillPercent = Math.min(100, Math.round((figure.value / figure.max) * 100));
            return (
              <motion.div key={vehicle.vehicleId} variants={fadeUp}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-200">{vehicle.registrationNumber}</span>
                  <span className="text-slate-400">{figure.label}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-aurora-blue/15">
                  <motion.div
                    className="h-full rounded-full bg-aurora-blue"
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPercent}%` }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <p className="mt-5 text-sm text-slate-400">Link a vehicle to see an illustrative estimate here.</p>
      )}
    </section>
  );
}
