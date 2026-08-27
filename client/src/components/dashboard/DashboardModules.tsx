import { motion } from 'framer-motion';
import type { AppNotification, CaseRecord, IdentityBundle, MobilityIntelligenceSnapshot } from '@parivahan/shared';
import { scaleTap, staggerContainer, fadeUp } from '../../lib/motion';
import type { AppRoute } from '../../lib/appRoutes';
import { navigateTo } from '../../lib/appRoutes';

interface DashboardModulesProps {
  identity: IdentityBundle | null;
  snapshot: MobilityIntelligenceSnapshot | null;
  notifications: AppNotification[];
  cases: CaseRecord[];
}

const moduleRoutes: Array<{ route: AppRoute; label: string; detail: string }> = [
  { route: 'dashboard', label: 'Vehicle Health Score', detail: 'Read the current condition and compliance posture of the linked vehicle.' },
  { route: 'map', label: 'Pollution Tracker', detail: 'See pollution hotspots and the air-quality context around your route.' },
  { route: 'services', label: 'Fuel Consumption', detail: 'Understand the operating cost and service triggers around fuel usage.' },
  { route: 'cases', label: 'Active Cases', detail: 'Review every open workflow, stage, and deadline in one place.' },
  { route: 'alerts', label: 'Alerts / Notifications', detail: 'Act on reminders and time-sensitive service nudges.' }
];

function scoreLabel(score?: number) {
  if (score === undefined) return '—';
  return `${score}`;
}

export function DashboardModules({ identity, snapshot, notifications, cases }: DashboardModulesProps) {
  const vehicle = identity?.vehicles[0];
  const score = snapshot?.score.score ?? (vehicle ? Math.max(58, 96 - Object.values(vehicle.documentStatus).filter((value) => value === 'expired' || value === 'missing').length * 12) : undefined);
  const activeCases = cases.filter((caseRecord) => !['resolved', 'rejected'].includes(caseRecord.status));
  const unread = notifications.filter((item) => !item.read);
  const pollutionCount = snapshot?.mapLayers.find((layer) => layer.layerId === 'pollution-hotspots')?.features.length ?? 0;
  const fuelEstimate = vehicle ? Math.max(18, 64 - Object.entries(vehicle.documentStatus).filter(([, value]) => value === 'expired').length * 7) : 0;

  const cards = [
    {
      label: 'Vehicle Health Score',
      value: scoreLabel(score),
      meta: vehicle ? vehicle.registrationNumber : 'No linked vehicle',
      tone: 'amber'
    },
    {
      label: 'Pollution Tracker',
      value: `${pollutionCount}`,
      meta: 'hotspots',
      tone: 'green'
    },
    {
      label: 'Fuel Consumption',
      value: `${fuelEstimate}%`,
      meta: 'efficiency estimate',
      tone: 'amber'
    },
    {
      label: 'Active Cases',
      value: `${activeCases.length}`,
      meta: `${activeCases.length === 1 ? 'case' : 'cases'} in motion`,
      tone: 'amber'
    },
    {
      label: 'Alerts / Notifications',
      value: `${unread.length}`,
      meta: `${notifications.length} total`,
      tone: 'green'
    }
  ] as const;

  return (
    <section className="rounded-[2rem] border border-slate-900/10 bg-white p-6 text-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Unified dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Your vehicle, cases, and alerts in one state model.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Each module is a doorway into the corresponding system state. Nothing is decorative: health reflects the vehicle record, pollution reflects the map snapshot, and alerts reflect active cases and notifications.</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
          {identity?.user.name ?? 'Citizen'} · {vehicle?.registrationNumber ?? 'No vehicle linked'}
        </div>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <motion.button
            key={card.label}
            variants={fadeUp}
            {...scaleTap}
            type="button"
            onClick={() => {
              if (card.label === 'Vehicle Health Score') navigateTo('health');
              if (card.label === 'Pollution Tracker') navigateTo('pollution');
              if (card.label === 'Fuel Consumption') navigateTo('fuel');
              if (card.label === 'Active Cases') navigateTo('cases');
              if (card.label === 'Alerts / Notifications') navigateTo('alerts');
            }}
            className="group rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 text-left transition-colors duration-200 hover:border-slate-400 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</div>
                <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{card.value}</div>
              </div>
              <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${card.tone === 'amber' ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-900'}`}>
                Detail
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.meta}</p>
            <div className="mt-4 h-1 rounded-full bg-slate-200">
              <div className={`h-1 rounded-full ${card.tone === 'amber' ? 'bg-amber-400' : 'bg-green-500'}`} style={{ width: `${Math.min(100, Number(card.value.replace(/[^0-9]/g, '') || '0') * 2)}%` }} />
            </div>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}
