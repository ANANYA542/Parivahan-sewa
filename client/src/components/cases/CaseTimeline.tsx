import type { CaseDetail, CaseRecord } from '@parivahan/shared';

interface CaseTimelineProps {
  cases: CaseRecord[];
  selectedCase: CaseDetail | null;
  isLoadingDetail: boolean;
  onSelect: (caseId: string) => void;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function CaseTimeline({ cases, selectedCase, isLoadingDetail, onSelect }: CaseTimelineProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <h2 className="text-xl font-semibold text-white">Case Tracking</h2>
      <p className="mt-2 text-sm text-slate-400">Review the current stage, history, and SLA for every submitted case.</p>
      <div className="mt-5 space-y-2">
        {cases.map((caseRecord) => (
          <button key={caseRecord.caseId} type="button" onClick={() => onSelect(caseRecord.caseId)} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${selectedCase?.caseId === caseRecord.caseId ? 'border-amber-300/60 bg-amber-400/10 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25'}`}>
            <span>{caseRecord.caseId} · {caseRecord.type}</span>
            <span className="capitalize text-slate-400">{caseRecord.status.replace('_', ' ')}</span>
          </button>
        ))}
        {!cases.length ? <p className="text-sm text-slate-400">No cases have been submitted yet.</p> : null}
      </div>
      {isLoadingDetail ? <p className="mt-5 text-sm text-slate-400">Loading case history...</p> : null}
      {selectedCase ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-medium text-white">{selectedCase.service.name}</p>
              <p className="mt-1 text-xs text-slate-400">SLA: {selectedCase.slaDeadline ? displayDate(selectedCase.slaDeadline) : 'Not assigned'}</p>
            </div>
            <span className="text-sm capitalize text-amber-200">{selectedCase.stage.replace('_', ' ')}</span>
          </div>
          <div className="mt-4 space-y-3 border-l border-amber-300/30 pl-4">
            {selectedCase.stageHistory.map((entry) => (
              <div key={`${entry.stage}-${entry.at}`}>
                <p className="text-sm text-slate-200">{entry.note}</p>
                <p className="mt-1 text-xs text-slate-500">{displayDate(entry.at)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
