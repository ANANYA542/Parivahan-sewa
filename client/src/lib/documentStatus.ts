/**
 * Single source of truth for how a vehicle document-status value looks —
 * reused across My Vahan, the Vehicle Health and Pollution Tracker views —
 * so "expired" reads urgent everywhere and "active" reads calm everywhere,
 * rather than each view inventing its own color rules.
 */
export interface DocumentStatusStyle {
  label: string;
  text: string;
  badge: string;
  tone: 'good' | 'warning' | 'bad' | 'neutral';
}

const KNOWN_STATUSES: Record<string, DocumentStatusStyle> = {
  active: { label: 'Active', text: 'text-emerald-300', badge: 'bg-emerald-500/10 text-emerald-300', tone: 'good' },
  expired: { label: 'Expired', text: 'text-rose-300', badge: 'bg-rose-500/10 text-rose-300', tone: 'bad' },
  'expiring-soon': { label: 'Expiring soon', text: 'text-amber-300', badge: 'bg-amber-500/10 text-amber-300', tone: 'warning' },
  'due-soon': { label: 'Due soon', text: 'text-amber-300', badge: 'bg-amber-500/10 text-amber-300', tone: 'warning' },
  'renewal-due': { label: 'Renewal due', text: 'text-amber-300', badge: 'bg-amber-500/10 text-amber-300', tone: 'warning' },
  'not-applicable': { label: 'Not applicable', text: 'text-slate-500', badge: 'bg-slate-800 text-slate-500', tone: 'neutral' }
};

const FALLBACK: DocumentStatusStyle = { label: 'Not available', text: 'text-slate-500', badge: 'bg-slate-800 text-slate-500', tone: 'neutral' };

export function documentStatusStyle(value: string | undefined): DocumentStatusStyle {
  if (!value) return FALLBACK;
  return KNOWN_STATUSES[value] ?? { ...FALLBACK, label: value };
}
