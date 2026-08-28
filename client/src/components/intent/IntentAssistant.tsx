import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { IntentResolution } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';
import { useVoiceCapture } from '../../lib/useVoiceCapture';

const suggestions = ['Renew my PUC', 'Renew my driving licence', 'Transfer vehicle ownership', 'Check a challan'];

interface IntentAssistantProps {
  onResolve: (query: string) => Promise<IntentResolution>;
}

export function IntentAssistant({ onResolve }: IntentAssistantProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<IntentResolution | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voice = useVoiceCapture({
    onTranscript: (text) => {
      setQuery(text);
      void submitIntent(text);
    }
  });

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
    <section id="journey-guide" className="scroll-mt-5 rounded-[2rem] border border-orange-200 bg-white p-6 shadow-sm md:p-7">
      <p className="font-mono text-[10px] tracking-[0.16em] text-orange-600">JOURNEY GUIDE</p>
      <h2 className="font-display mt-2 text-3xl text-slate-900">Tell us what brought you here.</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">Use ordinary language. The guide maps your situation to the right service journey.</p>
      <div className="mt-5 rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-4">
        <label className="text-sm font-medium text-orange-800" htmlFor="intent-query">What do you need help with?</label>
        <div className="mt-3 flex gap-2">
          <input
            id="intent-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void submitIntent();
            }}
            placeholder="For example, my PUC has expired"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-orange-400"
          />
          <motion.button
            {...scaleTap}
            type="button"
            onClick={() => void voice.toggle()}
            aria-pressed={voice.isListening}
            title="Speak your question instead of typing"
            aria-label="Speak your question instead of typing"
            className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-medium transition-colors duration-150 ${voice.isListening ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-300 text-slate-600 hover:border-orange-300'}`}
          >
            {voice.isListening ? 'Stop' : voice.isTranscribing ? '…' : '🎙'}
          </motion.button>
          {/* Plain text here, not AnimatePresence mode="wait", for the same
              reason as the App.tsx / GuidedNavigator.tsx fixes — this label
              swap doesn't need an animation that risks getting stuck and
              leaving the button looking empty. */}
          <motion.button
            {...scaleTap}
            type="button"
            onClick={() => void submitIntent()}
            disabled={isResolving || !query.trim()}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResolving ? 'Finding...' : 'Continue'}
          </motion.button>
        </div>
        {voice.isTranscribing ? <p className="mt-1.5 text-xs text-orange-600">Transcribing what you said…</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((item) => (
            <motion.button {...scaleTap} key={item} type="button" onClick={() => void submitIntent(item)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 transition-colors duration-200 hover:border-orange-300">
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
            className="mt-4 overflow-hidden rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {result.clarificationNeeded ? 'I need a little more detail. Try mentioning PUC, challan, or accident.' : `Matched: ${result.serviceName} (${result.confidence} confidence). The journey is ready below.`}
          </motion.div>
        ) : null}
        {error ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 text-sm text-rose-600">
            {error}
          </motion.p>
        ) : null}
        {voice.error ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 text-sm text-rose-600">
            {voice.error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
