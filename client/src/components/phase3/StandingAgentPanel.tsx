import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AgentMessage, ComplianceSnapshot } from '@parivahan/shared';
import { askStandingAgent, getComplianceSnapshot } from '../../lib/api';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';
import { useVoiceCapture } from '../../lib/useVoiceCapture';

interface StandingAgentPanelProps {
  userId: string;
  onIntentFromVoice: (text: string) => Promise<void>;
}

function sessionStorageKey(userId: string) {
  return `parivahan-track:agent-session:${userId}`;
}

function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = navigator.language || 'en-IN';
  window.speechSynthesis.speak(utterance);
}

export function StandingAgentPanel({ userId, onIntentFromVoice }: StandingAgentPanelProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [query, setQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [compliance, setCompliance] = useState<ComplianceSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Collapsed by default — this panel used to render fully expanded on every
  // authenticated page alongside two other "tell us what you need" surfaces
  // (the hero's journey-guide CTA and the floating voice assistant), which
  // read as three competing entry points doing the same job. Collapsing it
  // to a summary bar here, matching the floating assistant's own
  // collapsed-until-clicked pattern, doesn't touch its data or session logic
  // below — only whether the chat/aside grid is currently shown.
  const [isExpanded, setIsExpanded] = useState(false);
  // The agent's own conversational session — the server is the source of truth
  // for history once this exists; this is only the pointer to it.
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const voice = useVoiceCapture({
    onTranscript: (text) => {
      setQuery(text);
      void onIntentFromVoice(text);
    }
  });

  useEffect(() => {
    try {
      setSessionId(window.sessionStorage.getItem(sessionStorageKey(userId)) ?? undefined);
    } catch {
      setSessionId(undefined);
    }
    void getComplianceSnapshot(userId).then(setCompliance).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load compliance guidance.'));
  }, [userId]);

  async function send() {
    const text = query.trim();
    if (!text || isSending) return;
    const nextHistory = [...messages, { role: 'user' as const, content: text }];
    setMessages(nextHistory);
    setQuery('');
    setIsSending(true);
    setError(null);
    try {
      const reply = await askStandingAgent(userId, text, messages, sessionId);
      setSessionId(reply.sessionId);
      try {
        window.sessionStorage.setItem(sessionStorageKey(userId), reply.sessionId);
      } catch {
        // Session continuity is a convenience; a failed write isn't worth surfacing.
      }
      setMessages([...nextHistory, { role: 'assistant', content: reply.message }]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The Standing Agent could not respond.');
    } finally { setIsSending(false); }
  }

  return (
    <section aria-labelledby="standing-agent-title" className="overflow-hidden rounded-3xl border border-amber-500/30 bg-slate-900 shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-4 border-b border-slate-800 bg-amber-500/10 px-4 py-4 text-left sm:px-6 sm:py-5"
      >
        <div>
          <h2 id="standing-agent-title" className="text-lg font-semibold text-slate-50 sm:text-xl">Ask AI</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">Ask about a case, a document, or what to do next. It explains and drafts, but never submits, pays, or verifies anything on your behalf.</p>
        </div>
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-amber-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isExpanded ? (
        <>
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.45fr_0.85fr]">
            <div className="p-4 sm:p-6">
              <div aria-live="polite" className="min-h-40 space-y-3">
                {messages.length === 0 ? <p className="max-w-xl text-sm leading-6 text-slate-400">Ask about a case, document status, a safe next action, or how to raise an escalation.</p> : messages.map((message, index) => (
                  <motion.div key={`${message.role}-${index}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURATION.fast, ease: EASE_OUT }} className={message.role === 'user' ? 'ml-auto max-w-xl rounded-2xl bg-amber-400 px-4 py-3 text-sm text-slate-950' : 'flex max-w-xl items-start gap-2 rounded-2xl border border-slate-800 bg-slate-800 px-4 py-3 text-sm leading-6 text-slate-300'}>
                    {message.role === 'assistant' ? (
                      <>
                        <span className="min-w-0 flex-1">{message.content}</span>
                        <motion.button {...scaleTap} type="button" onClick={() => speak(message.content)} title="Read aloud" aria-label="Read this reply aloud" className="shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:border-amber-500/40">🔊</motion.button>
                      </>
                    ) : message.content}
                  </motion.div>
                ))}
                {isSending ? <p className="text-sm text-amber-300">Reviewing the available records…</p> : null}
              </div>
              <div className="mt-5 flex flex-col gap-2 border-t border-slate-800 pt-5 sm:flex-row">
                <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void send(); }} placeholder="Ask for guidance, or speak your question" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-amber-400" />
                <div className="flex gap-2">
                  <motion.button {...scaleTap} type="button" onClick={() => void voice.toggle()} aria-pressed={voice.isListening} className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium sm:flex-none ${voice.isListening ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-slate-700 text-slate-300 hover:border-amber-500/40'}`}>{voice.isListening ? 'Stop' : '🎙 Speak'}</motion.button>
                  <motion.button {...scaleTap} type="button" disabled={!query.trim() || isSending} onClick={() => void send()} className="flex-1 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-300 disabled:opacity-50 sm:flex-none">Send</motion.button>
                </div>
              </div>
            </div>
            <aside className="border-t border-slate-800 bg-slate-800 p-4 sm:p-6 lg:border-l lg:border-t-0">
              <h3 className="text-sm font-semibold text-slate-50">Safety record</h3>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-300">{compliance?.pointsLedger.activePoints ?? '—'} <span className="text-sm font-medium text-slate-400">illustrative points</span></p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{compliance?.pointsLedger.disclaimer ?? 'Loading your safety ledger…'}</p>
              <div className="mt-5 space-y-3 border-t border-slate-700 pt-5">
                {compliance?.scamSignals.map((signal) => <div key={signal.signalId}><p className="text-sm font-medium text-slate-300">{signal.title}</p><p className="mt-1 text-sm leading-5 text-slate-400">{signal.guidance}</p></div>)}
              </div>
            </aside>
          </div>
          <AnimatePresence>
            {error ? <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="alert" className="border-t border-rose-500/30 bg-rose-500/10 px-6 py-3 text-sm text-rose-300">{error}</motion.p> : null}
            {voice.error ? <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="alert" className="border-t border-rose-500/30 bg-rose-500/10 px-6 py-3 text-sm text-rose-300">{voice.error}</motion.p> : null}
          </AnimatePresence>
        </>
      ) : null}
    </section>
  );
}
