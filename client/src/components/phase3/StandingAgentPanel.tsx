import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AgentMessage, ComplianceSnapshot } from '@parivahan/shared';
import { askStandingAgent, getComplianceSnapshot, transcribeVoice } from '../../lib/api';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';

interface StandingAgentPanelProps {
  userId: string;
  onIntentFromVoice: (text: string) => Promise<void>;
}

function toBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Unable to prepare the audio recording.'));
    reader.readAsDataURL(file);
  });
}

export function StandingAgentPanel({ userId, onIntentFromVoice }: StandingAgentPanelProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [query, setQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [compliance, setCompliance] = useState<ComplianceSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    void getComplianceSnapshot(userId).then(setCompliance).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load compliance guidance.'));
    return () => recorder.current?.stop();
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
      const reply = await askStandingAgent(userId, text, messages);
      setMessages([...nextHistory, { role: 'assistant', content: reply.message }]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The Standing Agent could not respond.');
    } finally { setIsSending(false); }
  }

  async function toggleVoice() {
    if (isListening && recorder.current) { recorder.current.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError('Voice input is not supported in this browser.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const next = new MediaRecorder(stream);
      recorder.current = next;
      next.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      next.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsListening(false);
        void (async () => {
          try {
            const audio = new Blob(chunks, { type: next.mimeType || 'audio/webm' });
            const transcript = await transcribeVoice(await toBase64(audio), audio.type || 'audio/webm');
            setQuery(transcript.text);
            await onIntentFromVoice(transcript.text);
          } catch (reason) { setError(reason instanceof Error ? reason.message : 'Voice transcription could not be completed.'); }
        })();
      };
      next.start(); setIsListening(true); setError(null);
    } catch { setError('Microphone access was not granted. You can still type your request.'); }
  }

  return (
    <section aria-labelledby="standing-agent-title" className="overflow-hidden rounded-3xl border border-amber-400/20 bg-slate-900/80">
      <div className="border-b border-white/10 bg-amber-400/[0.04] px-6 py-5">
        <h2 id="standing-agent-title" className="text-xl font-semibold text-white">Standing Agent</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">Decision support over your existing cases and vehicle records. It can draft and explain, but never submits, pays, or verifies against an official registry.</p>
      </div>
      <div className="grid gap-0 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="p-6">
          <div aria-live="polite" className="min-h-40 space-y-3">
            {messages.length === 0 ? <p className="max-w-xl text-sm leading-6 text-slate-400">Ask about a case, document status, NOC readiness, a safe next action, or how to prepare an escalation.</p> : messages.map((message, index) => (
              <motion.div key={`${message.role}-${index}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURATION.fast, ease: EASE_OUT }} className={message.role === 'user' ? 'ml-auto max-w-xl rounded-2xl bg-amber-400 px-4 py-3 text-sm text-black' : 'max-w-xl rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-200'}>{message.content}</motion.div>
            ))}
            {isSending ? <p className="text-sm text-amber-200">Reviewing the available records…</p> : null}
          </div>
          <div className="mt-5 flex gap-2 border-t border-white/10 pt-5">
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void send(); }} placeholder="Ask for guidance on your mobility record" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300" />
            <motion.button {...scaleTap} type="button" onClick={() => void toggleVoice()} aria-pressed={isListening} className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:border-amber-300">{isListening ? 'Stop voice' : 'Use voice'}</motion.button>
            <motion.button {...scaleTap} type="button" disabled={!query.trim() || isSending} onClick={() => void send()} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Send</motion.button>
          </div>
        </div>
        <aside className="border-t border-white/10 bg-slate-950/30 p-6 lg:border-l lg:border-t-0">
          <h3 className="text-sm font-semibold text-white">Compliance watch</h3>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-200">{compliance?.pointsLedger.activePoints ?? '—'} <span className="text-sm font-medium text-slate-400">illustrative points</span></p>
          <p className="mt-3 text-sm leading-6 text-slate-400">{compliance?.pointsLedger.disclaimer ?? 'Loading your safety ledger…'}</p>
          <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
            {compliance?.scamSignals.map((signal) => <div key={signal.signalId}><p className="text-sm font-medium text-slate-200">{signal.title}</p><p className="mt-1 text-sm leading-5 text-slate-400">{signal.guidance}</p></div>)}
          </div>
        </aside>
      </div>
      <AnimatePresence>{error ? <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="alert" className="border-t border-rose-400/20 bg-rose-400/10 px-6 py-3 text-sm text-rose-200">{error}</motion.p> : null}</AnimatePresence>
    </section>
  );
}
