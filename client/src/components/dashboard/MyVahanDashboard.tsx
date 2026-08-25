import type { IdentityBundle } from '@parivahan/shared';

interface MyVahanDashboardProps {
  identity: IdentityBundle | null;
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

export function MyVahanDashboard({ identity }: MyVahanDashboardProps) {
  const vehicle = identity?.vehicles[0];
  const cards = vehicle
    ? Object.entries(vehicle.documentStatus).map(([label, value]) => ({ label: formatLabel(label), value: value ?? 'Not available' }))
    : [];

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <h2 className="text-xl font-semibold text-white">My Vahan</h2>
      <p className="mt-2 text-sm text-slate-400">
        {vehicle ? `${vehicle.registrationNumber} · ${vehicle.vehicleType.replace('-', ' ')}` : 'Loading your linked vehicle records...'}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{card.label}</div>
            <div className={`mt-2 text-lg font-medium ${card.value === 'expired' ? 'text-rose-300' : 'text-white'}`}>{card.value}</div>
          </div>
        ))}
        {identity && !vehicle ? <p className="text-sm text-slate-400">No linked vehicles found.</p> : null}
      </div>
    </section>
  );
}
