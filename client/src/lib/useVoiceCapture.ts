import { useRef, useState } from 'react';
import { transcribeVoice } from './api';

function toBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Unable to prepare the audio recording.'));
    reader.readAsDataURL(file);
  });
}

interface UseVoiceCaptureOptions {
  onTranscript: (text: string) => void;
}

export function useVoiceCapture({ onTranscript }: UseVoiceCaptureOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  async function toggle() {
    if (isListening && recorder.current) {
      recorder.current.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const next = new MediaRecorder(stream);
      recorder.current = next;
      next.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      next.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsListening(false);
        void (async () => {
          setIsTranscribing(true);
          try {
            const audio = new Blob(chunks, { type: next.mimeType || 'audio/webm' });
            const transcript = await transcribeVoice(await toBase64(audio), audio.type || 'audio/webm');
            onTranscript(transcript.text);
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Voice transcription could not be completed.');
          } finally {
            setIsTranscribing(false);
          }
        })();
      };
      next.start();
      setIsListening(true);
      setError(null);
    } catch {
      setError('Microphone access was not granted. You can still type your answer.');
    }
  }

  return { isListening, isTranscribing, error, toggle };
}
