import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { IntentResolution } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';

const suggestions = ['Renew my PUC', 'Renew my driving licence', 'Transfer vehicle ownership', 'Check a challan'];

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
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-500 focus:border-amber-300"
          />
          <motion.button
            {...scaleTap}
            type="button"
            onClick={() => void submitIntent()}
            disabled={isResolving || !query.trim()}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isResolving ? 'finding' : 'continue'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: DURATION.fast }}
                className="inline-block"
              >
                {isResolving ? 'Finding...' : 'Continue'}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((item) => (
            <motion.button {...scaleTap} key={item} type="button" onClick={() => void submitIntent(item)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200 transition-colors duration-200 hover:border-amber-300/70">
              {item}
            </motion.button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {result ? (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
            className="mt-4 overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-100"
          >
            {result.clarificationNeeded ? 'I need a little more detail. Try mentioning PUC, challan, or accident.' : `Matched: ${result.serviceName} (${result.confidence} confidence). The journey is ready below.`}
          </motion.div>
        ) : null}
        {error ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 text-sm text-rose-300">
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
