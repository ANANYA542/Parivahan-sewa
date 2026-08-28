import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { IntentResolution } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';
import { useVoiceCapture } from '../../lib/useVoiceCapture';

interface FloatingVoiceAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (query: string) => Promise<IntentResolution>;
}

/**
 * Always mounted at the app root (see App.tsx) — present on every route,
 * signed in or not, so voice access never depends on which page you happen
 * to be on. `onResolve` is the same handler the full Journey Guide uses, so
 * a match navigates straight into that service's journey.
 */
export function FloatingVoiceAssistant({ open, onOpenChange, onResolve }: FloatingVoiceAssistantProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<IntentResolution | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voice = useVoiceCapture({
    onTranscript: (text) => {
      setQuery(text);
      void submit(text);
    }
  });

  function reset() {
    setQuery('');
    setResult(null);
    setError(null);
  }

  function close() {
    onOpenChange(false);
    reset();
  }

  async function submit(nextQuery = query) {
    const trimmed = nextQuery.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setIsResolving(true);
    setError(null);
    try {
      const intent = await onResolve(trimmed);
      setResult(intent);
      if (intent.serviceId) {
        // onResolve already navigated to the matched journey — let the
        // match flash briefly, then close so it doesn't sit on top of it.
        setTimeout(() => {
          onOpenChange(false);
          reset();
        }, 900);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to understand that request.');
    } finally {
      setIsResolving(false);
    }
  }

  return (
    <>
      {/* A dimming scrim behind the opened popup — this is what a fixed
          bottom-right panel needs when it can grow tall enough to reach over
          page content above it (e.g. a dashboard CTA): the background reads
          as temporarily inert rather than silently covered. Only exists
          while open, so it never affects the collapsed button at rest. */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast, ease: EASE_OUT }}
            className="fixed inset-0 z-30 bg-slate-950/40"
            onClick={close}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              role="dialog"
              aria-label="Voice assistant"
              className="w-[19rem] rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:w-[22rem]"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-50">Ask AI, or speak</p>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close voice assistant"
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-400">Say what you need — "renew my PUC," "I was in an accident" — or type it.</p>
              <div className="mt-3 flex gap-2">
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void submit();
                  }}
                  placeholder="Speak or type your need"
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => void voice.toggle()}
                  aria-pressed={voice.isListening}
                  aria-label="Speak instead of typing"
                  className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-medium transition-colors duration-150 ${voice.isListening ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-slate-700 text-slate-300 hover:border-amber-500/40'}`}
                >
                  {voice.isListening ? 'Stop' : voice.isTranscribing ? '…' : '🎙'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={isResolving || !query.trim()}
                className="mt-2 w-full rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResolving ? 'Finding...' : 'Continue'}
              </button>
              {voice.isTranscribing ? <p className="mt-2 text-xs text-amber-300">Transcribing what you said…</p> : null}
              {result ? (
                <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  {result.clarificationNeeded ? 'I need a little more detail — try mentioning PUC, challan, or accident.' : `Matched: ${result.serviceName}. Taking you to that journey...`}
                </div>
              ) : null}
              {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
              {voice.error ? <p className="mt-3 text-sm text-rose-400">{voice.error}</p> : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <motion.button
          {...scaleTap}
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-label={open ? 'Close voice assistant' : 'Open voice assistant'}
          aria-expanded={open}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-2xl text-slate-950 shadow-xl shadow-slate-950/50 ring-4 ring-slate-950/70 transition-colors duration-150 hover:bg-amber-300"
        >
          {open ? '✕' : '🎙'}
        </motion.button>
      </div>
    </>
  );
}
