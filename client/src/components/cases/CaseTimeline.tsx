import { AnimatePresence, motion } from 'framer-motion';
import type { CaseDetail, CaseRecord } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';

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
          <motion.button
            {...scaleTap}
            key={caseRecord.caseId}
            type="button"
            onClick={() => onSelect(caseRecord.caseId)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors duration-200 ${selectedCase?.caseId === caseRecord.caseId ? 'border-amber-300/60 bg-amber-400/10 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25'}`}
          >
            <span>{caseRecord.caseId} · {caseRecord.type}</span>
            <span className="capitalize text-slate-400">{caseRecord.status.replace('_', ' ')}</span>
          </motion.button>
        ))}
        {!cases.length ? <p className="text-sm text-slate-400">No cases have been submitted yet.</p> : null}
      </div>
      {isLoadingDetail ? <p className="mt-5 text-sm text-slate-400">Loading case history...</p> : null}
      <AnimatePresence mode="wait">
        {selectedCase ? (
          <motion.div
            key={selectedCase.caseId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium text-white">{selectedCase.service.name}</p>
                <p className="mt-1 text-xs text-slate-400">SLA: {selectedCase.slaDeadline ? displayDate(selectedCase.slaDeadline) : 'Not assigned'}</p>
              </div>
              <span className="text-sm capitalize text-amber-200">{selectedCase.stage.replace('_', ' ')}</span>
            </div>
            <div className="mt-4 space-y-3 border-l border-amber-300/30 pl-4">
              {selectedCase.stageHistory.map((entry, index) => (
                <motion.div
                  key={`${entry.stage}-${entry.at}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: DURATION.base, ease: EASE_OUT, delay: index * 0.07 }}
                >
                  <p className="text-sm text-slate-200">{entry.note}</p>
                  <p className="mt-1 text-xs text-slate-500">{displayDate(entry.at)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
