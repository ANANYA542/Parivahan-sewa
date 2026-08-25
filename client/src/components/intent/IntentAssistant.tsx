import { useState } from 'react';
import type { IntentResolution } from '@parivahan/shared';

const suggestions = ['Renew my PUC', 'Dispute a challan', 'Report an accident'];

interface IntentAssistantProps {
  onResolve: (query: string) => Promise<IntentResolution>;
}

export function IntentAssistant({ onResolve }: IntentAssistantProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<IntentResolution | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitIntent(nextQuery = query) {
    const trimmedQuery = nextQuery.trim();
    if (!trimmedQuery) return;

    setQuery(trimmedQuery);
    setIsResolving(true);
    setError(null);
    try {
      setResult(await onResolve(trimmedQuery));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to understand that request.');
    } finally {
      setIsResolving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <h2 className="text-xl font-semibold text-white">Intent Assistant</h2>
      <p className="mt-2 text-sm text-slate-400">Describe the situation and we will select the right service journey.</p>
      <div className="mt-5 rounded-2xl border border-dashed border-amber-400/30 bg-amber-400/5 p-4">
        <label className="text-sm text-amber-200" htmlFor="intent-query">What do you need help with?</label>
        <div className="mt-3 flex gap-2">
          <input
            id="intent-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void submitIntent();
            }}
            placeholder="For example, my PUC has expired"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300"
          />
          <button
            type="button"
            onClick={() => void submitIntent()}
            disabled={isResolving || !query.trim()}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResolving ? 'Finding...' : 'Continue'}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((item) => (
            <button key={item} type="button" onClick={() => void submitIntent(item)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200 transition hover:border-amber-300/70">
              {item}
            </button>
          ))}
        </div>
      </div>
      {result ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-100">
          {result.clarificationNeeded ? 'I need a little more detail. Try mentioning PUC, challan, or accident.' : `Matched: ${result.serviceName} (${result.confidence} confidence). The journey is ready below.`}
        </div>
      ) : null}
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
    </section>
  );
}
