import { motion } from 'framer-motion';
import type { IdentityBundle, VehicleRecord } from '@parivahan/shared';
import { fadeUp, staggerContainer } from '../../lib/motion';

interface MyVahanDashboardProps {
  identity: IdentityBundle | null;
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function VehicleCard({ vehicle }: { vehicle: VehicleRecord }) {
  const cards = Object.entries(vehicle.documentStatus).map(([label, value]) => ({ label: formatLabel(label), value: value ?? 'Not available' }));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-50">{vehicle.registrationNumber}</p>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-300">{vehicle.vehicleType.replace(/-/g, ' ')}</span>
      </div>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cards.map((card) => (
          <motion.div key={card.label} variants={fadeUp} className="rounded-xl border border-slate-800 bg-slate-800 p-3">
            <div className="font-mono text-[10px] tracking-[0.13em] text-slate-400">{card.label}</div>
            <div className={`mt-1 text-sm font-medium ${card.value === 'expired' ? 'text-rose-300' : 'text-slate-50'}`}>{card.value}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export function MyVahanDashboard({ identity }: MyVahanDashboardProps) {
  const vehicles = identity?.vehicles ?? [];

  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-sm md:p-7">
      <p className="font-mono text-[10px] tracking-[0.16em] text-slate-400">YOUR VEHICLES</p>
      <h2 className="font-display mt-2 text-3xl text-slate-50">My Vahan</h2>
      <p className="mt-2 text-sm text-slate-400">
        {vehicles.length ? `${vehicles.length} linked vehicle${vehicles.length === 1 ? '' : 's'}` : identity ? 'No linked vehicles found.' : 'Loading your linked vehicle records...'}
      </p>
      {vehicles.length ? (
        <div className="mt-6 space-y-4">
          {vehicles.map((vehicle) => <VehicleCard key={vehicle.vehicleId} vehicle={vehicle} />)}
        </div>
      ) : null}
    </section>
  );
}
