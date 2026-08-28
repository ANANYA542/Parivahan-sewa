import { motion } from 'framer-motion';
import { ESCALATION_NOTE } from '@parivahan/shared';
import type { CaseDetail, CaseRecord, CaseStatus } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';

const CLOSED_CASE_STATUSES = new Set(['resolved', 'rejected']);

const STATUS_BADGE: Record<CaseStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600' },
  submitted: { label: 'Submitted', className: 'bg-orange-50 text-orange-700' },
  in_progress: { label: 'Pending', className: 'bg-orange-50 text-orange-700' },
  waiting_for_user: { label: 'Action needed', className: 'bg-rose-50 text-rose-600' },
  resolved: { label: 'Approved', className: 'bg-green-50 text-green-700' },
  rejected: { label: 'Rejected', className: 'bg-rose-50 text-rose-600' }
};

function StatusBadge({ status }: { status: CaseStatus }) {
  const badge = STATUS_BADGE[status] ?? { label: status.replace('_', ' '), className: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${badge.className}`}>{badge.label}</span>;
}

interface CaseTimelineProps {
  cases: CaseRecord[];
  selectedCase: CaseDetail | null;
  isLoadingDetail: boolean;
  isEscalating: boolean;
  isDownloading: boolean;
  actionError: string | null;
  onSelect: (caseId: string) => void;
  onEscalate: (caseId: string) => void;
  onDownload: (caseId: string) => void;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function slaCountdown(deadline: string): { label: string; tone: 'orange' | 'rose' | 'green' } {
  const remainingMs = new Date(deadline).getTime() - Date.now();
  const remainingHours = remainingMs / (60 * 60 * 1000);
  if (remainingMs < 0) {
    const overdueDays = Math.ceil(Math.abs(remainingHours) / 24);
    return { label: `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`, tone: 'rose' };
  }
  if (remainingHours < 24) {
    return { label: `${Math.max(1, Math.round(remainingHours))} hour${Math.round(remainingHours) === 1 ? '' : 's'} left`, tone: 'rose' };
  }
  const remainingDays = Math.ceil(remainingHours / 24);
  return { label: `${remainingDays} day${remainingDays === 1 ? '' : 's'} left`, tone: remainingDays <= 1 ? 'orange' : 'green' };
}

const countdownTone: Record<'orange' | 'rose' | 'green', string> = {
  orange: 'bg-orange-50 text-orange-700',
  rose: 'bg-rose-50 text-rose-600',
  green: 'bg-green-50 text-green-700'
};

export function CaseTimeline({ cases, selectedCase, isLoadingDetail, isEscalating, isDownloading, actionError, onSelect, onEscalate, onDownload }: CaseTimelineProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">My Cases</h2>
      <p className="mt-2 text-sm text-slate-500">See where each submission stands, its deadline, and what happened so far.</p>
      <div className="mt-5 space-y-2">
        {cases.map((caseRecord) => (
          <motion.button
            {...scaleTap}
            key={caseRecord.caseId}
            type="button"
            onClick={() => onSelect(caseRecord.caseId)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors duration-200 ${selectedCase?.caseId === caseRecord.caseId ? 'border-orange-300 bg-orange-50 text-slate-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
          >
            <span>{caseRecord.caseId} · {caseRecord.type}</span>
            <StatusBadge status={caseRecord.status} />
          </motion.button>
        ))}
        {!cases.length ? <p className="text-sm text-slate-500">No cases have been submitted yet.</p> : null}
      </div>
      {isLoadingDetail ? <p className="mt-5 text-sm text-slate-500">Loading case history...</p> : null}
      {/* Plain conditional rendering, not AnimatePresence mode="wait" — same
          stuck-exit-animation bug confirmed elsewhere (see App.tsx /
          GuidedNavigator.tsx): under real click timing the exit animation can
          stall, permanently hiding "Mark as urgent" / "Download my copy" for
          the newly selected case. Reliability over the cross-fade here. */}
        {selectedCase ? (
          <motion.div
            key={selectedCase.caseId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{selectedCase.service.name}</p>
                <p className="mt-1 text-xs text-slate-500">Due by: {selectedCase.slaDeadline ? displayDate(selectedCase.slaDeadline) : 'Not assigned yet'}</p>
                {selectedCase.slaDeadline && !CLOSED_CASE_STATUSES.has(selectedCase.status) ? (
                  <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${countdownTone[slaCountdown(selectedCase.slaDeadline).tone]}`}>
                    {slaCountdown(selectedCase.slaDeadline).label}
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge status={selectedCase.status} />
                <span className="text-xs capitalize text-slate-500">{selectedCase.stage.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(() => {
                const isAlreadyEscalated = selectedCase.stageHistory.some((entry) => entry.note === ESCALATION_NOTE);
                const isClosed = CLOSED_CASE_STATUSES.has(selectedCase.status);
                return (
                  <motion.button
                    {...scaleTap}
                    type="button"
                    disabled={isEscalating || isClosed || isAlreadyEscalated}
                    onClick={() => onEscalate(selectedCase.caseId)}
                    title={isClosed ? 'This case is already closed and cannot be escalated.' : isAlreadyEscalated ? 'This case has already been marked urgent.' : undefined}
                    className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 transition-opacity duration-200 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isEscalating ? 'Marking urgent…' : isAlreadyEscalated ? 'Already marked urgent' : 'Mark as urgent'}
                  </motion.button>
                );
              })()}
              <motion.button
                {...scaleTap}
                type="button"
                disabled={isDownloading}
                onClick={() => onDownload(selectedCase.caseId)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors duration-200 hover:border-slate-400 disabled:opacity-40"
              >
                {isDownloading ? 'Preparing your copy…' : 'Download my copy'}
              </motion.button>
            </div>
            {actionError ? <p className="mt-2 text-xs text-rose-600">{actionError}</p> : null}
            <div className="mt-4 space-y-3 border-l border-orange-200 pl-4">
              {selectedCase.stageHistory.map((entry, index) => (
                <motion.div
                  key={`${entry.stage}-${entry.at}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: DURATION.base, ease: EASE_OUT, delay: index * 0.07 }}
                >
                  <p className="text-sm text-slate-700">{entry.note}</p>
                  <p className="mt-1 text-xs text-slate-500">{displayDate(entry.at)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : null}
    </section>
  );
}
