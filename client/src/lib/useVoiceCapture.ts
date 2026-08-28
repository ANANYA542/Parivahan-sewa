import { useRef, useState } from 'react';

// Web Speech API isn't in the standard TS lib yet — minimal shape for what we use.
interface SpeechRecognitionResultLike {
  transcript: string;
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | undefined {
  const anyWindow = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return anyWindow.SpeechRecognition ?? anyWindow.webkitSpeechRecognition;
}

interface UseVoiceCaptureOptions {
  onTranscript: (text: string) => void;
  /** BCP-47 language tag, e.g. 'hi-IN' or 'en-IN'. Defaults to the browser's own language. */
  language?: string;
}

/**
 * Voice capture on the browser's native Web Speech API — free, no API key,
 * no rate limit, works offline of any of our own servers. Chosen over
 * Groq/OpenAI Whisper and India-specific options (Sarvam, Bhashini) for the
 * live demo specifically because it has zero external dependency: nothing
 * to key-manage, nothing that can be down when a judge tries it. Support is
 * strongest in Chrome/Edge; Safari support is present but weaker.
 */
export function useVoiceCapture({ onTranscript, language }: UseVoiceCaptureOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  function toggle() {
    if (isListening && recognition.current) {
      recognition.current.stop();
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError('Voice input is not supported in this browser — try Chrome or Edge, or type your answer.');
      return;
    }

    const instance = new Ctor();
    instance.lang = language ?? (navigator.language || 'en-IN');
    instance.continuous = false;
    instance.interimResults = false;
    recognition.current = instance;

    instance.onresult = (event) => {
      setIsTranscribing(true);
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (transcript) onTranscript(transcript);
      setIsTranscribing(false);
    };
    instance.onerror = () => {
      setError('Could not hear that clearly — you can also type your answer.');
      setIsListening(false);
    };
    instance.onend = () => {
      setIsListening(false);
    };

    try {
      instance.start();
      setIsListening(true);
      setError(null);
    } catch {
      setError('Microphone access was not granted. You can still type your answer.');
    }
  }

  return { isListening, isTranscribing, error, toggle };
}
