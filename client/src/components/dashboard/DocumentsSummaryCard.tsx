import { motion } from 'framer-motion';
import { FileText, FolderOpen } from 'lucide-react';
import type { CaseRecord, ServiceDefinition } from '@parivahan/shared';
import { caseReference } from '../../lib/caseReference';
import { fadeUp, scaleTap, staggerContainer } from '../../lib/motion';

interface DocumentsSummaryCardProps {
  cases: CaseRecord[];
  services: ServiceDefinition[];
  onViewAll: () => void;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));
}

/**
 * The dashboard used to embed the full My Documents grid (every completed
 * case, each with its own rendered PDF-preview thumbnail) directly inline —
 * expensive to render repeatedly and pushed everything below it down the
 * page. This is the dashboard's own compact summary; the full grid now lives
 * on its own /documents page, one click away via "View all documents".
 */
export function DocumentsSummaryCard({ cases, services, onViewAll }: DocumentsSummaryCardProps) {
  const documents = cases
    .filter((caseRecord) => caseRecord.status !== 'draft')
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recent = documents.slice(0, 3);

  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-sm md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-slate-400">YOUR RECORDS</p>
          <h2 className="font-display mt-2 text-3xl text-slate-50">My Documents</h2>
          <p className="mt-2 text-sm text-slate-400">Every service you've completed, with your generated copy ready to preview or download again.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-aurora-blue/30 bg-aurora-blue/10 px-4 py-3">
          <FileText className="h-5 w-5 text-cyan-300" aria-hidden="true" />
          <div>
            <p className="text-2xl font-semibold leading-none text-cyan-300">{documents.length}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">completed</p>
          </div>
        </div>
      </div>

      {recent.length ? (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-6 space-y-2">
          {recent.map((caseRecord) => {
            const service = services.find((item) => item.serviceId === caseRecord.serviceId);
            return (
              <motion.button
                key={caseRecord.caseId}
                variants={fadeUp}
                {...scaleTap}
                type="button"
                onClick={onViewAll}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3 text-left transition-colors duration-200 hover:border-aurora-blue/30"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-200">{service?.name ?? caseRecord.serviceId}</span>
                  <span className="block text-xs text-slate-500">Completed {displayDate(caseRecord.createdAt)} · {caseReference(caseRecord.caseId)}</span>
                </span>
                <FileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              </motion.button>
            );
          })}
        </motion.div>
      ) : (
        <p className="mt-6 text-sm text-slate-400">Complete a guided service to see your copy appear here.</p>
      )}

      <motion.button
        {...scaleTap}
        type="button"
        onClick={onViewAll}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors duration-200 hover:border-aurora-blue/40 hover:bg-slate-800"
      >
        <FolderOpen className="h-4 w-4" aria-hidden="true" />
        View all documents
      </motion.button>
    </section>
  );
}
