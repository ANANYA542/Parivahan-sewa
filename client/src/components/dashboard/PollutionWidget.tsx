import { motion } from 'framer-motion';
import { CloudFog } from 'lucide-react';
import type { IdentityBundle } from '@parivahan/shared';
import { documentStatusStyle } from '../../lib/documentStatus';
import { fadeUp, scaleTap, staggerContainer } from '../../lib/motion';

interface PollutionWidgetProps {
  identity: IdentityBundle | null;
  onRenewPuc: () => void;
}

/**
 * PUC status is a state (active / due-soon / expired), not a magnitude — so
 * it reads as a status dot + label per dataviz convention, never a meter or
 * a bare color. Same `documentStatusStyle` source as My Vahan and the full
 * Pollution Tracker page, just condensed to a dashboard card.
 */
export function PollutionWidget({ identity, onRenewPuc }: PollutionWidgetProps) {
  const vehicles = (identity?.vehicles ?? []).slice(0, 3);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <CloudFog className="h-4 w-4 text-aurora-blue" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-slate-50">Pollution &amp; PUC</h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">Reference status from your own document records.</p>
      {vehicles.length ? (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-5 space-y-3">
          {vehicles.map((vehicle) => {
            const style = documentStatusStyle(vehicle.documentStatus.puc);
            const needsRenewal = style.tone === 'bad' || style.tone === 'warning';
            const dotColor = style.tone === 'good' ? 'bg-emerald-400' : style.tone === 'bad' ? 'bg-rose-400' : style.tone === 'warning' ? 'bg-amber-400' : 'bg-slate-500';
            return (
              <motion.div
                key={vehicle.vehicleId}
                variants={fadeUp}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3 transition-colors duration-200 hover:border-aurora-blue/30"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{vehicle.registrationNumber}</p>
                    <p className={`text-xs ${style.text}`}>PUC: {style.label}</p>
                  </div>
                </div>
                {needsRenewal ? (
                  <motion.button
                    {...scaleTap}
                    type="button"
                    onClick={onRenewPuc}
                    className="shrink-0 rounded-xl bg-aurora-blue px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-lift"
                  >
                    Renew PUC
                  </motion.button>
                ) : null}
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <p className="mt-5 text-sm text-slate-400">Link a vehicle to see its PUC status here.</p>
      )}
    </section>
  );
}
