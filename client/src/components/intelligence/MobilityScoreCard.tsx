import type { MobilityScoreResult } from '@parivahan/shared';

interface MobilityScoreCardProps {
  result: MobilityScoreResult | null;
}

export function MobilityScoreCard({ result }: MobilityScoreCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-400/20 to-white/5 p-6">
      <h2 className="text-xl font-semibold text-white">Mobility Health Score</h2>
      <div className="mt-6 flex items-end gap-4">
        <div className="text-6xl font-semibold text-amber-300">{result?.score ?? '--'}</div>
        <div className="pb-2 text-sm text-slate-300">/ 100</div>
      </div>
      <p className="mt-4 max-w-md text-sm leading-6 text-slate-200">{result ? result.reasons.join(' · ') : 'Calculating from your linked vehicle and case records.'}</p>
    </section>
  );
}
